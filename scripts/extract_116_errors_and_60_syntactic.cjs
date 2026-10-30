const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function query(sql) {
  const tmp = path.resolve(__dirname, 'tmp_extract.sql');
  fs.writeFileSync(tmp, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmp}"`, { maxBuffer: 50 * 1024 * 1024 });
    const t = res.toString('utf8').trim();
    return t ? JSON.parse(t) : [];
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// Strip vowels & cantillation
function cleanHebrew(w) {
  if (!w) return '';
  return w.replace(/[\u0591-\u05C7]/g, '').replace(/־/g, ' ').trim();
}

function cleanGreek(w) {
  if (!w) return '';
  return w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,·;:]/g, '').toLowerCase().trim();
}

const sample = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'held_out_60_verses_sample.json'), 'utf8'));
const allVerses = [
  ...sample.hebrew.map(v => ({ ...v, lang: 'hebrew' })),
  ...sample.greek.map(v => ({ ...v, lang: 'greek' })),
  ...sample.aramaic.map(v => ({ ...v, lang: 'aramaic' }))
];

const substantiveErrors = [];
const syntacticAdditions = [];
const displacedPositions = [];
const exactMatches = [];

for (const v of allVerses) {
  const verseInfo = query(`
    SELECT id, text_avd_ar, text_original 
    FROM verses 
    WHERE book_id = ${v.book_id} AND chapter_num = ${v.chapter} AND verse_num = ${v.verse}
  `)[0];

  const mappings = query(`
    SELECT id, ar_word_position, orig_word_position, ar_word, orig_word, orig_surface,
           strongs_id, morph_pos, orig_morphology, morph_source, relation_type, grammar_notes
    FROM word_mappings
    WHERE verse_id = '${verseInfo.id}'
    ORDER BY ar_word_position ASC
  `);

  const origTokensRaw = verseInfo.text_original
    ? verseInfo.text_original.split(/\s+|־/).filter(x => x.trim().length > 0)
    : [];

  const cleanOrigTokens = origTokensRaw.map(t => v.lang === 'greek' ? cleanGreek(t) : cleanHebrew(t));

  for (const m of mappings) {
    const isSyntactic = m.morph_pos === 'syntactic_ar' || m.relation_type === 'syntactic_ar';
    const isCompoundPhrase = m.relation_type === 'compound_phrase';

    if (isSyntactic || isCompoundPhrase) {
      syntacticAdditions.push({
        ref: `${v.name_en} ${v.chapter}:${v.verse}`,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        relation_type: m.relation_type,
        notes: m.grammar_notes,
        is_isolated_addition: isSyntactic,
        is_phrasal_component: isCompoundPhrase
      });
      continue;
    }

    const pos = m.orig_word_position;
    const cleanSurface = v.lang === 'greek' ? cleanGreek(m.orig_surface) : cleanHebrew(m.orig_surface);

    let isExact = false;
    if (pos >= 1 && pos <= origTokensRaw.length) {
      const cleanAtPos = cleanOrigTokens[pos - 1];
      if (cleanAtPos === cleanSurface || cleanAtPos.includes(cleanSurface) || cleanSurface.includes(cleanAtPos)) {
        isExact = true;
      }
    }

    if (isExact) {
      exactMatches.push({
        ref: `${v.name_en} ${v.chapter}:${v.verse}`,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        orig_surface: m.orig_surface,
        pos
      });
      continue;
    }

    // Check if it exists elsewhere in the verse
    const found = [];
    cleanOrigTokens.forEach((tok, idx) => {
      if (tok === cleanSurface || tok.includes(cleanSurface) || cleanSurface.includes(tok)) {
        found.push(idx + 1);
      }
    });

    if (found.length > 0) {
      displacedPositions.push({
        ref: `${v.name_en} ${v.chapter}:${v.verse}`,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        orig_surface: m.orig_surface,
        current_orig_pos: pos,
        actual_codex_positions: found,
        strongs_id: m.strongs_id
      });
    } else {
      substantiveErrors.push({
        ref: `${v.name_en} ${v.chapter}:${v.verse}`,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        assigned_surface: m.orig_surface,
        assigned_lemma: m.orig_word,
        assigned_strongs: m.strongs_id,
        current_orig_pos: pos,
        morph_pos: m.morph_pos
      });
    }
  }
}

console.log('========================================================================');
console.log('   AUDIT EXTRACTION SUMMARY FOR RELEASE 332                             ');
console.log('========================================================================\n');
console.log(`1. Exact Matches (سليمة تماماً): ${exactMatches.length}`);
console.log(`2. Displaced Positions (مواضع منزاحة مع لفظ صحيح): ${displacedPositions.length}`);
console.log(`3. Substantive Errors (أخطاء معجمية وصورية): ${substantiveErrors.length}`);
console.log(`4. Syntactic / Phrasal Additions (إضافات صياغية وتركيبية): ${syntacticAdditions.length}\n`);

// Save catalogs
fs.writeFileSync(
  path.resolve(__dirname, 'substantive_errors_116_catalog.json'),
  JSON.stringify(substantiveErrors, null, 2),
  'utf8'
);

fs.writeFileSync(
  path.resolve(__dirname, 'syntactic_additions_60_catalog.json'),
  JSON.stringify(syntacticAdditions, null, 2),
  'utf8'
);

fs.writeFileSync(
  path.resolve(__dirname, 'displaced_positions_482_catalog.json'),
  JSON.stringify(displacedPositions, null, 2),
  'utf8'
);

console.log('Saved catalogs:');
console.log('  - scripts/substantive_errors_116_catalog.json');
console.log('  - scripts/syntactic_additions_60_catalog.json');
console.log('  - scripts/displaced_positions_482_catalog.json');
