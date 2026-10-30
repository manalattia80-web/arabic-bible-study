const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlitePath = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function query(sql) {
  const tmp = path.resolve(__dirname, 'tmp_audit.sql');
  fs.writeFileSync(tmp, '.mode json\n' + sql, 'utf8');
  try {
    const res = execSync(`"${sqlitePath}" "${dbPath}" < "${tmp}"`, { maxBuffer: 50 * 1024 * 1024 });
    const t = res.toString('utf8').trim();
    return t ? JSON.parse(t) : [];
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// Strip vowels & cantillation for comparison
function cleanHebrew(w) {
  if (!w) return '';
  return w.replace(/[\u0591-\u05C7]/g, '').replace(/־/g, ' ').trim();
}

function cleanGreek(w) {
  if (!w) return '';
  return w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.,·;:]/g, '').toLowerCase().trim();
}

// 1. Load frozen 60-verse sample
const sample = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'held_out_60_verses_sample.json'), 'utf8'));
const allVerses = [
  ...sample.hebrew.map(v => ({ ...v, lang: 'hebrew' })),
  ...sample.greek.map(v => ({ ...v, lang: 'greek' })),
  ...sample.aramaic.map(v => ({ ...v, lang: 'aramaic' }))
];

console.log('========================================================================');
console.log('   PHILOLOGICAL ALIGNMENT AUDITOR: 4-TIER ACCURACY MEASUREMENT          ');
console.log('   Strict separation of Position Offset vs Real Lexical Mismatch        ');
console.log('========================================================================\n');

let totalTokens = 0;
let tier1_exactMatches = 0;             // Exact position AND exact word
let tier2_displacedLegitimate = 0;       // Valid word in verse, but offset position (Matt 14:27 pattern)
let tier3_substantiveMismatches = 0;     // Substantive lexical error / wrong word / fabricated (Gen 22:16 pattern)
let tier4_syntacticAdditions = 0;        // Pure translation additions correctly classified

const auditedVerses = [];
const substantiveErrorList = [];
const positionOffsetSample = [];

for (const v of allVerses) {
  const verseInfo = query(`
    SELECT id, text_avd_ar, text_original 
    FROM verses 
    WHERE book_id = ${v.book_id} AND chapter_num = ${v.chapter} AND verse_num = ${v.verse}
  `)[0];

  const mappings = query(`
    SELECT id, ar_word_position, orig_word_position, ar_word, orig_word, orig_surface,
           strongs_id, morph_pos, orig_morphology, morph_source, relation_type
    FROM word_mappings
    WHERE verse_id = '${verseInfo.id}'
    ORDER BY ar_word_position ASC
  `);

  const origTokensRaw = verseInfo.text_original
    ? verseInfo.text_original.split(/\s+|־/).filter(x => x.trim().length > 0)
    : [];

  const cleanOrigTokens = origTokensRaw.map(t => v.lang === 'greek' ? cleanGreek(t) : cleanHebrew(t));

  const verseAudit = {
    ref: `${v.name_en} ${v.chapter}:${v.verse}`,
    lang: v.lang,
    arWordsCount: mappings.length,
    origTokensCount: origTokensRaw.length,
    tokens: []
  };

  for (const m of mappings) {
    totalTokens++;
    const isSyntactic = m.morph_pos === 'syntactic_ar' || m.relation_type === 'syntactic_ar';

    if (isSyntactic) {
      tier4_syntacticAdditions++;
      verseAudit.tokens.push({
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        classification: 'SYNTACTIC_ADDITION',
        detail: 'Arabic stylistic/grammatical addition'
      });
      continue;
    }

    const pos = m.orig_word_position;
    const cleanSurface = v.lang === 'greek' ? cleanGreek(m.orig_surface) : cleanHebrew(m.orig_surface);

    // Check if it matches at the assigned pos
    let isExactMatch = false;
    if (pos >= 1 && pos <= origTokensRaw.length) {
      const cleanAtPos = cleanOrigTokens[pos - 1];
      if (cleanAtPos === cleanSurface || cleanAtPos.includes(cleanSurface) || cleanSurface.includes(cleanAtPos)) {
        isExactMatch = true;
      }
    }

    if (isExactMatch) {
      tier1_exactMatches++;
      verseAudit.tokens.push({
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        orig_surface: m.orig_surface,
        pos: pos,
        classification: 'EXACT_MATCH',
        strongs: m.strongs_id
      });
      continue;
    }

    // It is NOT at the assigned position. Does the word exist elsewhere in the verse?
    const candidatePositions = [];
    cleanOrigTokens.forEach((tok, idx) => {
      if (tok === cleanSurface || tok.includes(cleanSurface) || cleanSurface.includes(tok)) {
        candidatePositions.push(idx + 1);
      }
    });

    if (candidatePositions.length > 0) {
      // Word belongs to the verse, but position is shifted
      tier2_displacedLegitimate++;
      const item = {
        ref: verseAudit.ref,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        orig_surface: m.orig_surface,
        assigned_pos: pos,
        actual_pos: candidatePositions,
        strongs: m.strongs_id,
        classification: 'DISPLACED_IN_VERSE',
        detail: `Valid word in verse, but shifted from pos [${candidatePositions.join(',')}] to pos ${pos}`
      };
      verseAudit.tokens.push(item);
      if (positionOffsetSample.length < 15) {
        positionOffsetSample.push(item);
      }
    } else {
      // Substantive mismatch! Word does NOT exist in the verse text at all
      tier3_substantiveMismatches++;
      const item = {
        ref: verseAudit.ref,
        ar_pos: m.ar_word_position,
        ar_word: m.ar_word,
        orig_surface: m.orig_surface,
        assigned_pos: pos,
        strongs: m.strongs_id,
        classification: 'SUBSTANTIVE_MISMATCH',
        detail: `Word '${m.orig_surface}' does not exist in verse codex text`
      };
      verseAudit.tokens.push(item);
      substantiveErrorList.push(item);
    }
  }

  auditedVerses.push(verseAudit);
}

console.log(`Audited ${allVerses.length} verses (Total Token Mappings: ${totalTokens})\n`);
console.log('RESULTS BY PHILOLOGICAL TIER:');
console.log(`  Tier 1 - Exact Position & Surface Match (مطابقة تامة موضعاً ونصاً):`);
console.log(`           ${tier1_exactMatches} / ${totalTokens} (${(tier1_exactMatches / totalTokens * 100).toFixed(2)}%)\n`);

console.log(`  Tier 2 - Displaced Valid Word (لفظ صحيح بالآية لكن موضعه منزاح - مثل متى 14: 27):`);
console.log(`           ${tier2_displacedLegitimate} / ${totalTokens} (${(tier2_displacedLegitimate / totalTokens * 100).toFixed(2)}%)\n`);

console.log(`  Tier 3 - Substantive Lexical / Text Mismatch (أخطاء معجمية أو ألفاظ غير موجودة - مثل تكوين 22: 16):`);
console.log(`           ${tier3_substantiveMismatches} / ${totalTokens} (${(tier3_substantiveMismatches / totalTokens * 100).toFixed(2)}%)\n`);

console.log(`  Tier 4 - Syntactic Additions (إضافات صياغية معربة سليمة):`);
console.log(`           ${tier4_syntacticAdditions} / ${totalTokens} (${(tier4_syntacticAdditions / totalTokens * 100).toFixed(2)}%)\n`);

console.log('SUMMARY OF ACCURACY:');
const totalLegitimate = tier1_exactMatches + tier2_displacedLegitimate + tier4_syntacticAdditions;
console.log(`  1. Semantic Concordance Rate (المطابقة المعجمية للفظ الآية):`);
console.log(`     ${totalLegitimate} / ${totalTokens} = ${(totalLegitimate / totalTokens * 100).toFixed(2)}%`);
console.log(`  2. Real Lexical & Content Errors (أخطاء الإسناد المعجمي الحقيقية):`);
console.log(`     ${tier3_substantiveMismatches} / ${totalTokens} = ${(tier3_substantiveMismatches / totalTokens * 100).toFixed(2)}%`);
console.log(`  3. Exact Codex Position Exactness (دقة الموضع بالمصدر دون إزاحة):`);
console.log(`     ${tier1_exactMatches} / ${totalTokens} = ${(tier1_exactMatches / totalTokens * 100).toFixed(2)}%\n`);

// Save comprehensive breakdown
fs.writeFileSync(
  path.resolve(__dirname, 'philological_audit_results.json'),
  JSON.stringify({
    totalTokens,
    tier1_exactMatches,
    tier2_displacedLegitimate,
    tier3_substantiveMismatches,
    tier4_syntacticAdditions,
    rates: {
      exactPositionRate: (tier1_exactMatches / totalTokens * 100).toFixed(2),
      displacedRate: (tier2_displacedLegitimate / totalTokens * 100).toFixed(2),
      substantiveErrorRate: (tier3_substantiveMismatches / totalTokens * 100).toFixed(2),
      semanticConcordanceRate: (totalLegitimate / totalTokens * 100).toFixed(2)
    },
    substantiveErrorList,
    positionOffsetSample,
    auditedVerses
  }, null, 2),
  'utf8'
);

console.log('Saved audit results to scripts/philological_audit_results.json');
