const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const tmpSql = path.resolve(__dirname, 'apply_v319.sql');

const mismatches = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scratch/review_v318_evidence/component_mismatches.json'), 'utf8'));

let sqlStatements = [];

sqlStatements.push('BEGIN TRANSACTION;');

// 1. Synchronize the 53 position mismatches and 1 morphology mismatch in word_mapping_strongs from word_mappings
// For primary components, word_mappings holds the codex-verified position, morphology, and Strong's ID.
// Synchronize wms to wm for all primary rows where wm is verified and has valid locator.
for (const m of mismatches) {
  // If difference is orig_word_position, update wms.orig_word_position from wm
  if (m.differences.orig_word_position) {
    const [wmPos, wmsPos] = m.differences.orig_word_position;
    sqlStatements.push(`UPDATE word_mapping_strongs SET orig_word_position = ${wmPos} WHERE mapping_id = '${m.mapping_id}' AND link_role = 'primary';`);
  }
  // If difference is orig_morphology (e.g. Dan 3:30 عبدنغو)
  if (m.differences.orig_morphology) {
    const [wmMorph, wmsMorph] = m.differences.orig_morphology;
    sqlStatements.push(`UPDATE word_mapping_strongs SET orig_morphology = '${wmMorph}' WHERE mapping_id = '${m.mapping_id}' AND link_role = 'primary';`);
  }
}

// 2. Fix the 5 sources in word_mappings that remained 'syntactic_ar' instead of 'oshb_wlc':
// - 1 Sam 19:15: ثُمَّ, عَلَى, لِكَيْ
// - Prov 15:6: وَفِي
// - Dan 3:30: فِي
sqlStatements.push(`
UPDATE word_mappings SET morph_source = 'oshb_wlc' 
WHERE verse_id LIKE '%-0009-%019015' AND ar_word IN ('ثُمَّ', 'عَلَى', 'لِكَيْ');

UPDATE word_mappings SET morph_source = 'oshb_wlc' 
WHERE verse_id LIKE '%-0020-%015006' AND ar_word = 'وَفِي';

UPDATE word_mappings SET morph_source = 'oshb_wlc' 
WHERE verse_id LIKE '%-0027-%003030' AND ar_word = 'فِي';
`);

// 3. Fix Acts 6:8 فَإِذْ and كَانَ (pos 3 and pos 4) where morph_source was morphgnt_sblgnt despite having no Greek token
sqlStatements.push(`
UPDATE word_mappings 
SET morph_source = 'syntactic_ar', orig_word_lang = NULL, verified_source = NULL
WHERE verse_id LIKE '%-0044-%006008' AND ar_word_position IN (3, 4);
`);

// 4. Dan 3:30 عبدَنغو: expand into w6 and w7 in word_mapping_strongs
// Primary: H5665, וַעֲבֵ֥ד, pos 6, AC/Np, oshb_wlc
// Secondary: H5049, נְגֹ֖ו, pos 7, ANp, oshb_wlc
const abedId = 'b841eb2c-0023-42cf-9e55-815d0ffb0755';
sqlStatements.push(`
UPDATE word_mapping_strongs 
SET orig_component = 'וַעֲבֵ֥ד', orig_word_position = 6, orig_morphology = 'AC/Np', morph_source = 'oshb_wlc'
WHERE mapping_id = '${abedId}' AND link_role = 'primary';

INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${abedId}', 'H5049', 2, 'secondary', 'נְגֹ֖ו', 7, 'ANp', 'oshb_wlc');
`);

// 5. Dan 3:30 شدرخ: update to Aramaic H7715, AR/Np
const shadrachId = '54c174af-b1da-4fd3-9088-f75240894d83';
sqlStatements.push(`
UPDATE word_mappings 
SET strongs_id = 'H7715', orig_morphology = 'AR/Np', morph_pos = 'proper_noun', morph_stem = NULL, morph_tense = NULL
WHERE id = '${shadrachId}';

UPDATE word_mapping_strongs 
SET strongs_id = 'H7715', orig_morphology = 'AR/Np', morph_source = 'oshb_wlc'
WHERE mapping_id = '${shadrachId}' AND link_role = 'primary';
`);

// 6. 1 Sam 19:15 أَقْتُلَهُ: clear verbal person/gender/number because the verb is an Infinitive Construct
const aqtulahuId = '29500450-6498-495e-bdd0-1f9289df739d';
sqlStatements.push(`
UPDATE word_mappings 
SET morph_pos = 'verb', morph_stem = 'hifil', morph_tense = 'infinitive_construct',
    morph_person = NULL, morph_gender = NULL, morph_number = NULL
WHERE id = '${aqtulahuId}';
`);

// 7. Add missing Greek clitics, pronouns, and prepositions:
// John 14:19 «يَرَانِي» -> add secondary με (G3165, pos 6, RP ----1AS-, morphgnt_sblgnt)
const yaraniId = '632f0eb7-897e-40ec-8bb1-e35b7194f483';
sqlStatements.push(`
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${yaraniId}', 'G3165', 2, 'secondary', 'με', 6, 'RP ----1AS-', 'morphgnt_sblgnt');
`);

// John 14:19 «فَتَرَوْنَنِي» -> add secondary με (G3165, pos 12, RP ----1AS-, morphgnt_sblgnt)
const fatarawnaniId = 'bfa831c2-c6dc-4732-8438-e673f847ff85';
sqlStatements.push(`
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${fatarawnaniId}', 'G3165', 2, 'secondary', 'με', 12, 'RP ----1AS-', 'morphgnt_sblgnt');
`);

// Rom 9:23 «مَجْدِهِ» -> add secondary αὐτοῦ (G846, pos 8, RP ----GSM-, morphgnt_sblgnt)
const majdihiId = '6ada1b2c-1c04-4858-8018-5a527bfaadeb';
sqlStatements.push(`
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${majdihiId}', 'G846', 2, 'secondary', 'αὐτοῦ', 8, 'RP ----GSM-', 'morphgnt_sblgnt');
`);

// Rom 9:23 «لِلْمَجْدِ» -> add secondary εἰς (G1519, pos 14, P- --------, morphgnt_sblgnt)
const lilmajdiId = '84a5e83a-1ad9-4362-be51-ddd36569a1ac';
sqlStatements.push(`
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${lilmajdiId}', 'G1519', 2, 'secondary', 'εἰς', 14, 'P- --------', 'morphgnt_sblgnt');
`);

// Rom 9:23 «وَلِكَيْ» -> add secondary καὶ (G2532, pos 1, C- --------, morphgnt_sblgnt)
const walikayId = 'ebb6202d-7af4-4cea-9904-5826836d7b8f';
sqlStatements.push(`
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${walikayId}', 'G2532', 2, 'secondary', 'καὶ', 1, 'C- --------', 'morphgnt_sblgnt');
`);

// Acts 6:8 «وَقُوَّةً،» -> add secondary καὶ (G2532, pos 5, C- --------, morphgnt_sblgnt)
const waquwwatanId = '6638e79a-9c19-4dee-8a3e-478fc53dedf4';
sqlStatements.push(`
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${waquwwatanId}', 'G2532', 2, 'secondary', 'καὶ', 5, 'C- --------', 'morphgnt_sblgnt');
`);

// Acts 6:8 «وَآيَاتٍ» -> add secondary καὶ (G2532, pos 9, C- --------, morphgnt_sblgnt)
const waayatinId = '9baae1ca-27db-4522-8703-a26084a9e52e';
sqlStatements.push(`
INSERT OR REPLACE INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
VALUES ('${waayatinId}', 'G2532', 2, 'secondary', 'καὶ', 9, 'C- --------', 'morphgnt_sblgnt');
`);

sqlStatements.push('COMMIT;');

fs.writeFileSync(tmpSql, sqlStatements.join('\n'), 'utf8');

console.log(`Executing ${sqlStatements.length} SQL steps in single transaction...`);
execSync(`"${sqlite}" "${dbPath}" < "${tmpSql}"`, { encoding: 'utf8', shell: 'cmd.exe' });
console.log('Successfully applied all v319 harmonizations!');
