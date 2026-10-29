const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

console.log('========================================================================');
console.log('   FULL PHILOLOGICAL & 4D MEASUREMENT ON FROZEN 60-VERSE SAMPLE        ');
console.log('   Sample: صفر تداخل مع سجل الاستبعاد الموثق (v2.0.0)                 ');
console.log('========================================================================\n');

// 1. Load the frozen sample
const sampleFile = path.resolve(__dirname, 'held_out_60_verses_sample.json');
const sampleData = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));

const allSampleVerses = [
  ...sampleData.hebrew.map(v => ({ ...v, lang: 'hebrew' })),
  ...sampleData.greek.map(v => ({ ...v, lang: 'greek' })),
  ...sampleData.aramaic.map(v => ({ ...v, lang: 'aramaic' }))
];

function queryJson(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_eval_60.sql');
  fs.writeFileSync(tmpFile, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    const text = res.toString('utf8').trim();
    return text ? JSON.parse(text) : [];
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// 2. Fetch all mappings for all 60 verses
let totalWords = 0;
let resultsByVerse = [];

let lexicalPass = 0, lexicalFail = 0, lexicalPending = 0;
let surfacePass = 0, surfaceFail = 0, surfacePending = 0;
let morphPass = 0, morphFail = 0, morphPending = 0;
let locatorPass = 0, locatorFail = 0, locatorPending = 0;

for (let i = 0; i < allSampleVerses.length; i++) {
  const v = allSampleVerses[i];
  const rows = queryJson(`
    SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word,
           wm.orig_surface, wm.orig_word_position, wm.orig_morphology, wm.morph_pos,
           wm.morph_source, wm.verified_source, wm.verified_locator, wm.relation_type,
           wm.grammar_notes
    FROM word_mappings wm
    JOIN verses ver ON wm.verse_id = ver.id
    WHERE ver.book_id = ${v.book_id} AND ver.chapter_num = ${v.chapter} AND ver.verse_num = ${v.verse}
    ORDER BY wm.ar_word_position ASC;
  `);

  const verseWordEvaluations = [];

  for (const r of rows) {
    totalWords++;

    // 1. Lexical dimension: Valid strongs_id, not orphan, correct language prefix
    let lexVerdict = 'pass';
    let lexReason = '';
    if (r.morph_pos === 'syntactic_ar') {
      if (r.strongs_id !== null) {
        lexVerdict = 'fail';
        lexReason = 'syntactic_ar carries non-null Strongs ID';
      }
    } else {
      if (!r.strongs_id || r.strongs_id === '---' || r.strongs_id.trim() === '') {
        lexVerdict = 'pending';
        lexReason = 'Missing Strongs ID on non-syntactic word';
      } else {
        const expectedPrefix = v.lang === 'greek' ? 'G' : 'H';
        if (!r.strongs_id.startsWith(expectedPrefix)) {
          lexVerdict = 'fail';
          lexReason = `Cross-testament Strongs: expected ${expectedPrefix}, got ${r.strongs_id}`;
        }
      }
    }

    // 2. Surface dimension: Orig surface not empty, correct script
    let surfVerdict = 'pass';
    let surfReason = '';
    if (r.morph_pos === 'syntactic_ar') {
      if (r.orig_surface && r.orig_surface !== '—' && r.orig_surface.trim() !== '') {
        surfVerdict = 'fail';
        surfReason = 'syntactic_ar carries original surface text';
      }
    } else {
      if (!r.orig_surface || r.orig_surface.trim() === '' || r.orig_surface === '---') {
        surfVerdict = 'pending';
        surfReason = 'Empty original surface form';
      } else {
        // Check for Arabic characters accidentally embedded in original fields
        if (/[\u0600-\u06FF]/.test(r.orig_surface) || /[\u0600-\u06FF]/.test(r.orig_word || '')) {
          surfVerdict = 'fail';
          surfReason = 'Arabic script characters mixed into original Hebrew/Greek surface';
        }
      }
    }

    // 3. Morphology dimension: Valid part of speech, raw morphology format
    let morphVerdict = 'pass';
    let morphReason = '';
    if (r.morph_pos === 'syntactic_ar') {
      // Valid Arabic structural addition
    } else {
      if (!r.morph_pos || r.morph_pos.trim() === '') {
        morphVerdict = 'pending';
        morphReason = 'Missing morph_pos classification';
      } else if (r.orig_morphology) {
        if (v.lang === 'greek' && r.morph_source === 'morphgnt_sblgnt') {
          // MorphGNT format check: 1-2 letters (V-, N-, A-, RP, RD, RA, RI, etc.) + 8-char slots
          if (!/^[A-Z]{1,2}-?[ \t]+[A-Z0-9-]{8}$/.test(r.orig_morphology.trim())) {
            morphVerdict = 'fail';
            morphReason = `Malformed MorphGNT raw tag: "${r.orig_morphology}"`;
          }
        } else if (v.lang === 'hebrew' || v.lang === 'aramaic') {
          // OSHB format check (e.g. "HVqi3ms", "HNcmsa", "HR/Sp2ms", etc.)
          if (!/^[HA][A-Z]/.test(r.orig_morphology.trim())) {
            morphVerdict = 'fail';
            morphReason = `Non-standard OSHB raw tag: "${r.orig_morphology}"`;
          }
        }
      } else {
        morphVerdict = 'pending';
        morphReason = 'Missing raw morphology tag on content word';
      }
    }

    // 4. Locator dimension: Canonical format, non-null pos with codex locator
    let locVerdict = 'pass';
    let locReason = '';
    if (r.morph_pos === 'syntactic_ar') {
      if (r.verified_locator && !r.verified_locator.startsWith('AR_SYNTACTIC:')) {
        locVerdict = 'fail';
        locReason = 'syntactic_ar claims codex locator';
      }
    } else {
      if (!r.verified_locator || r.verified_locator.trim() === '' || r.verified_locator === '-') {
        locVerdict = 'pending';
        locReason = 'Missing verified locator';
      } else {
        const hasCodex = r.verified_locator.startsWith('OSHB:') || r.verified_locator.startsWith('SBLGNT:') || r.verified_locator.startsWith('TR:');
        if (hasCodex && r.orig_word_position === null) {
          locVerdict = 'fail';
          locReason = 'Codex locator present but orig_word_position is null';
        } else if (r.verified_locator.includes('.w') && !r.verified_locator.includes('-')) {
          const expectedPos = parseInt(r.verified_locator.substring(r.verified_locator.indexOf('.w') + 2), 10);
          if (!isNaN(expectedPos) && r.orig_word_position !== expectedPos) {
            locVerdict = 'fail';
            locReason = `Position mismatch: locator specifies w${expectedPos} but orig_word_position is ${r.orig_word_position}`;
          }
        }
      }
    }

    // Accumulate
    if (lexVerdict === 'pass') lexicalPass++;
    else if (lexVerdict === 'fail') lexicalFail++;
    else lexicalPending++;

    if (surfVerdict === 'pass') surfacePass++;
    else if (surfVerdict === 'fail') surfaceFail++;
    else surfacePending++;

    if (morphVerdict === 'pass') morphPass++;
    else if (morphVerdict === 'fail') morphFail++;
    else morphPending++;

    if (locVerdict === 'pass') locatorPass++;
    else if (locVerdict === 'fail') locatorFail++;
    else locatorPending++;

    verseWordEvaluations.push({
      ar_pos: r.ar_word_position,
      ar_word: r.ar_word,
      strongs: r.strongs_id,
      orig_surface: r.orig_surface,
      orig_pos: r.orig_word_position,
      locator: r.verified_locator,
      scores: {
        lexical: { verdict: lexVerdict, reason: lexReason },
        surface: { verdict: surfVerdict, reason: surfReason },
        morphology: { verdict: morphVerdict, reason: morphReason },
        locator: { verdict: locVerdict, reason: locReason }
      }
    });
  }

  resultsByVerse.push({
    verse_num_in_sample: i + 1,
    book_id: v.book_id,
    book_name_en: v.name_en,
    chapter: v.chapter,
    verse: v.verse,
    lang: v.lang,
    text_ar: v.text_ar,
    words_count: rows.length,
    words: verseWordEvaluations
  });
}

console.log(`Evaluated ${resultsByVerse.length} verses (${totalWords} total token positions):\n`);

function printMetric(label, pass, fail, pending, total) {
  const rate = ((pass / total) * 100).toFixed(2);
  console.log(`▶ ${label}:`);
  console.log(`  Passed:  ${pass} / ${total} (${rate}%)`);
  console.log(`  Failed:  ${fail} / ${total} (${((fail / total) * 100).toFixed(2)}%)`);
  console.log(`  Pending: ${pending} / ${total} (${((pending / total) * 100).toFixed(2)}%)`);
  console.log(`  Strict Formula: (${pass}) / (${pass} + ${fail} + ${pending}) = ${pass} / ${total}\n`);
}

printMetric('1. LEXICAL ACCURACY (المطابقة المعجمية)', lexicalPass, lexicalFail, lexicalPending, totalWords);
printMetric('2. SURFACE ACCURACY (مطابقة اللفظ المصدر)', surfacePass, surfaceFail, surfacePending, totalWords);
printMetric('3. MORPHOLOGICAL ACCURACY (المطابقة الصرفية)', morphPass, morphFail, morphPending, totalWords);
printMetric('4. LOCATOR ACCURACY (مطابقة الموضع للمصدر)', locatorPass, locatorFail, locatorPending, totalWords);

// 3. Save comprehensive evaluation report
const evalReport = {
  measurement_timestamp: new Date().toISOString(),
  sample_version: '2.0.0',
  sample_title: 'عينة القياس المجمدة (صفر تداخل مع سجل الاستبعاد الموثق)',
  provenance_note: 'Strictly zero overlap with the 1,603 unique historical verses across all 16 historical project files.',
  total_verses_evaluated: resultsByVerse.length,
  total_token_positions: totalWords,
  metrics_summary: {
    lexical: { passed: lexicalPass, failed: lexicalFail, pending: lexicalPending, total: totalWords, rate: ((lexicalPass / totalWords) * 100).toFixed(2) },
    surface: { passed: surfacePass, failed: surfaceFail, pending: surfacePending, total: totalWords, rate: ((surfacePass / totalWords) * 100).toFixed(2) },
    morphology: { passed: morphPass, failed: morphFail, pending: morphPending, total: totalWords, rate: ((morphPass / totalWords) * 100).toFixed(2) },
    locator: { passed: locatorPass, failed: locatorFail, pending: locatorPending, total: totalWords, rate: ((locatorPass / totalWords) * 100).toFixed(2) }
  },
  verse_evaluations: resultsByVerse
};

const evalReportPath = path.resolve(__dirname, 'frozen_sample_v2_evaluation_report.json');
fs.writeFileSync(evalReportPath, JSON.stringify(evalReport, null, 2), 'utf8');
console.log(`Full measurement report successfully written to ${evalReportPath}`);
