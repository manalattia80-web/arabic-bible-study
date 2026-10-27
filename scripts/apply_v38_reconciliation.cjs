const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQLITE_BIN = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB_PATH = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function executeSql(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_exec.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const res = execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { maxBuffer: 50 * 1024 * 1024 });
    return res.toString('utf8').trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

console.log('========================================================================');
console.log('       APPLYING SCIENTIFIC QUALITY RECONCILIATION v38                   ');
console.log('========================================================================\n');

const sql = `
BEGIN TRANSACTION;

-- 1. Fix Jeremiah 42:5 tokens
-- Word 4: لِيَكُنِ -> H1961 הָיָה / יְהִי
UPDATE word_mappings
SET strongs_id = 'H1961',
    orig_word = 'הָיָה',
    orig_surface = 'יְהִי',
    morph_pos = 'verb',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C42.V5.w4',
    verified_source = 'Westminster Leningrad Codex (WLC 4.20) / OSHB v2.2 [Jer.42.5#ar4->orig#4 (H1961)]; Strong’s Hebrew Dictionary (1890) §H1961; Van Dyck (1865)',
    is_verified = 1
WHERE id = '545be4b9-f652-4d91-a168-0674920d23a9';

-- Word 8: صَادِقًا -> H571 אֱמֶת / אֱמֶת
UPDATE word_mappings
SET strongs_id = 'H571',
    orig_word = 'אֱמֶת',
    orig_surface = 'אֱמֶת',
    morph_pos = 'noun',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C42.V5.w8',
    verified_source = 'Westminster Leningrad Codex (WLC 4.20) / OSHB v2.2 [Jer.42.5#ar8->orig#8 (H571)]; Strong’s Hebrew Dictionary (1890) §H571; Van Dyck (1865)',
    is_verified = 1
WHERE id = '178ab063-b896-4aa6-9537-7e6803323314';

-- Word 9: وَأَمِينًا -> H539 אָמַן / וְנֶאֱמָן
UPDATE word_mappings
SET strongs_id = 'H539',
    orig_word = 'אָמַן',
    orig_surface = 'וְנֶאֱמָן',
    morph_pos = 'verb',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C42.V5.w9',
    verified_source = 'Westminster Leningrad Codex (WLC 4.20) / OSHB v2.2 [Jer.42.5#ar9->orig#9 (H539)]; Strong’s Hebrew Dictionary (1890) §H539; Van Dyck (1865)',
    is_verified = 1
WHERE id = '8b1ebc4f-e925-4af2-ac30-fc2578ea6e0e';

-- Word 14: أَمْرٍ -> H1697 דָּבָר / הַדָּבָר
UPDATE word_mappings
SET strongs_id = 'H1697',
    orig_word = 'דָּבָר',
    orig_surface = 'הַדָּבָר',
    morph_pos = 'noun',
    morph_source = 'oshb_wlc',
    verified_locator = 'OSHB:B24.C42.V5.w14',
    verified_source = 'Westminster Leningrad Codex (WLC 4.20) / OSHB v2.2 [Jer.42.5#ar14->orig#14 (H1697)]; Strong’s Hebrew Dictionary (1890) §H1697; Van Dyck (1865)',
    is_verified = 1
WHERE id = 'f992625f-1042-405f-89ef-5d191c7d1368';


-- 2. Resolve all 28 multi-primary records in word_mapping_strongs:
-- 04ba39aa: delete H3035
DELETE FROM word_mapping_strongs WHERE mapping_id = '04ba39aa-bd42-4047-a81c-59e83a08ac6d' AND strongs_id = 'H3035';

-- 0834c067: delete G5561
DELETE FROM word_mapping_strongs WHERE mapping_id = '0834c067-a07d-4594-bfd0-78fba2544606' AND strongs_id = 'G5561';

-- 0c5ff437: delete H4480
DELETE FROM word_mapping_strongs WHERE mapping_id = '0c5ff437-db21-4c20-831d-2b32bb02f297' AND strongs_id = 'H4480';

-- 0d8a128b: delete G2695
DELETE FROM word_mapping_strongs WHERE mapping_id = '0d8a128b-3b13-40dc-bc9f-826c34bcabaf' AND strongs_id = 'G2695';

-- 28a2f95c: delete H6218
DELETE FROM word_mapping_strongs WHERE mapping_id = '28a2f95c-6148-41f7-ab90-56db0737fe8d' AND strongs_id = 'H6218';

-- 3a598288: delete H8033
DELETE FROM word_mapping_strongs WHERE mapping_id = '3a598288-fe11-4297-b9a4-c52a3f1700e9' AND strongs_id = 'H8033';

-- 3f8f4de1: Matt 17:20 فَقَالَ: G2532 is conjunction, G2036 is primary
UPDATE word_mapping_strongs 
SET link_role = 'conjunction', link_order = 1 
WHERE mapping_id = '3f8f4de1-0cbe-4a24-9ffd-81baa9960ec6' AND strongs_id = 'G2532';
UPDATE word_mapping_strongs 
SET link_role = 'primary', link_order = 2 
WHERE mapping_id = '3f8f4de1-0cbe-4a24-9ffd-81baa9960ec6' AND strongs_id = 'G2036';

-- 4eca36bc: delete H400
DELETE FROM word_mapping_strongs WHERE mapping_id = '4eca36bc-3d44-450f-af46-a1fffddef122' AND strongs_id = 'H400';

-- 53943354: delete G3332
DELETE FROM word_mapping_strongs WHERE mapping_id = '53943354-3fa7-40ef-8ca6-c0ca4bc3cc6a' AND strongs_id = 'G3332';

-- 53967738: delete H4480
DELETE FROM word_mapping_strongs WHERE mapping_id = '53967738-9d10-4fbb-8026-459c820c6a56' AND strongs_id = 'H4480';

-- 5464daf5: Luke 5:22 وَقَالَ: G1161 is conjunction, G3004 is primary
UPDATE word_mapping_strongs 
SET link_role = 'conjunction', link_order = 1 
WHERE mapping_id = '5464daf5-aa88-4971-9b05-844966c3771a' AND strongs_id = 'G1161';
UPDATE word_mapping_strongs 
SET link_role = 'primary', link_order = 2 
WHERE mapping_id = '5464daf5-aa88-4971-9b05-844966c3771a' AND strongs_id = 'G3004';

-- 5a7a6dff: delete G3844
DELETE FROM word_mapping_strongs WHERE mapping_id = '5a7a6dff-1361-4443-8f86-d9af03dc106f' AND strongs_id = 'G3844';

-- 7bea1ee2: delete G2192
DELETE FROM word_mapping_strongs WHERE mapping_id = '7bea1ee2-0540-4161-b965-2fe433386d06' AND strongs_id = 'G2192';

-- 84a661cf: delete G2064
DELETE FROM word_mapping_strongs WHERE mapping_id = '84a661cf-8d70-43fb-91dd-6913d31f9d09' AND strongs_id = 'G2064';

-- 84f72543: delete H1508 and H4589
DELETE FROM word_mapping_strongs WHERE mapping_id = '84f72543-97dc-4cd5-b416-f04cd318b942' AND strongs_id IN ('H1508', 'H4589');

-- 88c289b2: delete G3650
DELETE FROM word_mapping_strongs WHERE mapping_id = '88c289b2-7282-4f1b-980f-317a96e1cc45' AND strongs_id = 'G3650';

-- 8b1ebc4f: delete H522
DELETE FROM word_mapping_strongs WHERE mapping_id = '8b1ebc4f-e925-4af2-ac30-fc2578ea6e0e' AND strongs_id = 'H522';

-- 8fc7c281: Matt 17:20 لِهذَا: G1223 is preposition, G3778 is primary
UPDATE word_mapping_strongs 
SET link_role = 'preposition', link_order = 1 
WHERE mapping_id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee' AND strongs_id = 'G1223';
UPDATE word_mapping_strongs 
SET link_role = 'primary', link_order = 2 
WHERE mapping_id = '8fc7c281-0e8b-4958-9f0b-8efac2b51cee' AND strongs_id = 'G3778';

-- 90b412b7: delete G3588
DELETE FROM word_mapping_strongs WHERE mapping_id = '90b412b7-89ce-4ffb-9b23-b3dde92ccd9c' AND strongs_id = 'G3588';

-- 976fe8ef: delete H3390
DELETE FROM word_mapping_strongs WHERE mapping_id = '976fe8ef-8f26-4164-b0ad-699a1bd18e09' AND strongs_id = 'H3390';

-- 9885c0ec: delete H3117
DELETE FROM word_mapping_strongs WHERE mapping_id = '9885c0ec-83f5-4abd-ab4a-d550c16faa6b' AND strongs_id = 'H3117';

-- bf1aa824: delete H1934
DELETE FROM word_mapping_strongs WHERE mapping_id = 'bf1aa824-0796-4720-9aec-037693e447af' AND strongs_id = 'H1934';

-- cfbb2177: delete H834
DELETE FROM word_mapping_strongs WHERE mapping_id = 'cfbb2177-b8d8-444f-9d2f-b0fee6ba0cdd' AND strongs_id = 'H834';

-- e0745fd4: delete H5921
DELETE FROM word_mapping_strongs WHERE mapping_id = 'e0745fd4-5fe2-45e0-a5d7-c61976beeaf7' AND strongs_id = 'H5921';

-- e0b6e951: delete H90
DELETE FROM word_mapping_strongs WHERE mapping_id = 'e0b6e951-8745-4f5c-b61e-c9f0a38b5ee7' AND strongs_id = 'H90';

-- e70ea6a2: delete H3588
DELETE FROM word_mapping_strongs WHERE mapping_id = 'e70ea6a2-8380-468c-883e-7c8b2f3cfe73' AND strongs_id = 'H3588';

-- ebca0530: delete G3844
DELETE FROM word_mapping_strongs WHERE mapping_id = 'ebca0530-54c9-4506-a999-06540a327435' AND strongs_id = 'G3844';

-- f992625f: delete H559
DELETE FROM word_mapping_strongs WHERE mapping_id = 'f992625f-1042-405f-89ef-5d191c7d1368' AND strongs_id = 'H559';


-- 3. Ensure primary synchronisation: Every record with strongs_id must have its primary in word_mapping_strongs
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_role, link_order, orig_component)
SELECT id, strongs_id, 'primary', 1, orig_word
FROM word_mappings
WHERE strongs_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM word_mapping_strongs 
    WHERE mapping_id = word_mappings.id AND strongs_id = word_mappings.strongs_id
  );

-- Update primary components
UPDATE word_mapping_strongs
SET orig_component = (SELECT orig_surface FROM word_mappings WHERE word_mappings.id = word_mapping_strongs.mapping_id)
WHERE link_role = 'primary' AND (orig_component IS NULL OR orig_component = '');

COMMIT;
`;

console.log('Executing database reconciliation...');
executeSql(sql);
console.log('Database reconciliation committed successfully!\n');

// Verification
const multiPrimary = executeSql("SELECT count(*) FROM (SELECT mapping_id FROM word_mapping_strongs WHERE link_role='primary' GROUP BY 1 HAVING count(*)>1);");
const conflictPrimary = executeSql("SELECT count(*) FROM word_mappings w JOIN word_mapping_strongs x ON w.id=x.mapping_id WHERE x.link_role='primary' AND w.strongs_id != x.strongs_id;");
const primaryMissing = executeSql("SELECT count(*) FROM word_mappings w WHERE w.strongs_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM word_mapping_strongs x WHERE x.mapping_id=w.id AND x.strongs_id=w.strongs_id);");

console.log('Verification:');
console.log(`  Multiple primary components: ${multiPrimary} (Target: 0)`);
console.log(`  Conflict primary strongs: ${conflictPrimary} (Target: 0)`);
console.log(`  Primary missing from multi: ${primaryMissing} (Target: 0)`);

const integrity = executeSql('PRAGMA integrity_check;');
console.log(`  Database integrity check: ${integrity}`);
