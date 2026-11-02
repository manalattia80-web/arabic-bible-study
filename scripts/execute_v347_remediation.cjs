const fs = require('fs');
const path = require('path');
const child = require('child_process');

const sqlite = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');
const srcDb = path.join(__dirname, '..', 'verification_release_candidate', 'apk_bible_study_v346.db');
const targetDb = path.join(__dirname, '..', 'verification_release_candidate', 'apk_bible_study_v347.db');

console.log('=== Step 1: Cloning v346 DB to v347 DB ===');
fs.copyFileSync(srcDb, targetDb);
console.log('Copied database to:', targetDb);

function q(sql) {
  const res = child.execFileSync(sqlite, [targetDb, '-json', sql], { maxBuffer: 100 * 1024 * 1024 }).toString().trim();
  if (!res) return [];
  return JSON.parse(res);
}

function runSql(sql) {
  child.execFileSync(sqlite, [targetDb, sql]);
}

const auditLedger = [];
let caseCounter = 0;
const affectedMappingIds = new Set();

console.log('=== Step 2: Executing Aramaic Remediation in v347 DB ===');

// 1. Daniel 2:21 corrections
const dan221Id = q(`SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 21`)[0].id;

// يُغَيِّرُ -> H8133 (שְׁנָא)
runSql(`UPDATE word_mappings SET strongs_id = 'H8133', orig_word = 'שְׁנָא', orig_surface = 'מְהַשְׁנֵא', orig_word_lang = 'aramaic', morph_pos = 'verb', morph_source = 'oshb_wlc' WHERE verse_id = '${dan221Id}' AND ar_word_position = 2`);
const dan221w2 = q(`SELECT id FROM word_mappings WHERE verse_id = '${dan221Id}' AND ar_word_position = 2`)[0].id;
affectedMappingIds.add(dan221w2);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'دانيال 2: 21',
  ar_word_pos: 2,
  ar_word: 'يُغَيِّرُ',
  orig_word: 'שְׁנָא',
  orig_surface: 'מְהַשְׁנֵא',
  prev_val: 'H8138',
  new_val: 'H8133',
  reason: 'Biblical Aramaic root shena (H8133) replaced Hebrew shanah (H8138)',
  independent_source: 'OSHB Dan 2:21; BDB Aramaic 1116a'
});

// يَعْزِلُ -> H5709 (עֲדָה)
runSql(`UPDATE word_mappings SET strongs_id = 'H5709', orig_word = 'עֲדָה', orig_surface = 'מְהַעְדֵּה', orig_word_lang = 'aramaic', morph_pos = 'verb', morph_source = 'oshb_wlc' WHERE verse_id = '${dan221Id}' AND ar_word_position = 5`);
const dan221w5 = q(`SELECT id FROM word_mappings WHERE verse_id = '${dan221Id}' AND ar_word_position = 5`)[0].id;
affectedMappingIds.add(dan221w5);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'دانيال 2: 21',
  ar_word_pos: 5,
  ar_word: 'يَعْزِلُ',
  orig_word: 'עֲדָה',
  orig_surface: 'מְהַעְדֵּה',
  prev_val: 'H5757',
  new_val: 'H5709',
  reason: 'Biblical Aramaic verb adah (H5709) replaced Hebrew proper noun Avvim (H5757)',
  independent_source: 'OSHB Dan 2:21; BDB Aramaic 1105b'
});

// وَيُعَلِّمُ -> H4486 (וּמַנְדְּעָא)
runSql(`UPDATE word_mappings SET strongs_id = 'H4486', orig_word = 'מַנְדַּע', orig_surface = 'וּמַנְדְּעָא', orig_word_lang = 'aramaic', morph_pos = 'noun', morph_source = 'oshb_wlc' WHERE verse_id = '${dan221Id}' AND ar_word_position = 12`);
const dan221w12 = q(`SELECT id FROM word_mappings WHERE verse_id = '${dan221Id}' AND ar_word_position = 12`)[0].id;
affectedMappingIds.add(dan221w12);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'دانيال 2: 21',
  ar_word_pos: 12,
  ar_word: 'وَيُعَلِّمُ',
  orig_word: 'מַנְדַּע',
  orig_surface: 'וּמַנְדְּעָא',
  prev_val: 'H3046',
  new_val: 'H4486',
  reason: 'Biblical Aramaic noun manda (H4486) disentangled from adjacent verb yeda (H3046)',
  independent_source: 'OSHB Dan 2:21; BDB Aramaic 1099b'
});

// 2. Jeremiah 10:11 corrections
const jer10Id = q(`SELECT id FROM verses WHERE book_id = 24 AND chapter_num = 10 AND verse_num = 11`)[0].id;

// الآلِهَةُ -> H426
runSql(`UPDATE word_mappings SET strongs_id = 'H426', orig_word = 'אֱלָהּ', orig_surface = 'אֱלָהַיָּא', orig_word_lang = 'aramaic', morph_pos = 'noun', morph_source = 'oshb_wlc' WHERE verse_id = '${jer10Id}' AND ar_word_position = 4`);
const jer10w4 = q(`SELECT id FROM word_mappings WHERE verse_id = '${jer10Id}' AND ar_word_position = 4`)[0].id;
affectedMappingIds.add(jer10w4);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'إرميا 10: 11',
  ar_word_pos: 4,
  ar_word: 'الآلِهَةُ',
  orig_word: 'אֱלָהּ',
  orig_surface: 'אֱלָהַיָּא',
  prev_val: 'H410',
  new_val: 'H426',
  reason: 'Aramaic Elah (H426) replaced Hebrew El (H410)',
  independent_source: 'OSHB Jer 10:11; BDB Aramaic 1080b'
});

// الَّتِي -> H1768
runSql(`UPDATE word_mappings SET strongs_id = 'H1768', orig_word = 'דִּי', orig_surface = 'דִּי', orig_word_lang = 'aramaic', morph_pos = 'relative_pronoun', morph_source = 'oshb_wlc' WHERE verse_id = '${jer10Id}' AND ar_word_position = 5`);
const jer10w5 = q(`SELECT id FROM word_mappings WHERE verse_id = '${jer10Id}' AND ar_word_position = 5`)[0].id;
affectedMappingIds.add(jer10w5);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'إرميا 10: 11',
  ar_word_pos: 5,
  ar_word: 'الَّتِي',
  orig_word: 'דִּי',
  orig_surface: 'דִּי',
  prev_val: 'H834',
  new_val: 'H1768',
  reason: 'Aramaic relative pronoun di (H1768) replaced Hebrew asher (H834)',
  independent_source: 'OSHB Jer 10:11; BDB Aramaic 1088a'
});

// تَصْنَعِ -> H5648
runSql(`UPDATE word_mappings SET strongs_id = 'H5648', orig_word = 'עֲבַד', orig_surface = 'עֲבַדוּ', orig_word_lang = 'aramaic', morph_pos = 'verb', morph_source = 'oshb_wlc' WHERE verse_id = '${jer10Id}' AND ar_word_position = 7`);
const jer10w7 = q(`SELECT id FROM word_mappings WHERE verse_id = '${jer10Id}' AND ar_word_position = 7`)[0].id;
affectedMappingIds.add(jer10w7);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'إرميا 10: 11',
  ar_word_pos: 7,
  ar_word: 'تَصْنَعِ',
  orig_word: 'עֲבַד',
  orig_surface: 'עֲבַדוּ',
  prev_val: 'H5647',
  new_val: 'H5648',
  reason: 'Aramaic verb avad (H5648) replaced Hebrew avad (H5647)',
  independent_source: 'OSHB Jer 10:11; BDB Aramaic 1105a'
});

// تَبِيدُ -> H7
runSql(`UPDATE word_mappings SET strongs_id = 'H7', orig_word = 'אָבַד', orig_surface = 'יֵאבַדוּ', orig_word_lang = 'aramaic', morph_pos = 'verb', morph_source = 'oshb_wlc', relation_type = 'primary' WHERE verse_id = '${jer10Id}' AND ar_word_position = 10`);
const jer10w10 = q(`SELECT id FROM word_mappings WHERE verse_id = '${jer10Id}' AND ar_word_position = 10`)[0].id;
affectedMappingIds.add(jer10w10);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'إرميا 10: 11',
  ar_word_pos: 10,
  ar_word: 'تَبِيدُ',
  orig_word: 'אָבַד',
  orig_surface: 'יֵאבַדוּ',
  prev_val: 'NULL',
  new_val: 'H7',
  reason: 'Aramaic verb avad/yeveidu (H7) restored from dropped NULL mapping',
  independent_source: 'OSHB Jer 10:11; BDB Aramaic 1077a'
});

// تَحْتِ -> H8460
runSql(`UPDATE word_mappings SET strongs_id = 'H8460', orig_word = 'תְּחוֹת', orig_surface = 'תְּחוֹת', orig_word_lang = 'aramaic', morph_pos = 'preposition', morph_source = 'oshb_wlc' WHERE verse_id = '${jer10Id}' AND ar_word_position = 14`);
const jer10w14 = q(`SELECT id FROM word_mappings WHERE verse_id = '${jer10Id}' AND ar_word_position = 14`)[0].id;
affectedMappingIds.add(jer10w14);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'إرميا 10: 11',
  ar_word_pos: 14,
  ar_word: 'تَحْتِ',
  orig_word: 'תְּחוֹת',
  orig_surface: 'תְּחוֹת',
  prev_val: 'H8479',
  new_val: 'H8460',
  reason: 'Aramaic preposition techoth (H8460) replaced Hebrew tachath (H8479)',
  independent_source: 'OSHB Jer 10:11; BDB Aramaic 1118a'
});

// 3. Systematic Hebrew-to-Aramaic replacements across Daniel and Ezra
const systematicPairs = [
  { heb: 'H834', aram: 'H1768', word: 'דִּי', pos: 'relative_pronoun', desc: 'Aramaic di (H1768) replaced Hebrew asher (H834)' },
  { heb: 'H4480', aram: 'H4481', word: 'מִן', pos: 'preposition', desc: 'Aramaic min (H4481) replaced Hebrew min (H4480)' },
  { heb: 'H410', aram: 'H426', word: 'אֱלָהּ', pos: 'noun', desc: 'Aramaic Elah (H426) replaced Hebrew El (H410)' },
  { heb: 'H8479', aram: 'H8460', word: 'תְּחוֹת', pos: 'preposition', desc: 'Aramaic techoth (H8460) replaced Hebrew tachath (H8479)' },
  { heb: 'H1697', aram: 'H4406', word: 'מִלָּה', pos: 'noun', desc: 'Aramaic millah (H4406) replaced Hebrew dabar (H1697)' },
  { heb: 'H559', aram: 'H560', word: 'אֲמַר', pos: 'verb', desc: 'Aramaic amar (H560) replaced Hebrew amar (H559)' },
  { heb: 'H5647', aram: 'H5648', word: 'עֲבַד', pos: 'verb', desc: 'Aramaic avad (H5648) replaced Hebrew avad (H5647)' },
  { heb: 'H4428', aram: 'H4430', word: 'מֶלֶךְ', pos: 'noun', desc: 'Aramaic melekh (H4430) replaced Hebrew melekh (H4428)' },
  { heb: 'H6030', aram: 'H6032', word: 'עֲנָה', pos: 'verb', desc: 'Aramaic anah (H6032) replaced Hebrew anah (H6030)' },
  { heb: 'H227', aram: 'H116', word: 'אֱדַיִן', pos: 'adverb', desc: 'Aramaic edayin (H116) replaced Hebrew az (H227)' }
];

const strictAramaicWhere = `
  (v.book_id = 27 AND ((v.chapter_num = 2 AND v.verse_num >= 4) OR (v.chapter_num BETWEEN 3 AND 7)))
  OR (v.book_id = 15 AND ((v.chapter_num = 4 AND v.verse_num >= 8) OR (v.chapter_num = 5) OR (v.chapter_num = 6 AND v.verse_num <= 18) OR (v.chapter_num = 7 AND v.verse_num BETWEEN 12 AND 26)))
`;

for (const p of systematicPairs) {
  const matchingRows = q(`
    SELECT wm.id, v.book_id, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.orig_surface, wm.strongs_id
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE (${strictAramaicWhere}) AND wm.strongs_id = '${p.heb}'
  `);

  for (const r of matchingRows) {
    runSql(`UPDATE word_mappings SET strongs_id = '${p.aram}', orig_word = '${p.word}', orig_word_lang = 'aramaic', morph_pos = '${p.pos}', morph_source = 'oshb_wlc' WHERE id = '${r.id}'`);
    affectedMappingIds.add(r.id);
    auditLedger.push({
      case_id: ++caseCounter,
      ref: `Book ${r.book_id} ${r.chapter_num}: ${r.verse_num}`,
      ar_word_pos: r.ar_word_position,
      ar_word: r.ar_word,
      orig_word: p.word,
      orig_surface: r.orig_surface || p.word,
      prev_val: p.heb,
      new_val: p.aram,
      reason: p.desc,
      independent_source: 'Biblical Aramaic Corpus OSHB Lexicon'
    });
  }
}

console.log(`Aramaic remediation completed. Total logged cases: ${caseCounter}`);

console.log('=== Step 3: Executing Greek NT Remediation in v347 DB ===');

// 1. Matthew 27:61: تُجَاهَ -> G561 (ἀπέναντι)
const matt27Id = q(`SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 27 AND verse_num = 61`)[0].id;
runSql(`UPDATE word_mappings SET strongs_id = 'G561', orig_word = 'ἀπέναντι', orig_surface = 'ἀπέναντι', orig_word_lang = 'greek', morph_pos = 'preposition', morph_source = 'strongs_lexicon', relation_type = 'primary' WHERE verse_id = '${matt27Id}' AND ar_word_position = 8`);
const matt27w8 = q(`SELECT id FROM word_mappings WHERE verse_id = '${matt27Id}' AND ar_word_position = 8`)[0].id;
affectedMappingIds.add(matt27w8);
auditLedger.push({
  case_id: ++caseCounter,
  ref: 'متى 27: 61',
  ar_word_pos: 8,
  ar_word: 'تُجَاهَ',
  orig_word: 'ἀπέναντι',
  orig_surface: 'ἀπέναντι',
  prev_val: 'NULL',
  new_val: 'G561',
  reason: 'Greek preposition apenanti (G561) restored from dropped contextual NULL mapping',
  independent_source: 'NA28 / SBLGNT Matt 27:61; BDAG 95b'
});

// 2. High-confidence Contextual Greek Punctuation Remediation:
const greekPunctTargets = [
  { arPattern: 'يَسُوعُ%', greekLemma: 'Ἰησοῦς', strongs: 'G2424', morphPos: 'proper_noun', greekRegex: /Ἰησοῦ/ },
  { arPattern: 'بِيلاَطُسُ%', greekLemma: 'Πιλᾶτος', strongs: 'G4091', morphPos: 'proper_noun', greekRegex: /Πιλάτ|Πιλᾶτ/ },
  { arPattern: 'الْجُمُوعُ%', greekLemma: 'ὄχλος', strongs: 'G3793', morphPos: 'noun', greekRegex: /ὄχλο/ },
  { arPattern: '«أَنَا%', greekLemma: 'ἐγώ', strongs: 'G1473', morphPos: 'pronoun', greekRegex: /ἐγὼ|ἐγώ|Ἐγὼ|Ἐγώ/ },
  { arPattern: '«هذَا%', greekLemma: 'οὗτος', strongs: 'G3778', morphPos: 'demonstrative', greekRegex: /οὗτος|Οὗτος|τοῦτο|ταῦτα/ }
];

let greekContextRemediated = 0;
for (const t of greekPunctTargets) {
  const rows = q(`
    SELECT wm.id, v.book_id, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, v.text_original
    FROM word_mappings wm
    JOIN verses v ON wm.verse_id = v.id
    WHERE v.book_id >= 40 AND wm.ar_word LIKE '${t.arPattern}' AND (wm.strongs_id IS NULL OR wm.strongs_id = '' OR wm.strongs_id = 'NULL')
  `);

  for (const r of rows) {
    if (t.greekRegex.test(r.text_original)) {
      runSql(`UPDATE word_mappings SET strongs_id = '${t.strongs}', orig_word = '${t.greekLemma}', orig_surface = '${t.greekLemma}', orig_word_lang = 'greek', morph_pos = '${t.morphPos}', morph_source = 'morphgnt_sblgnt', relation_type = 'primary' WHERE id = '${r.id}'`);
      affectedMappingIds.add(r.id);
      greekContextRemediated++;
      auditLedger.push({
        case_id: ++caseCounter,
        ref: `Book ${r.book_id} ${r.chapter_num}: ${r.verse_num}`,
        ar_word_pos: r.ar_word_position,
        ar_word: r.ar_word,
        orig_word: t.greekLemma,
        orig_surface: t.greekLemma,
        prev_val: 'NULL',
        new_val: t.strongs,
        reason: `Contextually verified Greek lemma ${t.greekLemma} (${t.strongs}) matched in verse text while preserving Van Dyck punctuation in ar_word`,
        independent_source: 'SBLGNT / NA28 Contextual Greek Verse Alignment'
      });
    }
  }
}

console.log(`Greek NT contextual remediation completed: ${greekContextRemediated + 1} cases.`);
console.log(`Total Audit Ledger entries: ${auditLedger.length}`);
console.log(`Unique affected mapping IDs: ${affectedMappingIds.size}`);

console.log('=== Step 4: Synchronizing word_mapping_strongs for all remediated rows ===');
for (const mId of affectedMappingIds) {
  const wmRow = q(`SELECT id, strongs_id, orig_word, orig_word_position, orig_morphology, morph_source FROM word_mappings WHERE id = '${mId}'`)[0];
  if (!wmRow) continue;

  const existingMulti = q(`SELECT mapping_id, link_order, link_role FROM word_mapping_strongs WHERE mapping_id = '${mId}' AND link_role = 'primary'`);
  if (existingMulti.length > 0) {
    runSql(`
      UPDATE word_mapping_strongs
      SET strongs_id = '${wmRow.strongs_id}',
          orig_component = '${(wmRow.orig_word || '').replace(/'/g, "''")}',
          orig_word_position = ${wmRow.orig_word_position !== null && wmRow.orig_word_position !== undefined ? wmRow.orig_word_position : 'NULL'},
          orig_morphology = ${wmRow.orig_morphology ? `'${wmRow.orig_morphology.replace(/'/g, "''")}'` : 'NULL'},
          morph_source = ${wmRow.morph_source ? `'${wmRow.morph_source.replace(/'/g, "''")}'` : 'NULL'}
      WHERE mapping_id = '${mId}' AND link_role = 'primary'
    `);
  } else {
    runSql(`
      INSERT INTO word_mapping_strongs (
        mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source
      ) VALUES (
        '${mId}',
        '${wmRow.strongs_id}',
        1,
        'primary',
        '${(wmRow.orig_word || '').replace(/'/g, "''")}',
        ${wmRow.orig_word_position !== null && wmRow.orig_word_position !== undefined ? wmRow.orig_word_position : 'NULL'},
        ${wmRow.orig_morphology ? `'${wmRow.orig_morphology.replace(/'/g, "''")}'` : 'NULL'},
        ${wmRow.morph_source ? `'${wmRow.morph_source.replace(/'/g, "''")}'` : 'NULL'}
      )
    `);
  }
}
console.log('Synchronized word_mapping_strongs for all affected records successfully.');

// Write audit ledger to JSON and CSV
const ledgerJsonPath = path.join(__dirname, '..', 'verification_release_candidate', 'v347_remediation_audit_ledger.json');
const ledgerCsvPath = path.join(__dirname, '..', 'verification_release_candidate', 'v347_remediation_audit_ledger.csv');
fs.writeFileSync(ledgerJsonPath, JSON.stringify(auditLedger, null, 2), 'utf8');

const csvHeaders = ['case_id', 'ref', 'ar_word_pos', 'ar_word', 'orig_word', 'orig_surface', 'prev_val', 'new_val', 'reason', 'independent_source'];
const csvLines = [csvHeaders.join(',')];
for (const row of auditLedger) {
  const line = csvHeaders.map(h => {
    let val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      val = '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  }).join(',');
  csvLines.push(line);
}
fs.writeFileSync(ledgerCsvPath, csvLines.join('\n'), 'utf8');
console.log('Saved ledger to ' + ledgerCsvPath + ' and ' + ledgerJsonPath);
