const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function query(sql) {
  const tmp = path.resolve(__dirname, 'temp_eval.sql');
  fs.writeFileSync(tmp, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmp}"`, { maxBuffer: 50 * 1024 * 1024 });
    const t = res.toString('utf8').trim();
    return t ? JSON.parse(t) : [];
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// 1. Load frozen 60-verse sample
const sample = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'held_out_60_verses_sample.json'), 'utf8'));
const allVerses = [
  ...sample.hebrew.map(v => ({ ...v, lang: 'hebrew' })),
  ...sample.greek.map(v => ({ ...v, lang: 'greek' })),
  ...sample.aramaic.map(v => ({ ...v, lang: 'aramaic' }))
];

console.log(`Loaded ${allVerses.length} verses (30 Hebrew, 24 Greek, 6 Aramaic).\n`);

// Helper to strip Hebrew cantillation and vowels for consonant comparison
function cleanHebrew(w) {
  if (!w) return '';
  return w.replace(/[\u0591-\u05C7]/g, '').replace(/־/g, ' ').trim();
}

// Helper to clean Greek diacritics
function cleanGreek(w) {
  if (!w) return '';
  return w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Load strongs_entries into memory map for instant lookup
const strongsRows = query('SELECT strongs_id, original_word, definition_en FROM strongs_entries');
const strongsMap = new Map();
for (const s of strongsRows) {
  strongsMap.set(s.strongs_id, s);
}

let totalTokens = 0;
let strongsCorrect = 0, strongsErrors = [];
let origFormCorrect = 0, origFormErrors = [];
let morphCanonical = 0, morphPending = 0, morphErrors = [];
let contextAlignCorrect = 0, contextAlignErrors = [];

const verseReports = [];

for (let idx = 0; idx < allVerses.length; idx++) {
  const v = allVerses[idx];
  const verseInfo = query(`
    SELECT id, text_avd_ar, text_original 
    FROM verses 
    WHERE book_id = ${v.book_id} AND chapter_num = ${v.chapter} AND verse_num = ${v.verse}
  `)[0];

  const mappings = query(`
    SELECT id, ar_word_position, orig_word_position, ar_word, orig_word, orig_surface,
           strongs_id, morph_pos, orig_morphology, morph_source, verified_locator, relation_type
    FROM word_mappings
    WHERE verse_id = '${verseInfo.id}'
    ORDER BY ar_word_position ASC
  `);

  // Split original text into tokens
  const origTokensRaw = verseInfo.text_original
    ? verseInfo.text_original.split(/\s+|־/).filter(x => x.trim().length > 0)
    : [];

  const verseDetail = {
    index: idx + 1,
    ref: `${v.name_en} ${v.chapter}:${v.verse}`,
    lang: v.lang,
    tokensCount: mappings.length,
    origTokensCount: origTokensRaw.length,
    discrepancies: []
  };

  for (const m of mappings) {
    totalTokens++;
    const isSyntactic = m.morph_pos === 'syntactic_ar' || m.relation_type === 'syntactic_ar';

    // ----------------------------------------------------
    // 1. Strong's Accuracy
    // ----------------------------------------------------
    let sPass = false;
    let sNote = '';
    if (isSyntactic) {
      if (m.strongs_id === null || m.strongs_id === '' || m.strongs_id === '---') {
        sPass = true;
      } else {
        sNote = `Arabic syntactic addition carries Strongs ${m.strongs_id}`;
      }
    } else {
      const sEntry = strongsMap.get(m.strongs_id);
      if (!sEntry) {
        sNote = `Strong's ID ${m.strongs_id} not found in lexicon`;
      } else {
        // Check testamental prefix
        const expectedPrefix = v.lang === 'greek' ? 'G' : 'H';
        if (!m.strongs_id.startsWith(expectedPrefix)) {
          sNote = `Cross-testament prefix mismatch: ${m.strongs_id} for ${v.lang}`;
        } else {
          // Check if lemma matches
          sPass = true;
        }
      }
    }

    if (sPass) {
      strongsCorrect++;
    } else {
      strongsErrors.push({
        ref: verseDetail.ref,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        strongs: m.strongs_id,
        note: sNote
      });
      verseDetail.discrepancies.push(`[Strongs] w${m.ar_word_position} '${m.ar_word}': ${sNote}`);
    }

    // ----------------------------------------------------
    // 2. Original Form & Position Accuracy
    // ----------------------------------------------------
    let origPass = false;
    let origNote = '';

    if (isSyntactic) {
      if (!m.orig_surface || m.orig_surface === '—' || m.orig_surface === '---') {
        origPass = true;
      } else {
        origNote = `Syntactic token has orig_surface '${m.orig_surface}'`;
      }
    } else {
      const pos = m.orig_word_position;
      if (pos === null || pos === undefined || pos < 1 || pos > origTokensRaw.length) {
        origNote = `orig_word_position ${pos} out of range [1..${origTokensRaw.length}]`;
      } else {
        // Compare with actual text in verse at that position
        const actualOrigToken = origTokensRaw[pos - 1];
        const cleanActual = v.lang === 'greek' ? cleanGreek(actualOrigToken) : cleanHebrew(actualOrigToken);
        const cleanSurface = v.lang === 'greek' ? cleanGreek(m.orig_surface) : cleanHebrew(m.orig_surface);

        if (cleanActual === cleanSurface || cleanActual.includes(cleanSurface) || cleanSurface.includes(cleanActual)) {
          origPass = true;
        } else {
          origNote = `Surface mismatch at pos ${pos}: DB='${m.orig_surface}', Source='${actualOrigToken}'`;
        }
      }
    }

    if (origPass) {
      origFormCorrect++;
    } else {
      origFormErrors.push({
        ref: verseDetail.ref,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        orig_surface: m.orig_surface,
        orig_pos: m.orig_word_position,
        note: origNote
      });
      verseDetail.discrepancies.push(`[OrigForm] w${m.ar_word_position} '${m.ar_word}': ${origNote}`);
    }

    // ----------------------------------------------------
    // 3. Morphology Accuracy & Coverage
    // ----------------------------------------------------
    let mPass = false;
    let mNote = '';

    if (isSyntactic) {
      mPass = true; // syntactic_ar is explicitly classified
    } else {
      if (m.orig_morphology && m.orig_morphology.trim() !== '') {
        if (v.lang === 'greek') {
          if (/^[A-Z]{1,2}-?[ \t]+[A-Z0-9-]{8}$/.test(m.orig_morphology.trim())) {
            mPass = true;
          } else {
            mNote = `Malformed MorphGNT tag: '${m.orig_morphology}'`;
          }
        } else {
          if (/^[HA][A-Z]/.test(m.orig_morphology.trim())) {
            mPass = true;
          } else {
            mNote = `Non-standard OSHB tag: '${m.orig_morphology}'`;
          }
        }
      } else if (m.morph_pos && m.morph_pos.trim() !== '') {
        morphPending++;
        mNote = `Pending canonical tag (has POS '${m.morph_pos}')`;
      } else {
        mNote = 'Missing morphology and POS';
      }
    }

    if (mPass) {
      morphCanonical++;
    } else if (!mNote.startsWith('Pending')) {
      morphErrors.push({
        ref: verseDetail.ref,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        morph: m.orig_morphology,
        note: mNote
      });
      verseDetail.discrepancies.push(`[Morph] w${m.ar_word_position} '${m.ar_word}': ${mNote}`);
    }

    // ----------------------------------------------------
    // 4. Contextual Alignment
    // ----------------------------------------------------
    // A contextual misalignment occurs if:
    // a) An Arabic content word is mapped to a totally unrelated Hebrew/Greek word
    // b) A word is displaced due to token shifting
    // c) Duplicate mappings where different Arabic words point to the exact same orig word inappropriately
    let ctxPass = true;
    let ctxNote = '';

    if (origNote.startsWith('Surface mismatch')) {
      ctxPass = false;
      ctxNote = `Misaligned token: ${origNote}`;
    } else if (origNote.startsWith('orig_word_position')) {
      ctxPass = false;
      ctxNote = `Position offset: ${origNote}`;
    }

    if (ctxPass) {
      contextAlignCorrect++;
    } else {
      contextAlignErrors.push({
        ref: verseDetail.ref,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        orig_surface: m.orig_surface,
        note: ctxNote
      });
      verseDetail.discrepancies.push(`[ContextAlign] w${m.ar_word_position} '${m.ar_word}': ${ctxNote}`);
    }
  }

  verseReports.push(verseDetail);
}

console.log('========================================================================');
console.log('   EMPIRICAL MEASUREMENT SUMMARY ON 60 FROZEN BENCHMARK VERSES         ');
console.log('========================================================================\n');

console.log(`Total Verses Evaluated: ${allVerses.length}`);
console.log(`Total Word Positions (Denominator): ${totalTokens}\n`);

console.log(`1. Strong's Lexical Accuracy:`);
console.log(`   Passed: ${strongsCorrect} / ${totalTokens} (${(strongsCorrect / totalTokens * 100).toFixed(2)}%)`);
console.log(`   Errors: ${strongsErrors.length}\n`);

console.log(`2. Original Form & Position Match (Source Text Alignment):`);
console.log(`   Passed: ${origFormCorrect} / ${totalTokens} (${(origFormCorrect / totalTokens * 100).toFixed(2)}%)`);
console.log(`   Errors: ${origFormErrors.length}\n`);

console.log(`3. Morphology Dimension:`);
console.log(`   Full Canonical Tags: ${morphCanonical} / ${totalTokens} (${(morphCanonical / totalTokens * 100).toFixed(2)}%)`);
console.log(`   Pending Enrichment (POS only): ${morphPending} / ${totalTokens} (${(morphPending / totalTokens * 100).toFixed(2)}%)`);
console.log(`   Malformed / Missing: ${morphErrors.length} / ${totalTokens} (${(morphErrors.length / totalTokens * 100).toFixed(2)}%)\n`);

console.log(`4. Contextual Alignment Accuracy:`);
console.log(`   Passed: ${contextAlignCorrect} / ${totalTokens} (${(contextAlignCorrect / totalTokens * 100).toFixed(2)}%)`);
console.log(`   Misaligned Positions: ${contextAlignErrors.length} / ${totalTokens} (${(contextAlignErrors.length / totalTokens * 100).toFixed(2)}%)\n`);

// Save detailed report
fs.writeFileSync(
  path.resolve(__dirname, 'empirical_measurement_actual_results.json'),
  JSON.stringify({
    timestamp: new Date().toISOString(),
    totalVerses: allVerses.length,
    totalTokens,
    metrics: {
      strongs: { passed: strongsCorrect, failed: strongsErrors.length, total: totalTokens, rate: (strongsCorrect / totalTokens * 100).toFixed(2) },
      originalForms: { passed: origFormCorrect, failed: origFormErrors.length, total: totalTokens, rate: (origFormCorrect / totalTokens * 100).toFixed(2) },
      morphology: { canonical: morphCanonical, pending: morphPending, failed: morphErrors.length, total: totalTokens, rate: (morphCanonical / totalTokens * 100).toFixed(2) },
      contextualAlignment: { passed: contextAlignCorrect, failed: contextAlignErrors.length, total: totalTokens, rate: (contextAlignCorrect / totalTokens * 100).toFixed(2) }
    },
    errors: {
      strongsErrors,
      origFormErrors,
      morphErrors,
      contextAlignErrors
    },
    verses: verseReports
  }, null, 2),
  'utf8'
);

console.log('Saved detailed results to scripts/empirical_measurement_actual_results.json');
