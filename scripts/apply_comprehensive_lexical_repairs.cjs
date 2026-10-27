const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_apply_repairs.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('Starting comprehensive lexical and linkage repairs...');

// 1. Prepare SQL transaction
const sqlStatements = [
  'BEGIN TRANSACTION;',

  '-- 1. Normalize special primary_* roles in word_mapping_strongs',
  "UPDATE word_mapping_strongs SET link_role = 'primary' WHERE link_role LIKE 'primary_%';",

  '-- 2. Genesis 4:18 corrections',
  // عِيرَادُ (pos 3)
  `UPDATE word_mappings SET strongs_id = 'H5897', orig_word = 'עִירָד', orig_surface = 'עִירָד', morph_pos = 'proper_noun', morph_source = 'oshb_wlc'
   WHERE id = '0cc1ee39-cdf3-4917-86c0-3272a897d02d';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = '0cc1ee39-cdf3-4917-86c0-3272a897d02d';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('0cc1ee39-cdf3-4917-86c0-3272a897d02d', 'H5897', 1, 'primary', 'עִירָד');`,

  // وَعِيرَادُ (pos 4)
  `UPDATE word_mappings SET strongs_id = 'H5897', orig_word = 'עִירָד', orig_surface = 'וְעִירָד', morph_pos = 'proper_noun', morph_source = 'oshb_wlc'
   WHERE id = 'fa818ebe-eb0f-4161-b51f-35fa11136526';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = 'fa818ebe-eb0f-4161-b51f-35fa11136526';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('fa818ebe-eb0f-4161-b51f-35fa11136526', 'H5897', 1, 'primary', 'וְעִירָד');`,

  // مَتُوشَائِيلَ (pos 9)
  `UPDATE word_mappings SET strongs_id = 'H4967', orig_word = 'מְתוּשָׁאֵל', orig_surface = 'מְתוּשָׁאֵל', morph_pos = 'proper_noun', morph_source = 'oshb_wlc'
   WHERE id = '780fb1de-4d02-4fab-ac38-af286d18c18f';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = '780fb1de-4d02-4fab-ac38-af286d18c18f';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('780fb1de-4d02-4fab-ac38-af286d18c18f', 'H4967', 1, 'primary', 'מְתוּשָׁאֵל');`,

  // وَمَتُوشَائِيلُ (pos 10)
  `UPDATE word_mappings SET strongs_id = 'H4967', orig_word = 'מְתוּשָׁאֵל', orig_surface = 'וּמְתוּשָׁאֵל', morph_pos = 'proper_noun', morph_source = 'oshb_wlc'
   WHERE id = '23ef1bc0-4aa0-4b5f-b96c-5b8f7152997c';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = '23ef1bc0-4aa0-4b5f-b96c-5b8f7152997c';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('23ef1bc0-4aa0-4b5f-b96c-5b8f7152997c', 'H4967', 1, 'primary', 'וּמְתוּשָׁאֵל');`,

  '-- 3. Restore 23 records with placeholder orig_word',
  // Judges 7:9 pos 8 'لَهُ'
  `UPDATE word_mappings SET orig_word = 'אֵל', orig_surface = 'אֵלָיו', morph_source = 'oshb_wlc' WHERE id = 'c0513db2-e286-4e83-8d2d-bef79359d266';`,
  `UPDATE word_mapping_strongs SET orig_component = 'אֵלָיו' WHERE mapping_id = 'c0513db2-e286-4e83-8d2d-bef79359d266' AND strongs_id = 'H413';`,

  // Psalms 80:5 pos 5 'وَسَقَيْتَهُمُ'
  `UPDATE word_mappings SET orig_word = 'שָׁקָה', orig_surface = 'וַתַּשְׁקֵמוֹ', morph_source = 'oshb_wlc' WHERE id = '7faee488-26d4-4659-8c79-6ecf1763c9c7';`,
  `UPDATE word_mapping_strongs SET orig_component = 'וַתַּשְׁקֵמוֹ' WHERE mapping_id = '7faee488-26d4-4659-8c79-6ecf1763c9c7' AND strongs_id = 'H8248';`,

  // Psalms 80:5 pos 7 'بِالْكَيْلِ'
  `UPDATE word_mappings SET orig_word = 'שָׁלִישׁ', orig_surface = 'שָׁלִישׁ', morph_source = 'oshb_wlc' WHERE id = '97327786-ddb5-4681-bdf2-bd2cffa874d7';`,
  `UPDATE word_mapping_strongs SET orig_component = 'שָׁלִישׁ' WHERE mapping_id = '97327786-ddb5-4681-bdf2-bd2cffa874d7' AND strongs_id = 'H7991';`,

  // Jeremiah 52:4 pos 22 'وَبَنَوْا'
  `UPDATE word_mappings SET orig_word = 'בָּנָה', orig_surface = 'וַיִּבְنوּ', morph_source = 'oshb_wlc' WHERE id = '2cdb381b-d0e6-4f13-bb1d-918ecf9e5934';`,
  `UPDATE word_mapping_strongs SET orig_component = 'וַיִּבְנוּ' WHERE mapping_id = '2cdb381b-d0e6-4f13-bb1d-918ecf9e5934' AND strongs_id = 'H1129';`,

  // Jeremiah 52:4 pos 24 'أَبْرَاجًا'
  `UPDATE word_mappings SET orig_word = 'דָּיֵק', orig_surface = 'דָּיֵק', morph_source = 'oshb_wlc' WHERE id = 'b99952db-c33e-4ce4-9106-f927320ea825';`,
  `UPDATE word_mapping_strongs SET orig_component = 'דָּיֵק' WHERE mapping_id = 'b99952db-c33e-4ce4-9106-f927320ea825' AND strongs_id = 'H1785';`,

  // Ezekiel 40:34 pos 1 'وَمُقَبَّبُهُ'
  `UPDATE word_mappings SET orig_word = 'אֵילָם', orig_surface = 'וְאֵלַמָּו', morph_source = 'oshb_wlc' WHERE id = 'ac3fd13d-91be-4b4d-a97e-a50ff83b9f61';`,
  `UPDATE word_mapping_strongs SET orig_component = 'וְאֵלַמָּו' WHERE mapping_id = 'ac3fd13d-91be-4b4d-a97e-a50ff83b9f61' AND strongs_id = 'H361';`,

  // Ezekiel 40:34 pos 6 'عَضَائِدِهِ'
  `UPDATE word_mappings SET orig_word = 'אַיִל', orig_surface = 'אֵילָו', morph_source = 'oshb_wlc' WHERE id = 'd4618c81-f8d5-484d-a397-bff59c01414a';`,
  `UPDATE word_mapping_strongs SET orig_component = 'אֵילָו' WHERE mapping_id = 'd4618c81-f8d5-484d-a397-bff59c01414a' AND strongs_id = 'H352';`,

  // Ezekiel 40:34 pos 7 'نَخِيلٌ'
  `UPDATE word_mappings SET orig_word = 'תִּמֹּר', orig_surface = 'וְתִמֹרִים', morph_source = 'oshb_wlc' WHERE id = 'ee26abef-0875-43cf-9f1b-8c30a68f08e9';`,
  `UPDATE word_mapping_strongs SET orig_component = 'וְתִמֹרִים' WHERE mapping_id = 'ee26abef-0875-43cf-9f1b-8c30a68f08e9' AND strongs_id = 'H8561';`,

  // Ezekiel 40:34 pos 12 'وَمَصْعَدُهُ'
  `UPDATE word_mappings SET orig_word = 'מַעֲלֶה', orig_surface = 'מַעֲלָו', morph_source = 'oshb_wlc' WHERE id = 'c4d5396b-eb61-428e-9a58-93feb38615e7';`,
  `UPDATE word_mapping_strongs SET orig_component = 'מַעֲלָו' WHERE mapping_id = 'c4d5396b-eb61-428e-9a58-93feb38615e7' AND strongs_id = 'H4608';`,

  // Ezekiel 40:34 pos 14 'دَرَجَاتٍ'
  `UPDATE word_mappings SET orig_word = 'מַעֲלָה', orig_surface = 'מַעֲלוֹת', morph_source = 'oshb_wlc' WHERE id = 'b148aabc-e0a3-43f6-89c8-5ad8483e8904';`,
  `UPDATE word_mapping_strongs SET orig_component = 'מַעֲלוֹת' WHERE mapping_id = 'b148aabc-e0a3-43f6-89c8-5ad8483e8904' AND strongs_id = 'H4609';`,

  // Matthew 17:20 pos 3 'يَسُوعُ:'
  `UPDATE word_mappings SET orig_word = 'Ἰησοῦς', orig_surface = 'Ἰησοῦς', morph_source = 'morphgnt_sblgnt' WHERE id = '6dd9c395-8e7c-462c-951e-d5d93138dfbe';`,
  `UPDATE word_mapping_strongs SET orig_component = 'Ἰησοῦς' WHERE mapping_id = '6dd9c395-8e7c-462c-951e-d5d93138dfbe' AND strongs_id = 'G2424';`,

  // Luke 5:22 pos 6 'لَهُمْ:'
  `UPDATE word_mappings SET orig_word = 'πρός', orig_surface = 'πρὸς', morph_source = 'morphgnt_sblgnt' WHERE id = '3f2d4aee-8c92-4bfa-bd38-2e79f1e5f7e0';`,
  `UPDATE word_mapping_strongs SET orig_component = 'πρὸς' WHERE mapping_id = '3f2d4aee-8c92-4bfa-bd38-2e79f1e5f7e0' AND strongs_id = 'G4314';`,

  // Luke 5:22 pos 7 '«مَاذَا'
  `UPDATE word_mappings SET orig_word = 'τίς', orig_surface = 'Τί', morph_source = 'morphgnt_sblgnt' WHERE id = '592fb046-3620-424c-9643-49c576595e2e';`,
  `UPDATE word_mapping_strongs SET orig_component = 'Τί' WHERE mapping_id = '592fb046-3620-424c-9643-49c576595e2e' AND strongs_id = 'G5101';`,

  // John 1:36 pos 6 '«هُوَذَا'
  `UPDATE word_mappings SET orig_word = 'ἴδε', orig_surface = 'Ἴδε', morph_source = 'morphgnt_sblgnt' WHERE id = '3ce4973d-be52-4ed0-a6f9-30975d69582e';`,
  `UPDATE word_mapping_strongs SET orig_component = 'Ἴδε' WHERE mapping_id = '3ce4973d-be52-4ed0-a6f9-30975d69582e' AND strongs_id = 'G2396';`,

  // John 6:44 pos 15 'فِي'
  `UPDATE word_mappings SET orig_word = 'ἐν', orig_surface = 'ἐν', morph_source = 'morphgnt_sblgnt' WHERE id = 'e6d476d8-4343-468e-b25a-711fba7b4dcd';`,
  `UPDATE word_mapping_strongs SET orig_component = 'ἐν' WHERE mapping_id = 'e6d476d8-4343-468e-b25a-711fba7b4dcd' AND strongs_id = 'G1722';`,

  // John 13:8 pos 3 'بُطْرُسُ:'
  `UPDATE word_mappings SET orig_word = 'Πέτρος', orig_surface = 'Πέτρος', morph_source = 'morphgnt_sblgnt' WHERE id = '97f647a7-80c0-43f1-8ea9-633cab903274';`,
  `UPDATE word_mapping_strongs SET orig_component = 'Πέτρος' WHERE mapping_id = '97f647a7-80c0-43f1-8ea9-633cab903274' AND strongs_id = 'G4074';`,

  // John 13:8 pos 4 '«لَنْ'
  `UPDATE word_mappings SET orig_word = 'οὐ', orig_surface = 'οὐ', morph_source = 'morphgnt_sblgnt' WHERE id = '2eb88ddd-1792-4961-8184-0514a4c16a68';`,
  `UPDATE word_mapping_strongs SET orig_component = 'οὐ' WHERE mapping_id = '2eb88ddd-1792-4961-8184-0514a4c16a68' AND strongs_id = 'G3756';`,

  // John 13:8 pos 5 'تَغْسِلَ'
  `UPDATE word_mappings SET orig_word = 'νίπτω', orig_surface = 'νίψῃς', morph_source = 'morphgnt_sblgnt' WHERE id = 'acdd4c0c-58cf-4535-9705-1b2a5dcf4ef7';`,
  `UPDATE word_mapping_strongs SET orig_component = 'νίψῃς' WHERE mapping_id = 'acdd4c0c-58cf-4535-9705-1b2a5dcf4ef7' AND strongs_id = 'G3538';`,

  // John 13:8 pos 9 'يَسُوعُ:'
  `UPDATE word_mappings SET orig_word = 'Ἰησοῦς', orig_surface = 'Ἰησοῦς', morph_source = 'morphgnt_sblgnt' WHERE id = '8304e226-58c3-4839-8e21-e09e8bc3f9ac';`,
  `UPDATE word_mapping_strongs SET orig_component = 'Ἰησοῦς' WHERE mapping_id = '8304e226-58c3-4839-8e21-e09e8bc3f9ac' AND strongs_id = 'G2424';`,

  // John 13:8 pos 10 '«إِنْ'
  `UPDATE word_mappings SET orig_word = 'ἐάν', orig_surface = 'ἐὰν', morph_source = 'morphgnt_sblgnt' WHERE id = '9b5920b0-1041-4d11-a343-781cd3c3b1d0';`,
  `UPDATE word_mapping_strongs SET orig_component = 'ἐὰν' WHERE mapping_id = '9b5920b0-1041-4d11-a343-781cd3c3b1d0' AND strongs_id = 'G1437';`,

  // John 13:8 pos 13 'أَغْسِلُكَ'
  `UPDATE word_mappings SET orig_word = 'νίπτω', orig_surface = 'νίψω', morph_source = 'morphgnt_sblgnt' WHERE id = 'b619e14d-d1db-4f12-9d35-b29e64f0e75b';`,
  `UPDATE word_mapping_strongs SET orig_component = 'νίψω' WHERE mapping_id = 'b619e14d-d1db-4f12-9d35-b29e64f0e75b' AND strongs_id = 'G3538';`,

  // Revelation 1:8 pos 16 'كُلِّ'
  `UPDATE word_mappings SET orig_word = 'παντοκράτωρ', orig_surface = 'παντοκράτωρ', morph_source = 'morphgnt_sblgnt' WHERE id = '7c0a7b2e-6d53-46fe-ab66-82244ef4db3b';`,
  `UPDATE word_mapping_strongs SET orig_component = 'παντοκράτωρ' WHERE mapping_id = '7c0a7b2e-6d53-46fe-ab66-82244ef4db3b' AND strongs_id = 'G3841';`,

  // Revelation 1:8 pos 17 'شَيْءٍ'
  `UPDATE word_mappings SET orig_word = 'παντοκράτωρ', orig_surface = 'παντοκράτωρ', morph_source = 'morphgnt_sblgnt' WHERE id = '41ea1a16-626e-4b43-81ce-aeccfefccaee';`,
  `UPDATE word_mapping_strongs SET orig_component = 'παντοκράτωρ' WHERE mapping_id = '41ea1a16-626e-4b43-81ce-aeccfefccaee' AND strongs_id = 'G3841';`,

  '-- 4. NT spreadsheet loci corrections',
  // Romans 1:20 pos 4 'الْمَنْظُورَةِ'
  `UPDATE word_mappings SET strongs_id = 'G517', orig_word = 'ἀόρατος', orig_surface = 'ἀόρατα', morph_pos = 'adjective', morph_source = 'morphgnt_sblgnt'
   WHERE id = 'fb8f8898-3c52-450d-a979-4f1f501bdf9c';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = 'fb8f8898-3c52-450d-a979-4f1f501bdf9c';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('fb8f8898-3c52-450d-a979-4f1f501bdf9c', 'G517', 1, 'primary', 'ἀόρατα');`,

  // 1 Corinthians 1:2 pos 16 'يَدْعُونَ'
  `UPDATE word_mappings SET orig_word = 'ἐπικαλέω', orig_surface = 'ἐπικαλουμένοις', morph_pos = 'verb', morph_source = 'morphgnt_sblgnt'
   WHERE id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=46 AND v.chapter_num=1 AND v.verse_num=2 AND wm.ar_word_position=16);`,
  `UPDATE word_mapping_strongs SET orig_component = 'ἐπικαλουμένοις'
   WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=46 AND v.chapter_num=1 AND v.verse_num=2 AND wm.ar_word_position=16) AND strongs_id = 'G1941';`,

  // 1 Corinthians 1:11 pos 8 'خُلُوِي'
  `UPDATE word_mappings SET strongs_id = 'G5514', orig_word = 'Χλόη', orig_surface = 'Χλόης', morph_pos = 'proper_noun', morph_source = 'morphgnt_sblgnt'
   WHERE id = 'd33dc704-3bac-4928-93fe-c1c67908e21e';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = 'd33dc704-3bac-4928-93fe-c1c67908e21e';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('d33dc704-3bac-4928-93fe-c1c67908e21e', 'G5514', 1, 'primary', 'Χλόης');`,

  // 1 Corinthians 2:1 pos 9 'بِسُمُوِّ'
  `UPDATE word_mappings SET strongs_id = 'G5247', orig_word = 'ὑπεροχή', orig_surface = 'ὑπεροχὴν', morph_pos = 'noun', morph_source = 'morphgnt_sblgnt'
   WHERE id = '0cc5201b-0e0b-4635-87f4-413cdbbc4ac2';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = '0cc5201b-0e0b-4635-87f4-413cdbbc4ac2';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('0cc5201b-0e0b-4635-87f4-413cdbbc4ac2', 'G5247', 1, 'primary', 'ὑπεροχὴν');`,

  // 1 Corinthians 2:10 pos 4 'نَحْنُ'
  `UPDATE word_mappings SET strongs_id = 'G2254', orig_word = 'ἐγώ', orig_surface = 'ἡμῖν', morph_pos = 'pronoun', morph_source = 'morphgnt_sblgnt'
   WHERE id = 'b6239921-85ce-40d4-9d00-476ad1f7e958';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = 'b6239921-85ce-40d4-9d00-476ad1f7e958';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('b6239921-85ce-40d4-9d00-476ad1f7e958', 'G2254', 1, 'primary', 'ἡμῖν');`,

  // 2 Corinthians 1:10 pos 5 'مِثْلِ'
  `UPDATE word_mappings SET strongs_id = 'G5082', orig_word = 'τηλικοῦτος', orig_surface = 'τηλικούτου', morph_pos = 'adjective', morph_source = 'morphgnt_sblgnt'
   WHERE id = 'cb649bd6-ef30-4dc9-9f1a-c719f4f083a6';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = 'cb649bd6-ef30-4dc9-9f1a-c719f4f083a6';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('cb649bd6-ef30-4dc9-9f1a-c719f4f083a6', 'G5082', 1, 'primary', 'τηλικούτου');`,

  // 2 Corinthians 1:10 pos 6 'هذَا'
  `UPDATE word_mappings SET strongs_id = 'G5082', orig_word = 'τηλικοῦτος', orig_surface = 'τηλικούτου', morph_pos = 'adjective', morph_source = 'morphgnt_sblgnt'
   WHERE id = 'b98c9799-3a18-492f-8d8e-7256d8277882';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = 'b98c9799-3a18-492f-8d8e-7256d8277882';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('b98c9799-3a18-492f-8d8e-7256d8277882', 'G5082', 1, 'primary', 'τηλικούτου');`,

  // 2 Corinthians 1:11 pos 16 'لَنَا'
  `UPDATE word_mappings SET strongs_id = 'G2248', orig_word = 'ἡμεῖς', orig_surface = 'ἡμᾶς', morph_pos = 'pronoun', morph_source = 'morphgnt_sblgnt'
   WHERE id = '096c5f01-4674-45ba-a9e9-ad86412c5c78';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = '096c5f01-4674-45ba-a9e9-ad86412c5c78';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('096c5f01-4674-45ba-a9e9-ad86412c5c78', 'G2248', 1, 'primary', 'ἡμᾶς');`,

  // 2 Corinthians 1:24 pos 8 'مُوازِرُونَ'
  `UPDATE word_mappings SET strongs_id = 'G4904', orig_word = 'συνεργός', orig_surface = 'συνεργοί', morph_pos = 'noun', morph_source = 'morphgnt_sblgnt'
   WHERE id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=47 AND v.chapter_num=1 AND v.verse_num=24 AND wm.ar_word_position=8);`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=47 AND v.chapter_num=1 AND v.verse_num=24 AND wm.ar_word_position=8);`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   SELECT wm.id, 'G4904', 1, 'primary', 'συνεργοί'
   FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=47 AND v.chapter_num=1 AND v.verse_num=24 AND wm.ar_word_position=8;`,

  // Galatians 2:4 pos 4 'الْكَذَبَةِ'
  `UPDATE word_mappings SET strongs_id = 'G5569', orig_word = 'ψευδάδελφος', orig_surface = 'ψευδαδέλφους', morph_pos = 'noun', morph_source = 'morphgnt_sblgnt'
   WHERE id = '40bcb0e6-8d94-4ba2-842a-1ad26a4a7551';`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = '40bcb0e6-8d94-4ba2-842a-1ad26a4a7551';`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   VALUES ('40bcb0e6-8d94-4ba2-842a-1ad26a4a7551', 'G5569', 1, 'primary', 'ψευδαδέλفους');`,

  // Galatians 2:4 pos 5 'الْمُدْخَلِينَ' & pos 6 'خُفْيَةً'
  `UPDATE word_mappings SET strongs_id = 'G3920', orig_word = 'παρείσακτος', orig_surface = 'παρεισάκτους', morph_pos = 'adjective', morph_source = 'morphgnt_sblgnt'
   WHERE id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=5);`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=5);`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   SELECT wm.id, 'G3920', 1, 'primary', 'παρεισάκτους'
   FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=5;`,

  `UPDATE word_mappings SET strongs_id = 'G3920', orig_word = 'παρείσακτος', orig_surface = 'παρεισάκτους', morph_pos = 'adjective', morph_source = 'morphgnt_sblgnt'
   WHERE id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=6);`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=6);`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   SELECT wm.id, 'G3920', 1, 'primary', 'παρεισάκτους'
   FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=6;`,

  // Galatians 2:4 pos 10 'لِيَتَجَسَّسُوا'
  `UPDATE word_mappings SET strongs_id = 'G2684', orig_word = 'κατασκοπέω', orig_surface = 'κατασκοπῆσαι', morph_pos = 'verb', morph_source = 'morphgnt_sblgnt'
   WHERE id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=10);`,
  `DELETE FROM word_mapping_strongs WHERE mapping_id = (SELECT wm.id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=10);`,
  `INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component)
   SELECT wm.id, 'G2684', 1, 'primary', 'κατασκοπῆσαι'
   FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position=10;`,

  'COMMIT;'
];

const fullSql = sqlStatements.join('\n');
executeSql(fullSql);
console.log('SQL transaction applied successfully!');

// Verification queries
console.log('\n--- Verification: Checking link_role LIKE "primary_%" ---');
const remainingPrimarySpecial = executeSql("SELECT count(*) FROM word_mapping_strongs WHERE link_role LIKE 'primary_%';");
console.log(`Remaining special primary roles: ${remainingPrimarySpecial}`);

console.log('\n--- Verification: Checking 23 placeholder records ---');
const remainingPlaceholders = executeSql(`
SELECT count(*) FROM word_mappings
WHERE strongs_id IS NOT NULL AND trim(coalesce(orig_word, '')) IN ('', '-', '---', '—');
`);
console.log(`Remaining placeholder orig_words: ${remainingPlaceholders}`);

console.log('\n--- Verification: Checking Genesis 4:18 names ---');
const gen418 = executeSql(`
SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface
FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
WHERE v.book_id = 1 AND v.chapter_num = 4 AND v.verse_num = 18 AND wm.ar_word_position IN (3,4,9,10);
`);
console.log(gen418);

console.log('\n--- Verification: Checking NT Spreadsheet loci ---');
const ntLoci = executeSql(`
SELECT v.book_id, v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface, wm.morph_pos
FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id
WHERE (v.book_id=45 AND v.chapter_num=1 AND v.verse_num=20 AND wm.ar_word_position=4)
   OR (v.book_id=46 AND v.chapter_num=1 AND v.verse_num=2 AND wm.ar_word_position=16)
   OR (v.book_id=46 AND v.chapter_num=1 AND v.verse_num=11 AND wm.ar_word_position=8)
   OR (v.book_id=46 AND v.chapter_num=2 AND v.verse_num=1 AND wm.ar_word_position=9)
   OR (v.book_id=46 AND v.chapter_num=2 AND v.verse_num=10 AND wm.ar_word_position=4)
   OR (v.book_id=47 AND v.chapter_num=1 AND v.verse_num=10 AND wm.ar_word_position IN (5,6))
   OR (v.book_id=47 AND v.chapter_num=1 AND v.verse_num=11 AND wm.ar_word_position=16)
   OR (v.book_id=47 AND v.chapter_num=1 AND v.verse_num=24 AND wm.ar_word_position=8)
   OR (v.book_id=48 AND v.chapter_num=2 AND v.verse_num=4 AND wm.ar_word_position IN (4,5,6,10));
`);
console.log(ntLoci);

console.log('\n--- Verification: Multi-Primary Conflicts ---');
const multiPrimaries = executeSql(`
SELECT count(*) FROM (
  SELECT mapping_id FROM word_mapping_strongs WHERE link_role = 'primary' GROUP BY mapping_id HAVING count(*) > 1
);
`);
console.log(`Mappings with >1 primary role: ${multiPrimaries}`);
