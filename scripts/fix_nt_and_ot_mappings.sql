-- 1. Insert G976 into strongs_entries if not exists
INSERT OR REPLACE INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en, kjv_usage)
VALUES (
  'G976',
  'greek',
  'βίβλος',
  'biblos',
  'properly the inner bark of the papyrus plant, i.e. (by implication) a sheet or roll of the material, a book, roll, scroll, written record',
  'book (13x).'
);

-- 2. Insert G976 into strongs_ar_translations if not exists
INSERT OR REPLACE INTO strongs_ar_translations (strongs_id, pronunciation_ar, definition_ar, notes_ar, is_verified)
VALUES (
  'G976',
  'بِيبْلُوس (biblos)',
  '1. المعنى الأصلي: قشر نبات البردي أو اللحاء الداخلي الذي يُصنع منه ورق الكتابة، ثم أُطلقت بالتبعية على الدرج أو السفر أو الكتاب المكتوب.
2. السياق الكتابي: استُخدمت في العهد الجديد للإشارة إلى أسفار العهد القديم (مثل «سفر المزامير» و«سفر أقوال إشعياء»)، وسفر الأنساب والتاريخ (متى 1: 1 «كتاب ميلاد يسوع المسيح»)، و«سفر الحياة» في سفر الرؤيا.
3. البعد اللاهوتي: تؤكد الكلمة تاريخية ويقينية الإعلان الإلهي المدون بالوحي، فمجيء المسيح مسجل في كتاب محقق وموعود به في أسفار الأنبياء، وأسماء المفديين محفوظة في سفر الحياة الإلهي.',
  'تُترجم في العربية غالباً بـ (كتاب) أو (سفر).',
  1
);

-- 3. Fix Matthew 1:1 - كتاب
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 1)
  AND ar_word_position = 1;

-- 4. Fix Matthew 1:7 - رحبعام، أبيا، آسا
UPDATE word_mappings
SET orig_word = 'Ῥοβοάμ', strongs_id = 'G4497', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 7)
  AND ar_word_position IN (3, 4);

UPDATE word_mappings
SET orig_word = 'Ἀβιά', strongs_id = 'G7', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 7)
  AND ar_word_position IN (5, 6);

UPDATE word_mappings
SET orig_word = 'Ἀσά', strongs_id = 'G760', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 7)
  AND ar_word_position = 7;

-- 5. Fix Matthew 1:20 - ملاك -> G32 (ἄγγελος)
UPDATE word_mappings
SET orig_word = 'ἄγγελος', strongs_id = 'G32', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 20)
  AND ar_word_position = 9;

-- 6. Fix other NT occurrences of G976 (βίβλος)
-- Luke 3:4 سفر
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 3 AND verse_num = 4)
  AND ar_word_position = 5;

-- Luke 20:42 كتاب
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 20 AND verse_num = 42)
  AND ar_word_position = 5;

-- Acts 1:20 سفر
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 1 AND verse_num = 20)
  AND ar_word_position = 4;

-- Acts 7:42 كتاب
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 44 AND chapter_num = 7 AND verse_num = 42)
  AND ar_word_position = 11;

-- Phil 4:3 سفر
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 50 AND chapter_num = 4 AND verse_num = 3)
  AND ar_word_position = 24;

-- Rev 3:5 سفر
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 3 AND verse_num = 5)
  AND ar_word_position = 11;

-- Rev 13:8 سفر
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 13 AND verse_num = 8)
  AND ar_word_position = 15;

-- Rev 17:8 سفر
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 17 AND verse_num = 8)
  AND ar_word_position = 25;

-- Rev 21:27 سفر
UPDATE word_mappings
SET orig_word = 'βίβλος', strongs_id = 'G976', orig_word_lang = 'greek', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 21 AND verse_num = 27)
  AND ar_word_position = 13;

-- 7. Fix 1 Sam 17:2, 17:19, 21:9 - وادي البطم
-- 1 Sam 17:2
UPDATE word_mappings
SET orig_word = '---', strongs_id = NULL, is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 2)
  AND ar_word_position = 6;

UPDATE word_mappings
SET orig_word = 'עֵמֶק', strongs_id = 'H6010', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 2)
  AND ar_word_position = 7;

UPDATE word_mappings
SET orig_word = 'הָאֵלָה', strongs_id = 'H425', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 2)
  AND ar_word_position = 8;

-- 1 Sam 17:19
UPDATE word_mappings
SET orig_word = '---', strongs_id = NULL, is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 19)
  AND ar_word_position = 7;

UPDATE word_mappings
SET orig_word = 'עֵמֶק', strongs_id = 'H6010', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 19)
  AND ar_word_position = 8;

UPDATE word_mappings
SET orig_word = 'הָאֵלָה', strongs_id = 'H425', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 17 AND verse_num = 19)
  AND ar_word_position = 9;

-- 1 Sam 21:9
UPDATE word_mappings
SET orig_word = '---', strongs_id = NULL, is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 21 AND verse_num = 9)
  AND ar_word_position = 9;

UPDATE word_mappings
SET orig_word = 'עֵמֶק', strongs_id = 'H6010', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 21 AND verse_num = 9)
  AND ar_word_position = 10;

UPDATE word_mappings
SET orig_word = 'הָאֵלָה', strongs_id = 'H425', orig_word_lang = 'hebrew', is_verified = 1
WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 9 AND chapter_num = 21 AND verse_num = 9)
  AND ar_word_position = 11;
