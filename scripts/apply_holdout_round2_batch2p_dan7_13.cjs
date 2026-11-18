/**
 * scripts/apply_holdout_round2_batch2p_dan7_13.cjs
 *
 * Production Calibration Script for Daniel 7:13 (Batch 2P - Round 2 Holdout)
 * Counterpart in OSHB: Dan.7.13 (18 tokens)
 * Arabic Text: «كُنْتُ أَرَى فِي رُؤَى اللَّيْلِ وَإِذَا مَعَ سُحُبِ السَّمَاءِ مِثْلُ ابْنِ إِنْسَانٍ أَتَى وَجَاءَ إِلَى الْقَدِيمِ الأَيَّامِ، فَقَرَّبُوهُ قُدَّامَهُ.
 * Total Units: 19 Arabic words, 23 components across OSHB w1..w18.
 *
 * Calibrations:
 *   - pos 1 «كُنْتُ»: w2 הֲوֵית֙ (H1934, AVqp1cs, Peal qatal 1cs, auxiliary past)
 *   - pos 2 «أَرَى»: w1 חָזֵ֤ה (H2370, AVqrmsa, Peal active participle ms abs)
 *   - pos 3 «فِي»: w3 בְּ (H9003, AR prep)
 *   - pos 4 «رُؤَى»: w3 בְּחֶזְוֵ֣י (H2376 primary Ncmpc + H9003 secondary AR)
 *   - pos 5 «اللَّيْلِ»: w4 לֵֽילְיָ֔א (H3916, ANcmsd/Td, determined)
 *   - pos 6 «وَإِذَا»: w5 וַאֲרוּ֙ (H718 primary AC/Tm + H9002 secondary AC)
 *   - pos 7 «مَعَ»: w6 עִם (H5974, AR prep)
 *   - pos 8 «سُحُبِ»: w7 עֲנָנֵ֣י (H6050, ANcmpc construct plural of עֲנָן)
 *   - pos 9 «السَّمَاءِ»: w8 שְׁמַיָּ֔א (H8065, ANcmpd/Td, determined plural)
 *   - pos 10 «مِثْلُ»: w9 כְּ (H9004, AR preposition/simile prefix)
 *   - pos 11 «ابْنِ»: w9 כְּבַ֥ר (H1247 primary Ncmsc construct + H9004 secondary AR)
 *   - pos 12 «إِنْسَانٍ»: w10 אֱנָ֖שׁ (H606, ANcmsa, absolute)
 *   - pos 13 «أَتَى»: w11 אָתֵ֣ה (H858 primary AVqrmsa) + w12 הֲוָ֑ה (H1934 secondary AVqp3ms)
 *   - pos 14 «وَجَاءَ»: w16 מְטָ֔ה (H4291 primary AVqp3ms) + w13 וְ (H9002 secondary AC)
 *   - pos 15 «إِلَى»: w13 וְעַד (H5705 primary AC/R) + w13 וְ (H9002 secondary AC)
 *   - pos 16 «الْقَدِيمِ»: w14 עַתִּ֤יק (H6268, AAamsc construct)
 *   - pos 17 «الأَيَّامِ»: w15 יֽוֹמַיָּא֙ (H3118, ANcmpd/Td, determined)
 *   - pos 18 «فَقَرَّبُوهُ»: w18 הַקְרְבֽוּהִי (H7127, AVhp3mp/Sp3ms, Haphel qatal 3mp + sf 3ms)
 *   - pos 19 «قُدَّامَهُ»: w17 וּקְדָמ֖וֹהִי (H6925 primary AC/R/Sp3ms + H9002 secondary AC)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const sqlite = path.join(repoRoot, 'sqlite_dist/sqlite3.exe');
const targetDb = process.env.CALIBRATE_DB_PATH || path.join(repoRoot, 'mobile/assets/bible_study.db');

function execSql(db, sql) {
  execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
}

function query(db, sql) {
  const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  return out.trim() ? JSON.parse(out) : [];
}

console.log(`Calibrating Daniel 7:13 in: ${targetDb}`);

const vRow = query(targetDb, "SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 7 AND verse_num = 13")[0];
if (!vRow) {
  throw new Error("Could not find Daniel 7:13 in database");
}
const verseId = vRow.id;

// Delete existing word_mapping_strongs for verse mappings
execSql(targetDb, `DELETE FROM word_mapping_strongs WHERE mapping_id IN (SELECT id FROM word_mappings WHERE verse_id = '${verseId}');`);

const wordUpdates = [
  // pos 1: «كُنْتُ» -> w2 הֲוֵית֙ (H1934, AVqp1cs)
  {
    pos: 1,
    orig_pos: 2,
    strong: 'H1934',
    orig_word: 'הֲוָא',
    orig_surface: 'הֲוֵית֙',
    orig_morphology: 'AVqp1cs',
    morph_pos: 'verb',
    morph_stem: 'peal',
    morph_tense: 'qatal',
    morph_voice: null,
    morph_mood: 'indicative',
    morph_person: '1',
    morph_number: 'singular',
    morph_gender: 'common',
    morph_case: null,
    relation_type: 'primary',
    grammar_notes: 'فعل ماضٍ ناقص مسند لضمير المتكلم (peal qatal 1cs) من הֲוָא (H1934) في الورود الثاني w2.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w2',
    components: [
      { strong: 'H1934', order: 1, role: 'primary', orig_pos: 2, comp: 'הֲוֵית֙', morph: 'AVqp1cs', src: 'oshb_wlc' }
    ]
  },
  // pos 2: «أَرَى» -> w1 חָזֵ֤ה (H2370, AVqrmsa)
  {
    pos: 2,
    orig_pos: 1,
    strong: 'H2370',
    orig_word: 'חֲזָא',
    orig_surface: 'חָזֵ֤ה',
    orig_morphology: 'AVqrmsa',
    morph_pos: 'verb',
    morph_stem: 'peal',
    morph_tense: null,
    morph_voice: null,
    morph_mood: 'participle',
    morph_person: null,
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: 'absolute',
    relation_type: 'primary',
    grammar_notes: 'اسم فاعل آرامي (peal active participle ms abs) من חֲזָא (H2370) في الورود الأول w1، يفيد مع كنتُ الاستمرار.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w1',
    components: [
      { strong: 'H2370', order: 1, role: 'primary', orig_pos: 1, comp: 'חָזֵ֤ה', morph: 'AVqrmsa', src: 'oshb_wlc' }
    ]
  },
  // pos 3: «فِي» -> w3 בְּ/חֶזְוֵ֣י (prefix בְּ- H9003, AR)
  {
    pos: 3,
    orig_pos: 3,
    strong: 'H9003',
    orig_word: 'בְּ',
    orig_surface: 'בְּ',
    orig_morphology: 'AR',
    morph_pos: 'preposition',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: null,
    morph_gender: null,
    morph_case: null,
    relation_type: 'compound_phrase',
    grammar_notes: 'حرف جر متصل بـ (H9003) ملتصق بلفظ חֶזְוֵ֣י في w3.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w3',
    components: [
      { strong: 'H9003', order: 1, role: 'primary', orig_pos: 3, comp: 'בְּ', morph: 'AR', src: 'oshb_wlc' }
    ]
  },
  // pos 4: «رُؤَى» -> w3 בְּ/חֶזְוֵ֣י (H2376, AR/Ncmpc)
  {
    pos: 4,
    orig_pos: 3,
    strong: 'H2376',
    orig_word: 'חֵזֶו',
    orig_surface: 'בְּחֶזְוֵ֣י',
    orig_morphology: 'AR/Ncmpc',
    morph_pos: 'noun',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'plural',
    morph_gender: 'masculine',
    morph_case: 'construct',
    relation_type: 'compound_phrase',
    grammar_notes: 'اسم مذكر جمع مضاف (Ncmpc) من חֵזֶו (H2376) مسبوق بحرف الجر بـ في w3.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w3',
    components: [
      { strong: 'H2376', order: 1, role: 'primary', orig_pos: 3, comp: 'בְּחֶזְוֵ֣י', morph: 'AR/Ncmpc', src: 'oshb_wlc' },
      { strong: 'H9003', order: 2, role: 'secondary', orig_pos: 3, comp: 'בְּ', morph: 'AR', src: 'oshb_wlc' }
    ]
  },
  // pos 5: «اللَّيْلِ» -> w4 לֵֽילְיָ֔/א (H3916, ANcmsd/Td)
  {
    pos: 5,
    orig_pos: 4,
    strong: 'H3916',
    orig_word: 'לֵילְיָא',
    orig_surface: 'לֵֽילְיָ֔א',
    orig_morphology: 'ANcmsd/Td',
    morph_pos: 'noun',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: 'determined',
    relation_type: 'primary',
    grammar_notes: 'اسم مذكر مفرد معرف بالحالة المعرفة الآرامية (emphatic/determined) من לֵילְיָא (H3916).',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w4',
    components: [
      { strong: 'H3916', order: 1, role: 'primary', orig_pos: 4, comp: 'לֵֽילְיָ֔א', morph: 'ANcmsd/Td', src: 'oshb_wlc' }
    ]
  },
  // pos 6: «وَإِذَا» -> w5 וַ/אֲרוּ֙ (H718, AC/Tm)
  {
    pos: 6,
    orig_pos: 5,
    strong: 'H718',
    orig_word: 'אֲרוּ',
    orig_surface: 'וַאֲרוּ֙',
    orig_morphology: 'AC/Tm',
    morph_pos: 'interjection',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: null,
    morph_gender: null,
    morph_case: null,
    relation_type: 'primary',
    grammar_notes: 'أداة تنبيه وإشارة (Tm) مسبوقة بواو العطف (AC) من אֲרוּ (H718) في w5.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w5',
    components: [
      { strong: 'H718', order: 1, role: 'primary', orig_pos: 5, comp: 'וַאֲרוּ֙', morph: 'AC/Tm', src: 'oshb_wlc' },
      { strong: 'H9002', order: 2, role: 'secondary', orig_pos: 5, comp: 'וַ', morph: 'AC', src: 'oshb_wlc' }
    ]
  },
  // pos 7: «مَعَ» -> w6 עִם (H5974, AR)
  {
    pos: 7,
    orig_pos: 6,
    strong: 'H5974',
    orig_word: 'עִם',
    orig_surface: 'עִם',
    orig_morphology: 'AR',
    morph_pos: 'preposition',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: null,
    morph_gender: null,
    morph_case: null,
    relation_type: 'primary',
    grammar_notes: 'حرف جر آرامي עִם (H5974) في w6.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w6',
    components: [
      { strong: 'H5974', order: 1, role: 'primary', orig_pos: 6, comp: 'עִם', morph: 'AR', src: 'oshb_wlc' }
    ]
  },
  // pos 8: «سُحُبِ» -> w7 עֲנָנֵ֣י (H6050, ANcmpc)
  {
    pos: 8,
    orig_pos: 7,
    strong: 'H6050',
    orig_word: 'עֲנָן',
    orig_surface: 'עֲנָנֵ֣י',
    orig_morphology: 'ANcmpc',
    morph_pos: 'noun',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'plural',
    morph_gender: 'masculine',
    morph_case: 'construct',
    relation_type: 'primary',
    grammar_notes: 'اسم مذكر جمع مضاف (Ncmpc) من עֲנָן (H6050) في w7.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w7',
    components: [
      { strong: 'H6050', order: 1, role: 'primary', orig_pos: 7, comp: 'עֲנָנֵ֣י', morph: 'ANcmpc', src: 'oshb_wlc' }
    ]
  },
  // pos 9: «السَّمَاءِ» -> w8 שְׁמַיָּ֔/א (H8065, ANcmpd/Td)
  {
    pos: 9,
    orig_pos: 8,
    strong: 'H8065',
    orig_word: 'שָׁמַיִן',
    orig_surface: 'שְׁמַיָּ֔א',
    orig_morphology: 'ANcmpd/Td',
    morph_pos: 'noun',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'plural',
    morph_gender: 'masculine',
    morph_case: 'determined',
    relation_type: 'primary',
    grammar_notes: 'اسم مذكر جمع معرف بالحالة التوكيدية/المعرفة (ANcmpd/Td) من שְׁמַיִן (H8065).',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w8',
    components: [
      { strong: 'H8065', order: 1, role: 'primary', orig_pos: 8, comp: 'שְׁמַיָּ֔א', morph: 'ANcmpd/Td', src: 'oshb_wlc' }
    ]
  },
  // pos 10: «مِثْلُ» -> w9 כְּ/בַ֥ר (prefix כְּ- H9004, AR)
  {
    pos: 10,
    orig_pos: 9,
    strong: 'H9004',
    orig_word: 'כְּ',
    orig_surface: 'כְּ',
    orig_morphology: 'AR',
    morph_pos: 'preposition',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: null,
    morph_gender: null,
    morph_case: null,
    relation_type: 'compound_phrase',
    grammar_notes: 'حرف تشبيه وجر كـ (H9004) ملتصق بـ בַר في w9.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w9',
    components: [
      { strong: 'H9004', order: 1, role: 'primary', orig_pos: 9, comp: 'כְּ', morph: 'AR', src: 'oshb_wlc' }
    ]
  },
  // pos 11: «ابْنِ» -> w9 כְּ/בַ֥ר (H1247, AR/Ncmsc)
  {
    pos: 11,
    orig_pos: 9,
    strong: 'H1247',
    orig_word: 'בַּר',
    orig_surface: 'כְּבַ֥ר',
    orig_morphology: 'AR/Ncmsc',
    morph_pos: 'noun',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: 'construct',
    relation_type: 'compound_phrase',
    grammar_notes: 'اسم مذكر مفرد مضاف (Ncmsc) من בַּר (H1247) مسبوق بكـ في w9.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w9',
    components: [
      { strong: 'H1247', order: 1, role: 'primary', orig_pos: 9, comp: 'כְּבַ֥ר', morph: 'AR/Ncmsc', src: 'oshb_wlc' },
      { strong: 'H9004', order: 2, role: 'secondary', orig_pos: 9, comp: 'כְּ', morph: 'AR', src: 'oshb_wlc' }
    ]
  },
  // pos 12: «إِنْسَانٍ» -> w10 אֱנָ֖שׁ (H606, ANcmsa)
  {
    pos: 12,
    orig_pos: 10,
    strong: 'H606',
    orig_word: 'אֱנָשׁ',
    orig_surface: 'אֱנָ֖שׁ',
    orig_morphology: 'ANcmsa',
    morph_pos: 'noun',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: 'absolute',
    relation_type: 'primary',
    grammar_notes: 'اسم مذكر مفرد مطلق (ANcmsa) من אֱנָשׁ (H606) في w10.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w10',
    components: [
      { strong: 'H606', order: 1, role: 'primary', orig_pos: 10, comp: 'אֱנָ֖שׁ', morph: 'ANcmsa', src: 'oshb_wlc' }
    ]
  },
  // pos 13: «أَتَى» -> w11 אָתֵ֣ה (H858, AVqrmsa) + w12 הֲוָ֑ה (H1934, AVqp3ms)
  {
    pos: 13,
    orig_pos: 11,
    strong: 'H858',
    orig_word: 'אֲתָה',
    orig_surface: 'אָתֵ֣ה',
    orig_morphology: 'AVqrmsa',
    morph_pos: 'verb',
    morph_stem: 'peal',
    morph_tense: null,
    morph_voice: null,
    morph_mood: 'participle',
    morph_person: null,
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: 'absolute',
    relation_type: 'primary',
    grammar_notes: 'فعل آرامي (peal active participle ms abs) من אֲתָה (H858) في w11، ومعه הֲוָה في w12 لبيان الماضي المستمر.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w11',
    components: [
      { strong: 'H858', order: 1, role: 'primary', orig_pos: 11, comp: 'אָתֵ֣ה', morph: 'AVqrmsa', src: 'oshb_wlc' },
      { strong: 'H1934', order: 2, role: 'secondary', orig_pos: 12, comp: 'הֲוָ֑ה', morph: 'AVqp3ms', src: 'oshb_wlc' }
    ]
  },
  // pos 14: «وَجَاءَ» -> w16 מְטָ֔ה (H4291, AVqp3ms)
  {
    pos: 14,
    orig_pos: 16,
    strong: 'H4291',
    orig_word: 'מְטָא',
    orig_surface: 'מְטָ֔ה',
    orig_morphology: 'AVqp3ms',
    morph_pos: 'verb',
    morph_stem: 'peal',
    morph_tense: 'qatal',
    morph_voice: null,
    morph_mood: 'indicative',
    morph_person: '3',
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: null,
    relation_type: 'primary',
    grammar_notes: 'فعل ماضٍ آرامي (peal qatal 3ms) من מְטָא (H4291) بمعنى بلغ أو جاء في w16.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w16',
    components: [
      { strong: 'H4291', order: 1, role: 'primary', orig_pos: 16, comp: 'מְטָ֔ה', morph: 'AVqp3ms', src: 'oshb_wlc' },
      { strong: 'H9002', order: 2, role: 'secondary', orig_pos: 13, comp: 'וְ', morph: 'AC', src: 'oshb_wlc' }
    ]
  },
  // pos 15: «إِلَى» -> w13 וְ/עַד (c/5705, AC/R)
  {
    pos: 15,
    orig_pos: 13,
    strong: 'H5705',
    orig_word: 'עַד',
    orig_surface: 'וְעַד',
    orig_morphology: 'AC/R',
    morph_pos: 'preposition',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: null,
    morph_gender: null,
    morph_case: null,
    relation_type: 'primary',
    grammar_notes: 'حرف جر آرامي עַד (H5705) مسبوق بواو العطف في w13.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w13',
    components: [
      { strong: 'H5705', order: 1, role: 'primary', orig_pos: 13, comp: 'וְעַד', morph: 'AC/R', src: 'oshb_wlc' },
      { strong: 'H9002', order: 2, role: 'secondary', orig_pos: 13, comp: 'וְ', morph: 'AC', src: 'oshb_wlc' }
    ]
  },
  // pos 16: «الْقَدِيمِ» -> w14 עַתִּ֤יק (H6268, AAamsc)
  {
    pos: 16,
    orig_pos: 14,
    strong: 'H6268',
    orig_word: 'עַתִּיק',
    orig_surface: 'עַתִּ֤יק',
    orig_morphology: 'AAamsc',
    morph_pos: 'adjective',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: 'construct',
    relation_type: 'primary',
    grammar_notes: 'صفة مذكرة مفردة مضافة (AAamsc) من עַתִּיק (H6268) في w14.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w14',
    components: [
      { strong: 'H6268', order: 1, role: 'primary', orig_pos: 14, comp: 'עַתִּ֤יק', morph: 'AAamsc', src: 'oshb_wlc' }
    ]
  },
  // pos 17: «الأَيَّامِ،» -> w15 יֽוֹמַיָּ/א֙ (H3118, ANcmpd/Td)
  {
    pos: 17,
    orig_pos: 15,
    strong: 'H3118',
    orig_word: 'יוֹם',
    orig_surface: 'יֽוֹמַיָּא֙',
    orig_morphology: 'ANcmpd/Td',
    morph_pos: 'noun',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: null,
    morph_number: 'plural',
    morph_gender: 'masculine',
    morph_case: 'determined',
    relation_type: 'primary',
    grammar_notes: 'اسم مذكر جمع معرف (ANcmpd/Td) من יוֹם (H3118) في w15.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w15',
    components: [
      { strong: 'H3118', order: 1, role: 'primary', orig_pos: 15, comp: 'יֽוֹמַיָּא֙', morph: 'ANcmpd/Td', src: 'oshb_wlc' }
    ]
  },
  // pos 18: «فَقَرَّبُوهُ» -> w18 הַקְרְבֽוּ/הִי (H7127, AVhp3mp/Sp3ms)
  {
    pos: 18,
    orig_pos: 18,
    strong: 'H7127',
    orig_word: 'קְרֵב',
    orig_surface: 'הַקְרְבֽוּהִי',
    orig_morphology: 'AVhp3mp/Sp3ms',
    morph_pos: 'verb',
    morph_stem: 'haphel',
    morph_tense: 'qatal',
    morph_voice: null,
    morph_mood: 'indicative',
    morph_person: '3',
    morph_number: 'plural',
    morph_gender: 'masculine',
    morph_case: null,
    relation_type: 'primary',
    grammar_notes: 'فعل ماضٍ آرامي في وزن الهفعل (haphel qatal 3mp) مع ضمير مفعول متصل للغائب (Sp3ms) من קְרֵב (H7127) في w18.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w18',
    components: [
      { strong: 'H7127', order: 1, role: 'primary', orig_pos: 18, comp: 'הַקְרְבֽוּהִי', morph: 'AVhp3mp/Sp3ms', src: 'oshb_wlc' }
    ]
  },
  // pos 19: «قُدَّامَهُ.» -> w17 וּ/קְדָמ֖וֹ/הִי (c/6925, AC/R/Sp3ms)
  {
    pos: 19,
    orig_pos: 17,
    strong: 'H6925',
    orig_word: 'קֳדָם',
    orig_surface: 'וּקְדָמ֖וֹהִי',
    orig_morphology: 'AC/R/Sp3ms',
    morph_pos: 'preposition',
    morph_stem: null,
    morph_tense: null,
    morph_voice: null,
    morph_mood: null,
    morph_person: '3',
    morph_number: 'singular',
    morph_gender: 'masculine',
    morph_case: null,
    relation_type: 'primary',
    grammar_notes: 'شبه جملة جارة مع ضمير متصل للغائب المفرد المذكر (Sp3ms) مسبوقة بواو في w17.',
    morph_source: 'oshb_wlc',
    verified_source: 'oshb_wlc',
    verified_locator: 'OSHB:B27.C7.V13.w17',
    components: [
      { strong: 'H6925', order: 1, role: 'primary', orig_pos: 17, comp: 'וּקְדָמ֖וֹהִי', morph: 'AC/R/Sp3ms', src: 'oshb_wlc' },
      { strong: 'H9002', order: 2, role: 'secondary', orig_pos: 17, comp: 'וּ', morph: 'AC', src: 'oshb_wlc' }
    ]
  }
];

// Apply updates
wordUpdates.forEach(u => {
  const mRow = query(targetDb, `SELECT id FROM word_mappings WHERE verse_id = '${verseId}' AND ar_word_position = ${u.pos}`)[0];
  if (!mRow) {
    throw new Error(`Missing mapping row for pos ${u.pos}`);
  }
  const mId = mRow.id;

  const setClauses = [
    `orig_word_position = ${u.orig_pos}`,
    `strongs_id = ${u.strong ? `'${u.strong}'` : 'NULL'}`,
    `orig_word = ${u.orig_word ? `'${u.orig_word}'` : 'NULL'}`,
    `orig_surface = ${u.orig_surface ? `'${u.orig_surface}'` : 'NULL'}`,
    `orig_morphology = ${u.orig_morphology ? `'${u.orig_morphology}'` : 'NULL'}`,
    `morph_pos = ${u.morph_pos ? `'${u.morph_pos}'` : 'NULL'}`,
    `morph_stem = ${u.morph_stem ? `'${u.morph_stem}'` : 'NULL'}`,
    `morph_tense = ${u.morph_tense ? `'${u.morph_tense}'` : 'NULL'}`,
    `morph_voice = ${u.morph_voice ? `'${u.morph_voice}'` : 'NULL'}`,
    `morph_mood = ${u.morph_mood ? `'${u.morph_mood}'` : 'NULL'}`,
    `morph_person = ${u.morph_person ? `'${u.morph_person}'` : 'NULL'}`,
    `morph_number = ${u.morph_number ? `'${u.morph_number}'` : 'NULL'}`,
    `morph_gender = ${u.morph_gender ? `'${u.morph_gender}'` : 'NULL'}`,
    `morph_case = ${u.morph_case ? `'${u.morph_case}'` : 'NULL'}`,
    `relation_type = ${u.relation_type ? `'${u.relation_type}'` : 'NULL'}`,
    `grammar_notes = ${u.grammar_notes ? `'${u.grammar_notes.replace(/'/g, "''")}'` : 'NULL'}`,
    `morph_source = ${u.morph_source ? `'${u.morph_source}'` : 'NULL'}`,
    `verified_source = ${u.verified_source ? `'${u.verified_source}'` : 'NULL'}`,
    `verified_locator = ${u.verified_locator ? `'${u.verified_locator}'` : 'NULL'}`
  ];

  execSql(targetDb, `UPDATE word_mappings SET ${setClauses.join(', ')} WHERE id = '${mId}';`);

  if (u.components && u.components.length > 0) {
    u.components.forEach(c => {
      execSql(targetDb, `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
        VALUES ('${mId}', '${c.strong}', ${c.order}, '${c.role}', '${c.comp}', ${c.orig_pos}, '${c.morph}', '${c.src}');`);
    });
  }
});

console.log('Successfully calibrated Daniel 7:13 (19 positions, 23 components).');
