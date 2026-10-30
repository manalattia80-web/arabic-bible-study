const child = require('child_process');

function runSql(sql) {
  child.execFileSync('sqlite_dist\\sqlite3.exe', ['mobile/assets/bible_study.db', sql]);
}

console.log('--- Applying Repairs to Revelation 9:14 and the 11 Substantive Loci ---');

// 1. Revelation 9:14
// Update verses.text_original to use λέγοντα instead of λέγουσαν
runSql(`
  UPDATE verses 
  SET text_original = REPLACE(text_original, 'λέγουσαν', 'λέγοντα')
  WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14;
`);

// Update word_mappings w1 (قَائِلاً)
runSql(`
  UPDATE word_mappings 
  SET orig_surface = 'λέγοντα',
      orig_morphology = 'V- -PAPASM-',
      morph_case = 'accusative',
      morph_gender = 'masculine',
      morph_number = 'singular',
      morph_pos = 'verb',
      morph_tense = 'present',
      morph_voice = 'active',
      morph_mood = 'participle',
      grammar_notes = 'اسم فاعل مذكر منصوب مفرد في طبعة SBLGNT النقدية (λέγοντα) حال مذكرة مطابقة لـ «قَائِلاً»، ويقابلها في النص المستلم (TR) والبيزنطي اسم فاعل مؤنث (λέγουσαν) عائد على الصوت φωνῆς في ع13.'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14)
    AND ar_word_position = 1;
`);

// Update word_mapping_strongs for Rev 9:14 w1
runSql(`
  UPDATE word_mapping_strongs
  SET orig_component = 'λέγοντα',
      orig_morphology = 'V- -PAPASM-'
  WHERE mapping_id = (
    SELECT id FROM word_mappings 
    WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14)
      AND ar_word_position = 1
  );
`);

// 2. Matthew 22:30 w8 (بَلْ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'ἀλλ᾽',
      orig_morphology = 'C- --------',
      orig_word_position = 8
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 8;
`);

// 3. Luke 1:12 w6 (عَلَيْهِ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'ἐπ᾽',
      orig_morphology = 'P- --------',
      orig_word_position = 6
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 1 AND verse_num = 12)
    AND ar_word_position = 6;
`);

// 4. 1 Corinthians 3:2 w10 (بَلِ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'ἀλλ᾽',
      orig_morphology = 'C- --------',
      orig_word_position = 9
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 46 AND chapter_num = 3 AND verse_num = 2)
    AND ar_word_position = 10;
`);

// 5. Acts 11:28 w10 (عَظِيمًا)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'μέγαν',
      orig_morphology = 'A- ----ASM-',
      morph_case = 'accusative',
      morph_gender = 'masculine'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 11 AND verse_num = 28)
    AND ar_word_position = 10;
`);

// 6. Joshua 3:12 w6 (مِنْ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'מִשִּׁבְטֵ֖י',
      orig_word = 'מִן',
      strongs_id = 'H4480',
      orig_morphology = 'HR',
      orig_word_position = 7
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 3 AND verse_num = 12)
    AND ar_word_position = 6;
`);

// 7. Judges 20:42 w3 (بَنِي) & w12 (مِنَ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'אִ֤ישׁ',
      orig_word = 'אִישׁ',
      strongs_id = 'H376',
      orig_morphology = 'HNcmsa',
      orig_word_position = 3,
      grammar_notes = 'لفظ «אִישׁ» العبري استُعمل اسم جمع لرجال إسرائيل، وعرّبه الفانديك اصطلاحياً بـ «بَنِي إِسْرَائِيلَ».'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 20 AND verse_num = 42)
    AND ar_word_position = 3;
`);

runSql(`
  UPDATE word_mappings
  SET orig_surface = 'מֵהֶ֣עָרִ֔ים',
      orig_word = 'מִן',
      strongs_id = 'H4480',
      orig_morphology = 'HR',
      orig_word_position = 10
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 7 AND chapter_num = 20 AND verse_num = 42)
    AND ar_word_position = 12;
`);

// 8. 2 Kings 5:1 w14 (عَنْ) & w15 (يَدِهِ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'בֹ֛ו',
      orig_word = 'בְּ',
      strongs_id = 'H9003',
      orig_morphology = 'HR',
      orig_word_position = 8,
      grammar_notes = 'في الأصل العبري «כִּי־בוֹ נָתַן־יְהוָה» (لأنه به جعل الرب)، وعرّبه الفانديك بعبارة «عَنْ يَدِهِ».'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 14;
`);

runSql(`
  UPDATE word_mappings
  SET orig_surface = 'בֹ֛ו',
      orig_word = 'הוּא',
      strongs_id = 'H1992',
      orig_morphology = 'Sp3ms',
      orig_word_position = 8,
      grammar_notes = 'ضمير الغائب المتصل بالجار والمجرور العبري «בוֹ» ترجمه الفانديك بـ «يَدِهِ» مكملاً للعبارة.'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 15;
`);

// 9. Ezra 7:21 w18 (مِنْكُمْ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'יִ֠שְׁאֲלֶנְכֹון',
      orig_word = 'מִן',
      strongs_id = 'H4481',
      orig_morphology = 'TR/Sp2mp',
      orig_word_position = 15,
      grammar_notes = 'الضمير الآرامي المتصل «־ֶנְכוֹן» بالفعل «יִשְׁאַל» يفيد المفعول به المخاطب (يطلب منكم).'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
    AND ar_word_position = 18;
`);

// 10. Daniel 2:38 w17 (مِنْ)
runSql(`
  UPDATE word_mappings
  SET orig_surface = 'דִּ֥י',
      orig_word = 'דִּי',
      strongs_id = 'H1768',
      orig_morphology = 'ATr',
      orig_word_position = 21,
      grammar_notes = 'أداة الإضافة الآرامية «דִּי» تفيد النسبة والمادة (رأس من ذهب = רֵאשָׁה דִי דַהֲבָא).'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 38)
    AND ar_word_position = 17;
`);

console.log('All 12 repairs executed successfully!');
