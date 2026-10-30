const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_rev914.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// Revelation 9:14
// AVD: قَائِلاً (1) لِلْمَلاَكِ (2) السَّادِسِ (3) الَّذِي (4) مَعَهُ (5) الْبُوقُ: (6) «فُكَّ (7) الأَرْبَعَةَ (8) الْمَلاَئِكَةَ (9) الْمُقَيَّدِينَ (10) عِنْدَ (11) النَّهْرِ (12) الْعَظِيمِ (13) الْفُرَاتِ». (14)
// Greek: λέγουσαν (1) τῷ (2) ἕκτῳ (3) ἀγγέλῳ (4) ὃς (5) εἶχε (6) τὴν (7) σάλπιγγα (8), Λῦσον (9) τοὺς (10) τέσσαρας (11) ἀγγέλους (12) τοὺς (13) δεδεμένους (14) ἐπὶ (15) τῷ (16) ποταμῷ (17) τῷ (18) μεγάλῳ (19) Εὐφράτῃ (20).

const rev914Mappings = [
  {
    ar_pos: 1,
    ar_word: 'قَائِلاً',
    orig_pos: 1,
    orig_surface: 'λέγουσαν',
    orig_word: 'λέγω',
    strongs_id: 'G3004',
    morph_pos: 'verb_participle',
    orig_morphology: 'V- -PAPNSF',
    relation_type: 'direct_translation',
    notes: 'اسم فاعل مؤنث منصوب/مجرور في اليونانية عائد على الصوت (φωνῆς) في الآية السابقة (الآية 13)',
    components: [
      { strongs: 'G3004', role: 'primary', surface: 'λέγουσαν', pos: 1, morph: 'V- -PAPNSF' }
    ]
  },
  {
    ar_pos: 2,
    ar_word: 'لِلْمَلاَكِ',
    orig_pos: 4,
    orig_surface: 'ἀγγέλῳ',
    orig_word: 'ἄγγελος',
    strongs_id: 'G32',
    morph_pos: 'noun',
    orig_morphology: 'N- -DSM',
    relation_type: 'compound_phrase',
    notes: 'مركب اسمي مع أداة التعريف اليونانية τῷ في حالة القابل المفرد المذكر',
    components: [
      { strongs: 'G32', role: 'primary', surface: 'ἀγγέλῳ', pos: 4, morph: 'N- -DSM' },
      { strongs: 'G3588', role: 'article', surface: 'τῷ', pos: 2, morph: 'RA -DSM' }
    ]
  },
  {
    ar_pos: 3,
    ar_word: 'السَّادِسِ',
    orig_pos: 3,
    orig_surface: 'ἕκτῳ',
    orig_word: 'ἕκτος',
    strongs_id: 'G1623',
    morph_pos: 'adjective',
    orig_morphology: 'AA -DSM',
    relation_type: 'direct_translation',
    notes: 'صفة عددية ترتيبية في حالة القابل المذكر',
    components: [
      { strongs: 'G1623', role: 'primary', surface: 'ἕκτῳ', pos: 3, morph: 'AA -DSM' }
    ]
  },
  {
    ar_pos: 4,
    ar_word: 'الَّذِي',
    orig_pos: 5,
    orig_surface: 'ὃς',
    orig_word: 'ὅς',
    strongs_id: 'G3739',
    morph_pos: 'relative_pronoun',
    orig_morphology: 'RR -NSM',
    relation_type: 'direct_translation',
    notes: 'اسم موصول فاعل مفرد مذكر',
    components: [
      { strongs: 'G3739', role: 'primary', surface: 'ὃς', pos: 5, morph: 'RR -NSM' }
    ]
  },
  {
    ar_pos: 5,
    ar_word: 'مَعَهُ',
    orig_pos: 6,
    orig_surface: 'εἶχε',
    orig_word: 'ἔχω',
    strongs_id: 'G2192',
    morph_pos: 'verb_finite',
    orig_morphology: 'V- 3IAI-S--',
    relation_type: 'contextual_rendering',
    notes: 'فعل ماض ناقص (εἶχε = كان يملك/معه) صِيغ في العربية بشبه الجملة «مَعَهُ» لأداء دلالة الحيازة',
    components: [
      { strongs: 'G2192', role: 'primary', surface: 'εἶχε', pos: 6, morph: 'V- 3IAI-S--' }
    ]
  },
  {
    ar_pos: 6,
    ar_word: 'الْبُوقُ:',
    orig_pos: 8,
    orig_surface: 'σάλπιγγα',
    orig_word: 'σάλπιγξ',
    strongs_id: 'G4536',
    morph_pos: 'noun',
    orig_morphology: 'N- -ASF',
    relation_type: 'compound_phrase',
    notes: 'مركب اسمي مفعولي مع أداة التعريف τὴν في حالة النصب المؤنث',
    components: [
      { strongs: 'G4536', role: 'primary', surface: 'σάλπιγγα', pos: 8, morph: 'N- -ASF' },
      { strongs: 'G3588', role: 'article', surface: 'τὴν', pos: 7, morph: 'RA -ASF' }
    ]
  },
  {
    ar_pos: 7,
    ar_word: '«فُكَّ',
    orig_pos: 9,
    orig_surface: 'Λῦσον',
    orig_word: 'λύω',
    strongs_id: 'G3089',
    morph_pos: 'verb_imperative',
    orig_morphology: 'V- 2AAM-S--',
    relation_type: 'direct_translation',
    notes: 'فعل أمر ماض أوريست فاعل مفرد مخاطب (G3089 = فُكَّ/أطلِق)',
    components: [
      { strongs: 'G3089', role: 'primary', surface: 'Λῦσον', pos: 9, morph: 'V- 2AAM-S--' }
    ]
  },
  {
    ar_pos: 8,
    ar_word: 'الأَرْبَعَةَ',
    orig_pos: 11,
    orig_surface: 'τέσσαρας',
    orig_word: 'τέσσαρες',
    strongs_id: 'G5064',
    morph_pos: 'numeral_adjective',
    orig_morphology: 'AA -APM',
    relation_type: 'compound_phrase',
    notes: 'عدد مفعولي منصوب مذكر مع أداة التعريف τοὺς',
    components: [
      { strongs: 'G5064', role: 'primary', surface: 'τέσσαρας', pos: 11, morph: 'AA -APM' },
      { strongs: 'G3588', role: 'article', surface: 'τοὺς', pos: 10, morph: 'RA -APM' }
    ]
  },
  {
    ar_pos: 9,
    ar_word: 'الْمَلاَئِكَةَ',
    orig_pos: 12,
    orig_surface: 'ἀγγέλους',
    orig_word: 'ἄγγελος',
    strongs_id: 'G32',
    morph_pos: 'noun',
    orig_morphology: 'N- -APM',
    relation_type: 'direct_translation',
    notes: 'اسم جمع مذكر منصوب في حالة المفعول به',
    components: [
      { strongs: 'G32', role: 'primary', surface: 'ἀγγέλους', pos: 12, morph: 'N- -APM' }
    ]
  },
  {
    ar_pos: 10,
    ar_word: 'الْمُقَيَّدِينَ',
    orig_pos: 14,
    orig_surface: 'δεδεμένους',
    orig_word: 'δέω',
    strongs_id: 'G1210',
    morph_pos: 'verb_participle',
    orig_morphology: 'V- -RPPAPM',
    relation_type: 'compound_phrase',
    notes: 'اسم مفعول تام مبني للمجهول في حالة النصب الجمع المذكر مع أداة التعريف τοὺς (المقيدين = τοὺς δεδεμένους)',
    components: [
      { strongs: 'G1210', role: 'primary', surface: 'δεδεμένους', pos: 14, morph: 'V- -RPPAPM' },
      { strongs: 'G3588', role: 'article', surface: 'τοὺς', pos: 13, morph: 'RA -APM' }
    ]
  },
  {
    ar_pos: 11,
    ar_word: 'عِنْدَ',
    orig_pos: 15,
    orig_surface: 'ἐπὶ',
    orig_word: 'ἐπί',
    strongs_id: 'G1909',
    morph_pos: 'preposition',
    orig_morphology: 'P- --------',
    relation_type: 'direct_translation',
    notes: 'حرف جر يفيد المجاورة والموضع',
    components: [
      { strongs: 'G1909', role: 'primary', surface: 'ἐπὶ', pos: 15, morph: 'P- --------' }
    ]
  },
  {
    ar_pos: 12,
    ar_word: 'النَّهْرِ',
    orig_pos: 17,
    orig_surface: 'ποταμῷ',
    orig_word: 'ποταμός',
    strongs_id: 'G4215',
    morph_pos: 'noun',
    orig_morphology: 'N- -DSM',
    relation_type: 'compound_phrase',
    notes: 'اسم في حالة القابل المفرد المذكر مع أداة التعريف τῷ',
    components: [
      { strongs: 'G4215', role: 'primary', surface: 'ποταμῷ', pos: 17, morph: 'N- -DSM' },
      { strongs: 'G3588', role: 'article', surface: 'τῷ', pos: 16, morph: 'RA -DSM' }
    ]
  },
  {
    ar_pos: 13,
    ar_word: 'الْعَظِيمِ',
    orig_pos: 19,
    orig_surface: 'μεγάλῳ',
    orig_word: 'μέγας',
    strongs_id: 'G3173',
    morph_pos: 'adjective',
    orig_morphology: 'AA -DSM',
    relation_type: 'compound_phrase',
    notes: 'نعت في حالة القابل المفرد المذكر مع تكرار أداة التعريف τῷ في التركيب النعتي اليوناني',
    components: [
      { strongs: 'G3173', role: 'primary', surface: 'μεγάλῳ', pos: 19, morph: 'AA -DSM' },
      { strongs: 'G3588', role: 'article', surface: 'τῷ', pos: 18, morph: 'RA -DSM' }
    ]
  },
  {
    ar_pos: 14,
    ar_word: 'الْفُرَاتِ».',
    orig_pos: 20,
    orig_surface: 'Εὐφράτῃ',
    orig_word: 'Εὐφράτης',
    strongs_id: 'G2166',
    morph_pos: 'proper_noun',
    orig_morphology: 'N- -DSM',
    relation_type: 'direct_translation',
    notes: 'اسم علم للنهر في حالة القابل',
    components: [
      { strongs: 'G2166', role: 'primary', surface: 'Εὐφράτῃ', pos: 20, morph: 'N- -DSM' }
    ]
  }
];

let sql = `
BEGIN TRANSACTION;

-- Get verse_id
CREATE TEMP TABLE rev_verse AS 
SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14;

-- Delete old mappings and wms for Rev 9:14
DELETE FROM word_mapping_strongs 
WHERE mapping_id IN (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM rev_verse));

DELETE FROM word_mappings 
WHERE verse_id = (SELECT id FROM rev_verse);
`;

for (const m of rev914Mappings) {
  const mappingId = `rev914_w${m.ar_pos}`;
  const locator = `SBLGNT:B66.C9.V14.w${m.orig_pos}`;
  const notesEsc = m.notes.replace(/'/g, "''");
  
  sql += `
  INSERT INTO word_mappings (
    id, verse_id, ar_word_position, ar_word, orig_word_position,
    orig_surface, orig_word, strongs_id, morph_pos, orig_morphology,
    morph_source, verified_locator, relation_type, grammar_notes
  ) VALUES (
    '${mappingId}', (SELECT id FROM rev_verse), ${m.ar_pos}, '${m.ar_word}', ${m.orig_pos},
    '${m.orig_surface}', '${m.orig_word}', '${m.strongs_id}', '${m.morph_pos}', '${m.orig_morphology}',
    'morphgnt_sblgnt', '${locator}', '${m.relation_type}', '${notesEsc}'
  );
  `;

  m.components.forEach((c, idx) => {
    sql += `
    INSERT INTO word_mapping_strongs (
      mapping_id, strongs_id, link_order, link_role, orig_component,
      orig_word_position, orig_morphology, morph_source
    ) VALUES (
      '${mappingId}', '${c.strongs}', ${idx + 1}, '${c.role}', '${c.surface}',
      ${c.pos}, '${c.morph}', 'morphgnt_sblgnt'
    );
    `;
  });
}

sql += `
DROP TABLE rev_verse;
COMMIT;
`;

runSql(sql);
console.log('Successfully aligned Revelation 9:14 with all 20 Greek tokens and multi-components in WMS!');
