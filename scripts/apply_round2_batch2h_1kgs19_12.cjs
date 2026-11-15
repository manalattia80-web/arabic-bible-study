/**
 * scripts/apply_round2_batch2h_1kgs19_12.cjs
 *
 * Applies calibration for 1 Kings 19:12 (Batch 2H):
 * - #5 «يَكُنِ» is converted to documented syntactic_ar (AR_SYNTACTIC:B11.C19.V12.w5) with zero Strongs and zero components.
 * - #7 «فِي» & #8 «النَّارِ» form a documented compound alignment unit to w5 (בָאֵ֖שׁ — HRd/Ncbsa):
 *     #7 «فِي» has primary H9003@w5 (inseparable preposition prefix בְּ).
 *     #8 «النَّارِ» has primary H784@w5 (אֵשׁ) and secondary H9003@w5 (בָ).
 * - #9 «وَبَعْدَ» is mapped to w7 (וְאַחַ֣ר - HC/R - H310).
 * - #10 «النَّارِ» is mapped to w8 (הָאֵ֔שׁ - HTd/Ncbsa - H784).
 * - #11 «صَوْتٌ» is mapped to w9 (ק֖וֹل - HNcmsc - H6963).
 * - #12 «مُنْخَفِضٌ» is mapped to w10 (דְּמָמָ֥ה - HNcfsa - H1827).
 * - #13 «خَفِيفٌ» is mapped to w11 (דַקָּֽה - HAafsa - H1851).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

function q(sql) {
  return execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).trim();
}

console.log('Applying 1 Kings 19:12 calibration to database...');

const sql = `
BEGIN TRANSACTION;

-- 1. Update #5 «يَكُنِ» to syntactic_ar
UPDATE word_mappings SET
  strongs_id = NULL,
  orig_word_position = 0,
  orig_word = '—',
  orig_surface = '—',
  orig_morphology = NULL,
  morph_pos = 'syntactic_ar',
  morph_source = 'syntactic_ar',
  verified_locator = 'AR_SYNTACTIC:B11.C19.V12.w5',
  relation_type = 'syntactic_copula',
  grammar_notes = 'رابطة نحوية مساعدة في صياغة الجملة المنفية العربية («وَلَمْ يَكُنِ الرَّبُّ فِي النَّارِ») حيث الجملة العبرية اسمية خالية من فعل الكينونة (לֹא בָאֵשׁ יְהוָה).'
WHERE id = '1f98f050-ab80-44ab-bdd7-1a224447f0ee';

DELETE FROM word_mapping_strongs WHERE mapping_id = '1f98f050-ab80-44ab-bdd7-1a224447f0ee';

-- 2. Update #7 «فِي» to w5 preposition H9003
UPDATE word_mappings SET
  strongs_id = 'H9003',
  orig_word_position = 5,
  orig_word = 'בְּ',
  orig_surface = 'בָאֵ֖שׁ',
  orig_morphology = 'HRd',
  morph_pos = 'preposition',
  morph_source = 'oshb_wlc',
  verified_locator = 'OSHB:B11.C19.V12.w5',
  relation_type = 'compound_phrase',
  grammar_notes = 'حرف الجر العبري المتصل (الباء) في בָאֵשׁ (الموضع 5) دال على الظرفية، بينما الاسم أֵשׁ يقابل الكلمة التالية «النَّارِ».'
WHERE id = '86b86fbe-c9b7-42f4-b959-e8a8636ff95a';

DELETE FROM word_mapping_strongs WHERE mapping_id = '86b86fbe-c9b7-42f4-b959-e8a8636ff95a';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('86b86fbe-c9b7-42f4-b959-e8a8636ff95a', 'H9003', 'primary', 1, 5, 'בָאֵ֖שׁ', 'HRd', 'oshb_wlc');

-- 3. Update #8 «النَّارِ» to w5 noun H784 with secondary H9003
UPDATE word_mappings SET
  strongs_id = 'H784',
  orig_word_position = 5,
  orig_word = 'אֵשׁ',
  orig_surface = 'בָאֵ֖שׁ',
  orig_morphology = 'HRd/Ncbsa',
  morph_pos = 'noun',
  morph_gender = 'common',
  morph_number = 'singular',
  morph_case = 'absolute',
  morph_source = 'oshb_wlc',
  verified_locator = 'OSHB:B11.C19.V12.w5',
  relation_type = 'compound_phrase',
  grammar_notes = 'الاسم العبري אֵשׁ داخل الكلمة المتصلة בָאֵשׁ (الموضع 5)، وحرف الجر الباء قوبل بالكلمة السابقة «فِي».'
WHERE id = 'e7d90c86-5a56-4648-9c31-fb73a381a990';

DELETE FROM word_mapping_strongs WHERE mapping_id = 'e7d90c86-5a56-4648-9c31-fb73a381a990';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('e7d90c86-5a56-4648-9c31-fb73a381a990', 'H784', 'primary', 1, 5, 'בָאֵ֖שׁ', 'HRd/Ncbsa', 'oshb_wlc');
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('e7d90c86-5a56-4648-9c31-fb73a381a990', 'H9003', 'secondary', 2, 5, 'בָ', 'HRd', 'oshb_wlc');

-- 4. Update #9 «وَبَعْدَ» to w7 (וְאַחַ֣ר - HC/R - H310)
UPDATE word_mappings SET
  strongs_id = 'H310',
  orig_word_position = 7,
  orig_word = 'אַחַר',
  orig_surface = 'וְאַחַ֣ר',
  orig_morphology = 'HC/R',
  morph_pos = 'preposition',
  morph_source = 'oshb_wlc',
  verified_locator = 'OSHB:B11.C19.V12.w7',
  relation_type = 'primary'
WHERE id = '0c635355-cee0-4e5c-93d5-0fd03c79fd48';

DELETE FROM word_mapping_strongs WHERE mapping_id = '0c635355-cee0-4e5c-93d5-0fd03c79fd48';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('0c635355-cee0-4e5c-93d5-0fd03c79fd48', 'H310', 'primary', 1, 7, 'וְאַחַ֣ר', 'HC/R', 'oshb_wlc');

-- 5. Update #10 «النَّارِ» to w8 (הָאֵ֔שׁ - HTd/Ncbsa - H784)
UPDATE word_mappings SET
  strongs_id = 'H784',
  orig_word_position = 8,
  orig_word = 'אֵשׁ',
  orig_surface = 'הָאֵ֔שׁ',
  orig_morphology = 'HTd/Ncbsa',
  morph_pos = 'noun',
  morph_gender = 'common',
  morph_number = 'singular',
  morph_case = 'absolute',
  morph_source = 'oshb_wlc',
  verified_locator = 'OSHB:B11.C19.V12.w8',
  relation_type = 'primary'
WHERE id = '962ae65e-b2f8-405c-8344-ed45f7eb8830';

DELETE FROM word_mapping_strongs WHERE mapping_id = '962ae65e-b2f8-405c-8344-ed45f7eb8830';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('962ae65e-b2f8-405c-8344-ed45f7eb8830', 'H784', 'primary', 1, 8, 'הָאֵ֔שׁ', 'HTd/Ncbsa', 'oshb_wlc');

-- 6. Update #11 «صَوْتٌ» to w9 (ק֖וֹל - HNcmsc - H6963)
UPDATE word_mappings SET
  strongs_id = 'H6963',
  orig_word_position = 9,
  orig_word = 'קוֹל',
  orig_surface = 'ק֖וֹל',
  orig_morphology = 'HNcmsc',
  morph_pos = 'noun',
  morph_gender = 'masculine',
  morph_number = 'singular',
  morph_case = 'construct',
  morph_source = 'oshb_wlc',
  verified_locator = 'OSHB:B11.C19.V12.w9',
  relation_type = 'primary'
WHERE id = '95ded0e9-07bf-4ebe-bbbf-6c17013532c7';

DELETE FROM word_mapping_strongs WHERE mapping_id = '95ded0e9-07bf-4ebe-bbbf-6c17013532c7';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('95ded0e9-07bf-4ebe-bbbf-6c17013532c7', 'H6963', 'primary', 1, 9, 'ק֖וֹל', 'HNcmsc', 'oshb_wlc');

-- 7. Update #12 «مُنْخَفِضٌ» to w10 (דְּמָמָ֥ה - HNcfsa - H1827)
UPDATE word_mappings SET
  strongs_id = 'H1827',
  orig_word_position = 10,
  orig_word = 'דְּמָמָה',
  orig_surface = 'דְּמָמָ֥ה',
  orig_morphology = 'HNcfsa',
  morph_pos = 'noun',
  morph_gender = 'feminine',
  morph_number = 'singular',
  morph_case = 'absolute',
  morph_source = 'oshb_wlc',
  verified_locator = 'OSHB:B11.C19.V12.w10',
  relation_type = 'primary',
  grammar_notes = 'الأصل العبري דְּמָמָה هو اسم مؤنث بمعنى سكون أو هدوء أو همس، صِيغ في العربية كصفة («مُنْخَفِضٌ») تابعة لـ «صَوْتٌ».'
WHERE id = '9ef3cc9a-70cf-4bcf-bebd-8d7a5e8bf531';

DELETE FROM word_mapping_strongs WHERE mapping_id = '9ef3cc9a-70cf-4bcf-bebd-8d7a5e8bf531';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('9ef3cc9a-70cf-4bcf-bebd-8d7a5e8bf531', 'H1827', 'primary', 1, 10, 'דְּמָמָ֥ה', 'HNcfsa', 'oshb_wlc');

-- 8. Update #13 «خَفِيفٌ» to w11 (דַקָּֽה - HAafsa - H1851)
UPDATE word_mappings SET
  strongs_id = 'H1851',
  orig_word_position = 11,
  orig_word = 'דַּק',
  orig_surface = 'דַקָּֽה',
  orig_morphology = 'HAafsa',
  morph_pos = 'adjective',
  morph_gender = 'feminine',
  morph_number = 'singular',
  morph_case = 'absolute',
  morph_source = 'oshb_wlc',
  verified_locator = 'OSHB:B11.C19.V12.w11',
  relation_type = 'primary'
WHERE id = '2e684aaf-eebc-4acc-b707-232faee94ec3';

DELETE FROM word_mapping_strongs WHERE mapping_id = '2e684aaf-eebc-4acc-b707-232faee94ec3';
INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_word_position, orig_component, orig_morphology, morph_source)
VALUES ('2e684aaf-eebc-4acc-b707-232faee94ec3', 'H1851', 'primary', 1, 11, 'דַקָּֽה', 'HAafsa', 'oshb_wlc');

COMMIT;
`;

q(sql);
console.log('Successfully applied 1 Kings 19:12 calibration to database.');
