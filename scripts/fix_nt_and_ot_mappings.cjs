const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("Starting linguistic fixes...");

  // 1. Insert G976 into strongs_entries if not exists
  db.run(`
    INSERT OR REPLACE INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en, kjv_usage)
    VALUES (
      'G976',
      'greek',
      'βίβλος',
      'biblos',
      'properly the inner bark of the papyrus plant, i.e. (by implication) a sheet or roll of the material, a book, roll, scroll, written record',
      'book (13x).'
    );
  `, (err) => {
    if (err) console.error("Error inserting G976 into strongs_entries:", err);
    else console.log("Successfully inserted/updated G976 in strongs_entries.");
  });

  // 2. Insert G976 into strongs_ar_translations if not exists
  db.run(`
    INSERT OR REPLACE INTO strongs_ar_translations (strongs_id, pronunciation_ar, definition_ar, notes_ar, is_verified)
    VALUES (
      'G976',
      'بِيبْلُوس (biblos)',
      '1. المعنى الأصلي: قشر نبات البردي أو اللحاء الداخلي الذي يُصنع منه ورق الكتابة، ثم أُطلقت بالتبعية على الدرج أو السفر أو الكتاب المكتوب.\n2. السياق الكتابي: استُخدمت في العهد الجديد للإشارة إلى أسفار العهد القديم (مثل «سفر المزامير» و«سفر أقوال إشعياء»)، وسفر الأنساب والتاريخ (متى 1: 1 «كتاب ميلاد يسوع المسيح»)، و«سفر الحياة» في سفر الرؤيا.\n3. البعد اللاهوتي: تؤكد الكلمة تاريخية ويقينية الإعلان الإلهي المدون بالوحي، فمجيء المسيح مسجل في كتاب محقق وموعود به في أسفار الأنبياء، وأسماء المفديين محفوظة في سفر الحياة الإلهي.',
      'تُترجم في العربية غالباً بـ (كتاب) أو (سفر).',
      1
    );
  `, (err) => {
    if (err) console.error("Error inserting G976 into strongs_ar_translations:", err);
    else console.log("Successfully inserted/updated G976 in strongs_ar_translations.");
  });

  // 3. Fix Matthew 1:1 - كتاب
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 1)
      AND ar_word_position = 1;
  `, (err) => {
    if (err) console.error("Error updating Matt 1:1:", err);
    else console.log("Updated Matt 1:1 'كِتَابُ' -> G976.");
  });

  // 4. Fix Matthew 1:7 - رحبعام، أبيا، آسا
  // ar_pos 3: رَحَبْعَامَ -> G4497 (Ῥοβοάμ)
  // ar_pos 4: وَرَحَبْعَامُ -> G4497 (Ῥοβοάμ)
  // ar_pos 5: أَبِيَّا -> G7 (Ἀβιά)
  // ar_pos 6: وَأَبِيَّا -> G7 (Ἀβιά)
  // ar_pos 7: آسَا -> G760 (Ἀσά)
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'Ῥοβοάμ', strongs_id = 'G4497', orig_word_lang = 'greek', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 7)
      AND ar_word_position IN (3, 4);
  `, (err) => {
    if (err) console.error("Error updating Matt 1:7 Rehoboam:", err);
    else console.log("Updated Matt 1:7 'رَحَبْعَامَ / وَرَحَبْعَامُ' -> G4497.");
  });

  db.run(`
    UPDATE word_mappings
    SET orig_word = 'Ἀβιά', strongs_id = 'G7', orig_word_lang = 'greek', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 7)
      AND ar_word_position IN (5, 6);
  `, (err) => {
    if (err) console.error("Error updating Matt 1:7 Abijah:", err);
    else console.log("Updated Matt 1:7 'أَبِيَّا / وَأَبِيَّا' -> G7.");
  });

  db.run(`
    UPDATE word_mappings
    SET orig_word = 'Ἀσά', strongs_id = 'G760', orig_word_lang = 'greek', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 7)
      AND ar_word_position = 7;
  `, (err) => {
    if (err) console.error("Error updating Matt 1:7 Asa:", err);
    else console.log("Updated Matt 1:7 'آسَا' -> G760.");
  });

  // 5. Fix Matthew 1:20 - ملاك -> G32 (ἄγγελος)
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'ἄγγελος', strongs_id = 'G32', orig_word_lang = 'greek', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 20)
      AND ar_word_position = 9;
  `, (err) => {
    if (err) console.error("Error updating Matt 1:20 Angel:", err);
    else console.log("Updated Matt 1:20 'مَلاَكُ' -> G32.");
  });

  // 6. Fix other NT occurrences of G976 (βίβλος)
  const biblosVerses = [
    { book: 42, ch: 3, v: 4, pos: 5 },   // Luke 3:4 سفر
    { book: 42, ch: 20, v: 42, pos: 5 }, // Luke 20:42 كتاب
    { book: 44, ch: 1, v: 20, pos: 4 },  // Acts 1:20 سفر
    { book: 44, ch: 7, v: 42, pos: 11 }, // Acts 7:42 كتاب
    { book: 50, ch: 4, v: 3, pos: 24 },  // Phil 4:3 سفر
    { book: 66, ch: 3, v: 5, pos: 11 },  // Rev 3:5 سفر
    { book: 66, ch: 13, v: 8, pos: 15 }, // Rev 13:8 سفر
    { book: 66, ch: 17, v: 8, pos: 25 }, // Rev 17:8 سفر
    { book: 66, ch: 21, v: 27, pos: 13 } // Rev 21:27 سفر
  ];

  biblosVerses.forEach(item => {
    db.run(`
      UPDATE word_mappings
      SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = ${item.book} AND chapter_num = ${item.ch} AND verse_num = ${item.v})
        AND ar_word_position = ${item.pos};
    `);
  });
  console.log("Updated other NT occurrences of βίβλος (G976).");

  // 7. Fix 1 Sam 17:2, 17:19, 21:9 - وادي البطم
  // 1 Sam 17:2
  // pos 6: في -> '---' / NULL
  // pos 7: وادي -> 'עֵמֶק' / H6010
  // pos 8: البطم -> 'הָאֵלָה' / H425
  db.run(`
    UPDATE word_mappings
    SET orig_word = '---', strongs_id = NULL, is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 2)
      AND ar_word_position = 6;
  `);
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'עֵמֶק', strongs_id = 'H6010', orig_word_lang = 'hebrew', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 2)
      AND ar_word_position = 7;
  `);
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'הָאֵלָה', strongs_id = 'H425', orig_word_lang = 'hebrew', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 2)
      AND ar_word_position = 8;
  `);

  // 1 Sam 17:19
  // pos 7: في -> '---' / NULL
  // pos 8: وادي -> 'עֵמֶק' / H6010
  // pos 9: البطم -> 'הָאֵلָה' / H425
  db.run(`
    UPDATE word_mappings
    SET orig_word = '---', strongs_id = NULL, is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 19)
      AND ar_word_position = 7;
  `);
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'עֵמֶק', strongs_id = 'H6010', orig_word_lang = 'hebrew', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 19)
      AND ar_word_position = 8;
  `);
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'הָאֵלָה', strongs_id = 'H425', orig_word_lang = 'hebrew', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 19)
      AND ar_word_position = 9;
  `);

  // 1 Sam 21:9
  // pos 9: في -> '---' / NULL
  // pos 10: وادي -> 'עֵמֶק' / H6010
  // pos 11: البطم -> 'הָאֵלָה' / H425
  db.run(`
    UPDATE word_mappings
    SET orig_word = '---', strongs_id = NULL, is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 21 AND verse_num = 9)
      AND ar_word_position = 9;
  `);
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'עֵמֶק', strongs_id = 'H6010', orig_word_lang = 'hebrew', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 21 AND verse_num = 9)
      AND ar_word_position = 10;
  `);
  db.run(`
    UPDATE word_mappings
    SET orig_word = 'הָאֵלָה', strongs_id = 'H425', orig_word_lang = 'hebrew', is_verified = 1
    WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 21 AND verse_num = 9)
      AND ar_word_position = 11;
  `);

  console.log("Updated 1 Sam 17:2, 17:19, 21:9 'وادي البطم' -> H6010 + H425.");
});

db.close((err) => {
  if (err) console.error("Error closing DB:", err);
  else console.log("Database updated and closed successfully.");
});
