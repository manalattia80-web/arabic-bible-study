-- ============================================================
-- Arabic AVD Bible Study App — Sample Seed Data
-- Run this in Supabase SQL Editor to see some text in the app!
-- ============================================================

-- 1. Insert Books (Genesis and John)
INSERT INTO books (id, testament_id, name_ar, name_ar_short, name_en, name_en_short, chapter_count, sort_order) 
VALUES
(1, 1, 'التكوين', 'تكوين', 'Genesis', 'Gen', 50, 1),
(40, 2, 'إنجيل متى', 'متى', 'Matthew', 'Matt', 28, 40),
(43, 2, 'إنجيل يوحنا', 'يوحنا', 'John', 'John', 21, 43)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Chapters
INSERT INTO chapters (id, book_id, number) VALUES
('00000000-0000-0000-0000-000000000001', 1, 1),
('00000000-0000-0000-0000-000000000043', 43, 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Sample Verses
INSERT INTO verses (id, chapter_id, book_id, chapter_num, verse_num, text_avd_ar, text_original, text_original_lang) VALUES
('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 1, 1, 'فِي الْبَدْءِ خَلَقَ اللهُ السَّمَاوَاتِ وَالأَرْضَ.', 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ', 'hebrew'),
('11111111-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000043', 43, 1, 1, 'فِي الْبَدْءِ كَانَ الْكَلِمَةُ، وَالْكَلِمَةُ كَانَ عِنْدَ اللهِ، وَكَانَ الْكَلِمَةُ اللهَ.', 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.', 'greek')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Sample Strongs Dictionary Entries
INSERT INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en) VALUES
('H7225', 'hebrew', 'רֵאשִׁית', 'reshiyth', 'first, beginning, best, chief'),
('G746', 'greek', 'ἀρχή', 'arche', 'beginning, origin')
ON CONFLICT (strongs_id) DO NOTHING;

-- 5. Insert Sample Arabic Translations for Strongs (Admin Panel Feature)
INSERT INTO strongs_ar_translations (strongs_id, definition_ar, notes_ar) VALUES
('H7225', 'بداية، أول، رأس', 'تستخدم للإشارة إلى بداية الزمن أو أول الأشياء'),
('G746', 'بدء، أصل، مبدأ', 'تستخدم للدلالة على البداية الزمنية أو منبع الأشياء')
ON CONFLICT (strongs_id) DO NOTHING;

-- 6. Insert Sample Word Mappings (Interlinear for Gen 1:1)
INSERT INTO word_mappings (verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, transliteration_lat) VALUES
('11111111-0000-0000-0000-000000000001', 1, 1, 'فِي الْبَدْءِ', 'בְּרֵאשִׁית', 'hebrew', 'H7225', 'Bereshit'),
('11111111-0000-0000-0000-000000000001', 2, 2, 'خَلَقَ', 'בָּרָא', 'hebrew', null, 'bara'),
('11111111-0000-0000-0000-000000000001', 3, 3, 'اللهُ', 'אֱלֹהִים', 'hebrew', null, 'Elohim')
ON CONFLICT DO NOTHING;
