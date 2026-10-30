const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_repair_sub.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// Substantive philological repairs
const substantiveFixes = [
  // Exodus 22:15
  { book_id: 2, chapter: 22, verse: 15, ar_pos: 4, orig_pos: 3, orig_surface: 'עִמּוֹ', orig_word: 'עִם', strongs_id: 'H5973', morph: 'HR/Sp3ms', source: 'oshb_wlc', loc: 'OSHB:B2.C22.V15.w3' },
  { book_id: 2, chapter: 22, verse: 15, ar_pos: 10, orig_pos: 9, orig_surface: 'בָּא', orig_word: 'בּוֹא', strongs_id: 'H935', morph: 'HVqp3ms', source: 'oshb_wlc', loc: 'OSHB:B2.C22.V15.w9' },

  // Leviticus 6:15
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 1, orig_pos: 1, orig_surface: 'וְהֵרִים', orig_word: 'רוּם', strongs_id: 'H7311', morph: 'HC/Vqq3ms', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w1' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 2, orig_pos: 2, orig_surface: 'מִמֶּנּוּ', orig_word: 'מִן', strongs_id: 'H4480', morph: 'HR/Sp3ms', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w2' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 3, orig_pos: 3, orig_surface: 'בְּקֻמְצוֹ', orig_word: 'קֹמֶץ', strongs_id: 'H7062', morph: 'HR/Ncmsc/Sp3ms', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w3' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 4, orig_pos: 4, orig_surface: 'מִסֹּלֶת', orig_word: 'סֹלֶת', strongs_id: 'H5560', morph: 'HR/Ncfsc', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w4' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 7, orig_pos: 6, orig_surface: 'וּמִשַּׁמְנָהּ', orig_word: 'שֶׁמֶן', strongs_id: 'H8081', morph: 'HC/R/Ncmsc/Sp3fs', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w6' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 9, orig_pos: 9, orig_surface: 'הַלְּבֹנָה', orig_word: 'לְבֹנָה', strongs_id: 'H3828', morph: 'HTd/Ncfsa', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w9' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 13, orig_pos: 12, orig_surface: 'וְהִקְטִיר', orig_word: 'קָטַר', strongs_id: 'H6999', morph: 'HC/Vhq3ms', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w12' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 17, orig_pos: 15, orig_surface: 'נִיחֹחַ', orig_word: 'נִיחוֹחַ', strongs_id: 'H5207', morph: 'HNcmsa', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w15' },
  { book_id: 3, chapter: 6, verse: 15, ar_pos: 18, orig_pos: 16, orig_surface: 'אַזְכָּרָתָהּ', orig_word: 'אַזְכָּרָה', strongs_id: 'H234', morph: 'HNcfsc/Sp3fs', source: 'oshb_wlc', loc: 'OSHB:B3.C6.V15.w16' },

  // Joshua 3:12
  { book_id: 6, chapter: 3, verse: 12, ar_pos: 2, orig_pos: 2, orig_surface: 'קְחוּ', orig_word: 'לָקַח', strongs_id: 'H3947', morph: 'HVqv2mp', source: 'oshb_wlc', loc: 'OSHB:B6.C3.V12.w2' },

  // Judges 20:42
  { book_id: 7, chapter: 20, verse: 42, ar_pos: 14, orig_pos: 13, orig_surface: 'מַשְׁחִיתִים', orig_word: 'שָׁחַת', strongs_id: 'H7843', morph: 'HVhrmpa', source: 'oshb_wlc', loc: 'OSHB:B7.C20.V42.w13' },

  // 1 Kings 8:58
  { book_id: 11, chapter: 8, verse: 58, ar_pos: 5, orig_pos: 5, orig_surface: 'לָלֶכֶת', orig_word: 'הָלַךְ', strongs_id: 'H1980', morph: 'HR/Vqc', source: 'oshb_wlc', loc: 'OSHB:B11.C8.V58.w5' },

  // 2 Kings 10:30
  { book_id: 12, chapter: 10, verse: 30, ar_pos: 8, orig_pos: 5, orig_surface: 'הֱטִיבֹתָ', orig_word: 'יָטַב', strongs_id: 'H3190', morph: 'HVhp2ms', source: 'oshb_wlc', loc: 'OSHB:B12.C10.V30.w5' },

  // Psalms 6:9
  { book_id: 19, chapter: 6, verse: 9, ar_pos: 3, orig_pos: 4, orig_surface: 'תְּחִנָּתִי', orig_word: 'תְּחִנָּה', strongs_id: 'H8467', morph: 'HNcfsc/Sp1cs', source: 'oshb_wlc', loc: 'OSHB:B19.C6.V9.w4' },
  { book_id: 19, chapter: 6, verse: 9, ar_pos: 6, orig_pos: 7, orig_surface: 'תְּפִלָּתִי', orig_word: 'תְּפִלָּה', strongs_id: 'H8605', morph: 'HNcfsc/Sp1cs', source: 'oshb_wlc', loc: 'OSHB:B19.C6.V9.w7' },

  // Psalms 55:11
  { book_id: 19, chapter: 55, verse: 11, ar_pos: 8, orig_pos: 8, orig_surface: 'תֹּךְ', orig_word: 'תֹּךְ', strongs_id: 'H8496', morph: 'HNcmsa', source: 'oshb_wlc', loc: 'OSHB:B19.C55.V11.w8' },

  // Psalms 92:12
  { book_id: 19, chapter: 92, verse: 12, ar_pos: 5, orig_pos: 5, orig_surface: 'בְּ', orig_word: 'בְּ', strongs_id: 'H9003', morph: 'HR', source: 'oshb_wlc', loc: 'OSHB:B19.C92.V12.w5' },
  { book_id: 19, chapter: 92, verse: 12, ar_pos: 7, orig_pos: 7, orig_surface: 'יִשְׂגֶּה', orig_word: 'שָׂגָה', strongs_id: 'H7685', morph: 'HVqi3ms', source: 'oshb_wlc', loc: 'OSHB:B19.C92.V12.w7' },

  // Daniel 10:5
  { book_id: 27, chapter: 10, verse: 5, ar_pos: 6, orig_pos: 7, orig_surface: 'בַּדִּים', orig_word: 'בַּד', strongs_id: 'H906', morph: 'HNcmpa', source: 'oshb_wlc', loc: 'OSHB:B27.C10.V5.w7' },

  // Acts 11:28
  { book_id: 44, chapter: 11, verse: 28, ar_pos: 6, orig_pos: 7, orig_surface: 'ἐσήμανεν', orig_word: 'σημαίνω', strongs_id: 'G4591', morph: 'V- 3AAI-S--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B44.C11.V28.w7' },

  // Acts 12:7
  { book_id: 44, chapter: 12, verse: 7, ar_pos: 6, orig_pos: 7, orig_surface: 'ἔλαμψεν', orig_word: 'λάμπω', strongs_id: 'G2989', morph: 'V- 3AAI-S--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B44.C12.V7.w7' },
  { book_id: 44, chapter: 12, verse: 7, ar_pos: 17, orig_pos: 18, orig_surface: 'ἁλύσεις', orig_word: 'ἅλυσις', strongs_id: 'G254', morph: 'N- -NPF', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B44.C12.V7.w18' },

  // 2 Corinthians 6:5
  { book_id: 47, chapter: 6, verse: 5, ar_pos: 10, orig_pos: 10, orig_surface: 'ἀγρυπνίαις', orig_word: 'ἀγρυπνία', strongs_id: 'G70', morph: 'N- -DPF', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B47.C6.V5.w10' },

  // Colossians 2:15
  { book_id: 51, chapter: 2, verse: 15, ar_pos: 2, orig_pos: 1, orig_surface: 'ἀπεκδυσάμενος', orig_word: 'ἀπεκδύομαι', strongs_id: 'G554', morph: 'V- -AMPNSM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B51.C2.V15.w1' },
  { book_id: 51, chapter: 2, verse: 15, ar_pos: 7, orig_pos: 7, orig_surface: 'θριαμβεύσας', orig_word: 'θριαμβεύω', strongs_id: 'G2358', morph: 'V- -AAPNSM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B51.C2.V15.w7' },

  // 1 Timothy 6:9
  { book_id: 54, chapter: 6, verse: 9, ar_pos: 13, orig_pos: 14, orig_surface: 'ἀνοήτους', orig_word: 'ἀνόητος', strongs_id: 'G453', morph: 'AA -APF', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B54.C6.V9.w14' },

  // Ezra 7:21
  { book_id: 15, chapter: 7, verse: 21, ar_pos: 9, orig_pos: 9, orig_surface: 'גִזְבָּרַיָּא', orig_word: 'גִּזְבַּר', strongs_id: 'H1490', morph: 'TAmpd', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V21.w9' },
  { book_id: 15, chapter: 7, verse: 21, ar_pos: 26, orig_pos: 26, orig_surface: 'אָסְפַּרְנָא', orig_word: 'אָסְפַּרְנָא', strongs_id: 'H629', morph: 'TD', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V21.w26' },

  // Ezra 7:24
  { book_id: 15, chapter: 7, verse: 24, ar_pos: 6, orig_pos: 6, orig_surface: 'וְזַמָּרַיָּא', orig_word: 'זַמָּר', strongs_id: 'H2171', morph: 'TC/Ampd', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V24.w6' },
  { book_id: 15, chapter: 7, verse: 24, ar_pos: 9, orig_pos: 9, orig_surface: 'וּפָלְחֵי', orig_word: 'פָּלַח', strongs_id: 'H6399', morph: 'TC/Vrmpc', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V24.w9' },
  { book_id: 15, chapter: 7, verse: 24, ar_pos: 18, orig_pos: 17, orig_surface: 'מִנְדָּה', orig_word: 'מִנְדָּה', strongs_id: 'H4061', morph: 'TNcfsa', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V24.w17' },

  // Daniel 2:38
  { book_id: 27, chapter: 2, verse: 38, ar_pos: 6, orig_pos: 6, orig_surface: 'בָרָא', orig_word: 'בַּר', strongs_id: 'H1251', morph: 'TNcmsd', source: 'oshb_wlc', loc: 'OSHB:B27.C2.V38.w6' },
  { book_id: 27, chapter: 2, verse: 38, ar_pos: 7, orig_pos: 8, orig_surface: 'וְעוֹף־', orig_word: 'עוֹף', strongs_id: 'H5776', morph: 'TC/Ncmsc', source: 'oshb_wlc', loc: 'OSHB:B27.C2.V38.w8' },
  { book_id: 27, chapter: 2, verse: 38, ar_pos: 17, orig_pos: 17, orig_surface: 'מִן־', orig_word: 'מִן', strongs_id: 'H4481', morph: 'TR', source: 'oshb_wlc', loc: 'OSHB:B27.C2.V38.w17' },

  // Daniel 5:5
  { book_id: 27, chapter: 5, verse: 5, ar_pos: 4, orig_pos: 4, orig_surface: 'נְפַקָה', orig_word: 'נְפַק', strongs_id: 'H5312', morph: 'TVqp3fs', source: 'oshb_wlc', loc: 'OSHB:B27.C5.V5.w4' },
  { book_id: 27, chapter: 5, verse: 5, ar_pos: 10, orig_pos: 10, orig_surface: 'נֶבְרַשְׁתָּא', orig_word: 'נֶבְרַשְׁתָּא', strongs_id: 'H5043', morph: 'TNcfsa', source: 'oshb_wlc', loc: 'OSHB:B27.C5.V5.w10' },
  { book_id: 27, chapter: 5, verse: 5, ar_pos: 12, orig_pos: 12, orig_surface: 'גִּירָא', orig_word: 'גִּיר', strongs_id: 'H1528', morph: 'TNcmsd', source: 'oshb_wlc', loc: 'OSHB:B27.C5.V5.w12' },
  { book_id: 27, chapter: 5, verse: 5, ar_pos: 13, orig_pos: 13, orig_surface: 'כְּתַל', orig_word: 'כְּתַל', strongs_id: 'H3797', morph: 'TNcmsc', source: 'oshb_wlc', loc: 'OSHB:B27.C5.V5.w13' }
];

let sql = 'BEGIN TRANSACTION;\n';

for (const fix of substantiveFixes) {
  sql += `
  UPDATE word_mappings
  SET orig_word_position = ${fix.orig_pos},
      orig_surface = '${fix.orig_surface}',
      orig_word = '${fix.orig_word}',
      strongs_id = '${fix.strongs_id}',
      orig_morphology = '${fix.morph}',
      morph_source = '${fix.source}',
      verified_locator = '${fix.loc}',
      grammar_notes = 'تصحيح معجمي وصوري في الإصدار 332'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${fix.book_id} AND chapter_num = ${fix.chapter} AND verse_num = ${fix.verse})
    AND ar_word_position = ${fix.ar_pos};

  INSERT OR REPLACE INTO word_mapping_strongs (
    mapping_id, strongs_id, link_order, link_role, orig_component,
    orig_word_position, orig_morphology, morph_source
  ) VALUES (
    (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${fix.book_id} AND chapter_num = ${fix.chapter} AND verse_num = ${fix.verse}) AND ar_word_position = ${fix.ar_pos}),
    '${fix.strongs_id}', 1, 'primary', '${fix.orig_surface}',
    ${fix.orig_pos}, '${fix.morph}', '${fix.source}'
  );
  `;
}

sql += 'COMMIT;\n';

runSql(sql);
console.log('Successfully repaired substantive philological errors!');
