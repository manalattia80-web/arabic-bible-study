const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const sourceDb = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const testDb = path.resolve(__dirname, 'test_negative_scratch.db');
const auditScript = path.resolve(__dirname, 'automated_database_audit.cjs');

console.log('========================================================================');
console.log('   RIGOROUS NEGATIVE QUALITY GATE SUITE (FRESH-COPY PER TEST)           ');
console.log('========================================================================\n');

function cleanScratchDb() {
  if (fs.existsSync(testDb)) {
    try { fs.unlinkSync(testDb); } catch (_) {}
  }
}

function createFreshScratchDb() {
  cleanScratchDb();
  fs.copyFileSync(sourceDb, testDb);
}

function execSqlOnScratch(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_neg_inject.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    execSync(`"${sqlitePath}" "${testDb}" < "${tmpFile}"`);
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

function runAuditOnScratch() {
  const nodeBin = process.execPath;
  try {
    const output = execSync(`"${nodeBin}" "${auditScript}"`, {
      env: { ...process.env, AUDIT_DB_PATH: testDb },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { passed: true, output };
  } catch (err) {
    return { passed: false, output: (err.stdout || '') + '\n' + (err.stderr || '') };
  }
}

// Baseline check: Production DB must pass 100%
console.log('▶ Verifying clean baseline on production DB copy...');
createFreshScratchDb();
const baseline = runAuditOnScratch();
cleanScratchDb();
if (!baseline.passed) {
  console.error('✗ Baseline audit FAILED. Production DB must pass before running negative tests.');
  console.error(baseline.output);
  process.exit(1);
}
console.log('  ✓ Baseline audit passed with 0 failures.\n');

const testCases = [
  {
    gateNum: 1,
    name: 'syntactic_with_strongs',
    expectedFailTag: '[FAIL] syntactic_with_strongs:',
    description: 'Injected syntactic_ar with Strong\'s ID',
    mutationSql: `
      UPDATE word_mappings 
      SET morph_pos = 'syntactic_ar', strongs_id = 'H9999' 
      WHERE id = (SELECT id FROM word_mappings WHERE strongs_id IS NOT NULL LIMIT 1);
    `
  },
  {
    gateNum: 2,
    name: 'no_null_position_with_codex_locator',
    expectedFailTag: '[FAIL] no_null_position_with_codex_locator:',
    description: 'Injected Codex locator with NULL orig_word_position',
    mutationSql: `
      UPDATE word_mappings 
      SET orig_word_position = NULL 
      WHERE verified_locator LIKE 'OSHB:%' 
        AND id = (SELECT id FROM word_mappings WHERE verified_locator LIKE 'OSHB:%' AND orig_word_position IS NOT NULL LIMIT 1);
    `
  },
  {
    gateNum: 3,
    name: 'range_component_positions_bounded',
    expectedFailTag: '[FAIL] range_component_positions_bounded:',
    description: 'Injected Range locator with out-of-bounds component position',
    mutationSql: `
      INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
      VALUES (
        (SELECT id FROM word_mappings WHERE verified_locator LIKE '%.w%-%' LIMIT 1),
        'H9999',
        99,
        'secondary',
        'out_of_bounds',
        999,
        'HR',
        'oshb_wlc'
      );
    `
  },
  {
    gateNum: 4,
    name: 'cross_testament_strongs',
    expectedFailTag: '[FAIL] cross_testament_strongs:',
    description: 'Injected Cross-Testament Strong\'s contamination (Greek Strong\'s in OT)',
    mutationSql: `
      UPDATE word_mappings 
      SET strongs_id = 'G9999' 
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 1)
        AND id = (SELECT id FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 1) LIMIT 1);
    `
  },
  {
    gateNum: 5,
    name: 'duplicate_ar_position',
    expectedFailTag: '[FAIL] duplicate_ar_position:',
    description: 'Injected Duplicate Arabic position in verse',
    mutationSql: `
      INSERT INTO word_mappings (id, verse_id, ar_word_position, ar_word, strongs_id)
      VALUES (
        'bad_dup_pos_test',
        (SELECT id FROM verses LIMIT 1),
        1,
        'مكرر',
        'H9003'
      );
    `
  },
  {
    gateNum: 6,
    name: 'source_locator_index_mismatch',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w9 (تعرجون)',
    description: 'Injected incorrect source locator index (OSHB:B11.C18.V21.w9 instead of w10)',
    mutationSql: `
      UPDATE word_mappings 
      SET verified_locator = 'OSHB:B11.C18.V21.w9' 
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 18 AND verse_num = 21) 
        AND ar_word_position = 9;
    `
  },
  {
    gateNum: 7,
    name: 'incorrect_lexical_strongs_with_correct_loc_and_morph',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w7 (حتى)',
    description: 'Injected incorrect Strong\'s ID (H9999 instead of H5704) with authentic locator and morphology',
    mutationSql: `
      UPDATE word_mappings 
      SET strongs_id = 'H9999' 
      WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 18 AND verse_num = 21) 
        AND ar_word_position = 7;

      UPDATE word_mapping_strongs
      SET strongs_id = 'H9999'
      WHERE mapping_id = (
        SELECT id FROM word_mappings 
        WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 11 AND chapter_num = 18 AND verse_num = 21) 
          AND ar_word_position = 7
      );
    `
  },
  {
    gateNum: 8,
    name: 'isa_40_8_noun_with_preposition_strongs',
    expectedFailTag: '[FAIL] Isaiah 40:8 w10 (الأَبَدِ) Lexical Isolation',
    description: 'Injected preposition Strong ID H9005 into noun الأَبَدِ in Isaiah 40:8',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H9005'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 40 AND verse_num = 8 AND book_id = 23)
        AND ar_word_position = 10;
    `
  },
  {
    gateNum: 9,
    name: 'gal_5_22_joy_with_love_strongs',
    expectedFailTag: '[FAIL] Galatians 5:22 w6 (فَرَحٌ) Greek Lexical Joy Isolation',
    description: 'Injected love Strong ID G26 into joy فَرَحٌ in Galatians 5:22',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'G26'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 22 AND book_id = 48)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 10,
    name: 'mic_6_8_missing_pronominal_dative_component',
    expectedFailTag: '[FAIL] Micah 6:8 w2 (أَخْبَرَكَ) Multi-Component Completeness',
    description: 'Deleted kaf al-mukhatab pronominal dative component (H9005) from أَخْبَرَكَ in Micah 6:8',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (
        SELECT id FROM word_mappings
        WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 8 AND book_id = 33)
          AND ar_word_position = 2
      ) AND link_role = 'pronominal_dative';
    `
  },
  {
    gateNum: 11,
    name: 'mic_6_8_mutated_component_position',
    expectedFailTag: '[FAIL] Micah 6:8 w2 (أَخْبَرَكَ) Multi-Component Completeness',
    description: 'Mutated Micah 6:8 לְךָ component orig_word_position from 2 to 1 in test DB',
    mutationSql: `
      UPDATE word_mapping_strongs
      SET orig_word_position = 1
      WHERE mapping_id = (
        SELECT id FROM word_mappings
        WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 8 AND book_id = 33)
          AND ar_word_position = 2
      ) AND link_role = 'pronominal_dative';
    `
  },
  {
    gateNum: 12,
    name: 'ezra_5_8_locator_out_of_bounds_or_mismatched',
    expectedFailTag: '[FAIL] Ezra 5:8 w16 (يُبْنَى) Source Locator & Root Purity',
    description: 'Mutated Ezra 5:8 w16 (يُبْنَى) locator back to w16 (מִתְּשָׂ֣ם) instead of w12 (מִתְבְּנֵא֙)',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 16, verified_locator = 'OSHB:B15.C5.V8.w16'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 8 AND book_id = 15)
        AND ar_word_position = 16;
    `
  },
  {
    gateNum: 13,
    name: 'deut_6_5_rab_locator_reverted_to_w2',
    expectedFailTag: '[FAIL] Deuteronomy 6:5 w2 (الرَّبَّ) Locator & Lexical Purity',
    description: 'Reverted Deuteronomy 6:5 w2 (الرَّبَّ) locator from w3 back to w2',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 2, verified_locator = 'OSHB:B5.C6.V5.w2'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 5 AND book_id = 5)
        AND ar_word_position = 2;
    `
  },
  {
    gateNum: 14,
    name: 'exod_15_2_rab_locator_reverted_to_w1',
    expectedFailTag: '[FAIL] Exodus 15:2 w1 (الرَّبُّ) Locator & Lexical Purity',
    description: 'Reverted Exodus 15:2 w1 (الرَّبُّ) locator from w3 back to w1',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 1, verified_locator = 'OSHB:B2.C15.V2.w1'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 2 AND book_id = 2)
        AND ar_word_position = 1;
    `
  },
  {
    gateNum: 15,
    name: 'deut_6_5_min_strongs_reverted_to_h4480',
    expectedFailTag: '[FAIL] Deuteronomy 6:5 w4 (مِنْ) Preposition Beth Component',
    description: 'Reverted Deuteronomy 6:5 w4 (مِنْ) Strong\'s from H9003 back to H4480',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H4480'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 6 AND verse_num = 5 AND book_id = 5)
        AND ar_word_position = 4;
    `
  },
  {
    gateNum: 16,
    name: 'exod_15_2_nashid_strongs_reverted_to_h2172',
    expectedFailTag: '[FAIL] Exodus 15:2 w3 (وَنَشِيدِي) Strongs Purity',
    description: 'Reverted Exodus 15:2 w3 (وَنَشِيدِي) Strong\'s from H2176 back to H2172',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H2172'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 2 AND book_id = 2)
        AND ar_word_position = 3;
    `
  },
  {
    gateNum: 17,
    name: 'exod_15_2_nashid_morphology_reverted_to_hcncfsc',
    expectedFailTag: '[FAIL] Exodus 15:2 w3 (وَنَشِيدِي) Morphology Purity',
    description: 'Reverted Exodus 15:2 w3 (وَنَشِيدِي) morphology from HC/Ncfsa back to HC/Ncfsc',
    mutationSql: `
      UPDATE word_mappings
      SET orig_morphology = 'HC/Ncfsc'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 2 AND book_id = 2)
        AND ar_word_position = 3;
    `
  },
  {
    gateNum: 18,
    name: 'exod_15_2_nashid_orig_word_reverted_to_zimrah',
    expectedFailTag: '[FAIL] Exodus 15:2 w3 (وَنَشِيدِي) Lexical Lemma Purity',
    description: 'Reverted Exodus 15:2 w3 (وَنَشِيدِي) orig_word from זִמְרָת back to זִמְרָה',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word = 'זִמְרָה'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 2 AND book_id = 2)
        AND ar_word_position = 3;
    `
  },
  {
    gateNum: 19,
    name: 'josh_1_9_rab_locator_reverted_to_w10',
    expectedFailTag: '[FAIL] Joshua 1:9 w10 (الرَّبَّ) Locator & Lexical Purity',
    description: 'Reverted Joshua 1:9 w10 (الرَّبَّ) locator from w11 back to w10',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 10, verified_locator = 'OSHB:B6.C1.V9.w10'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 9 AND book_id = 6)
        AND ar_word_position = 10;
    `
  },
  {
    gateNum: 20,
    name: 'josh_1_9_haythuma_missing_secondary_component',
    expectedFailTag: '[FAIL] Joshua 1:9 w13 (حَيْثُمَا) Multi-Component Completeness',
    description: 'Deleted secondary component w13 בְּכֹ֖ל from حَيْثُمَا in Joshua 1:9',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (
        SELECT id FROM word_mappings
        WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 9 AND book_id = 6)
          AND ar_word_position = 13
      ) AND link_role = 'secondary';
    `
  },
  {
    gateNum: 21,
    name: 'josh_1_9_eloheika_cantillation_reverted_to_etnachta',
    expectedFailTag: '[FAIL] Joshua 1:9 w11 (إِلهَكَ) Direct OSHB Source Surface & Cantillation Purity',
    description: 'Reverted Joshua 1:9 w11 (إِلهَكَ) from אֱלֹהֶ֔יךָ (zaqef qaton) to אֱלֹהֶ֑יךָ (etnachta)',
    mutationSql: `
      UPDATE word_mappings
      SET orig_surface = 'אֱלֹהֶ֑יךָ'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 9 AND book_id = 6)
        AND ar_word_position = 11;
    `
  },
  {
    gateNum: 22,
    name: 'rom_8_28_maan_g4862_reinjected',
    expectedFailTag: '[FAIL] Romans 8:28 w7 (مَعًا) Strongs & Unitary Translation Purity (G4903, NOT G4862)',
    description: 'Re-injected G4862 into Romans 8:28 pos 7 (مَعًا) as independent preposition',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'G4862'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 8 AND verse_num = 28 AND book_id = 45)
        AND ar_word_position = 7;
    `
  },
  {
    gateNum: 23,
    name: 'luke_15_20_kana_linked_to_g1161',
    expectedFailTag: '[FAIL] Luke 15:20 w6 (كَانَ) Syntactic Copula Purity (NULL strongs, NOT G1161)',
    description: 'Linked Luke 15:20 pos 6 (كَانَ) falsely to Greek conjunction G1161 (δὲ)',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'G1161', orig_word = 'δέ', verified_locator = 'SBLGNT:B42.C15.V20.w9', relation_type = 'direct'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 20 AND book_id = 42)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 24,
    name: '1thess_5_23_enda_locator_reverted_to_w13',
    expectedFailTag: '[FAIL] 1 Thessalonians 5:23 w13 (عِنْدَ) Preposition Locator Purity (w22, NOT w13)',
    description: 'Reverted 1 Thessalonians 5:23 pos 13 (عِنْدَ) locator from w22 back to w13',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 13, verified_locator = 'SBLGNT:B52.C5.V23.w13'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 23 AND book_id = 52)
        AND ar_word_position = 13;
    `
  },
  {
    gateNum: 25,
    name: 'phil_4_6_maa_locator_reverted_to_w10',
    expectedFailTag: '[FAIL] Philippians 4:6 w10 (مَعَ) Surface & Locator Purity',
    description: 'Reverted Philippians 4:6 pos 10 (مَعَ) locator from w11 back to w10',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 10, verified_locator = 'SBLGNT:B50.C4.V6.w10'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 50)
        AND ar_word_position = 10;
    `
  },
  {
    gateNum: 26,
    name: 'phil_4_6_bishay_locator_reverted_to_w3',
    expectedFailTag: '[FAIL] Philippians 4:6 w3 (بِشَيْءٍ) Locator Purity',
    description: 'Reverted Philippians 4:6 pos 3 (بِشَيْءٍ) locator from w1 back to w3',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 3, verified_locator = 'SBLGNT:B50.C4.V6.w3'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 50)
        AND ar_word_position = 3;
    `
  },
  {
    gateNum: 27,
    name: 'luke_15_20_kana_source_badge_reverted_to_morphgnt',
    expectedFailTag: '[FAIL] Luke 15:20 w6 (كَانَ) Source Badge Purity',
    description: 'Reverted Luke 15:20 pos 6 (كَانَ) source badge to morphgnt_sblgnt',
    mutationSql: `
      UPDATE word_mappings
      SET verified_source = 'morphgnt_sblgnt', morph_source = 'morphgnt_sblgnt'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 20 AND book_id = 42)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 28,
    name: 'luke_15_20_baeda_g568_deleted',
    expectedFailTag: '[FAIL] Luke 15:20 w9 (بَعِيدًا) Multi-Component Completeness',
    description: 'Deleted secondary component G568 (ἀπέχοντος) from Luke 15:20 pos 9 (بَعِيدًا)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 15 AND verse_num = 20 AND book_id = 42) AND ar_word_position = 9)
        AND strongs_id = 'G568';
    `
  },
  {
    gateNum: 29,
    name: 'phil_4_6_maa_surface_reverted_to_meta',
    expectedFailTag: '[FAIL] Philippians 4:6 w10 (مَعَ) Surface & Locator Purity',
    description: 'Reverted Philippians 4:6 pos 10 (مَعَ) surface from μετ’ back to μετά',
    mutationSql: `
      UPDATE word_mappings
      SET orig_surface = 'μετά'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 50)
        AND ar_word_position = 10;
    `
  },
  {
    gateNum: 30,
    name: 'ruth_1_16_alayya_reverted_to_h413',
    expectedFailTag: '[FAIL] Ruth 1:16 w5 (عَلَيَّ) Locator & Lexical Purity',
    description: 'Reverted Ruth 1:16 pos 5 (عَلَيَّ) Strong ID from H9003 back to H413',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H413', orig_word = 'אֵל', orig_surface = 'אֶל', orig_morphology = 'HR'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 16 AND book_id = 8)
        AND ar_word_position = 5;
    `
  },
  {
    gateNum: 31,
    name: 'ruth_1_16_an_loss_of_lam_h9005',
    expectedFailTag: '[FAIL] Ruth 1:16 w6 (أَنْ) Prefix Lam Purity',
    description: 'Loss of prefix Lam (H9005) from Ruth 1:16 pos 6 (أَنْ), reverted to conjunction H3588',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H3588', orig_word = 'כִּי', orig_surface = 'כִּ֠י', orig_morphology = 'HC'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 16 AND book_id = 8)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 32,
    name: 'ruth_1_16_atrukaki_loss_of_suffix_sp2fs',
    expectedFailTag: '[FAIL] Ruth 1:16 w7 (أَتْرُكَكِ) Suffix & Verb Purity',
    description: 'Dropped feminine 2nd person pronominal suffix Sp2fs from Ruth 1:16 pos 7 (أَتْرُكَكِ)',
    mutationSql: `
      UPDATE word_mappings
      SET orig_morphology = 'HR/Vqc', morph_gender = NULL, morph_person = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 16 AND book_id = 8)
        AND ar_word_position = 7;
    `
  },
  {
    gateNum: 33,
    name: 'ruth_1_16_anki_prefix_deleted',
    expectedFailTag: '[FAIL] Ruth 1:16 w9 (عَنْكِ) Multi-Component Completeness',
    description: 'Deleted prefix component H4480 from Ruth 1:16 pos 9 (عَنْكِ)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 16 AND book_id = 8) AND ar_word_position = 9)
        AND strongs_id = 'H4480';
    `
  },
  {
    gateNum: 34,
    name: 'ruth_1_16_ashuv_arabic_waw_injected',
    expectedFailTag: '[FAIL] Ruth 1:16 w8 (وَأَرْجِعَ) Component & Pure Hebrew Vav U+05D5',
    description: 'Injected Arabic Waw U+0648 into Ruth 1:16 pos 8 (وَأَرْجِعَ) component',
    mutationSql: `
      UPDATE word_mapping_strongs
      SET orig_component = '\u05DC\u05B8\u05E9\u05C1\u05A3\u0648\u05BC\u05D1'
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 1 AND verse_num = 16 AND book_id = 8) AND ar_word_position = 8)
        AND strongs_id = 'H7725';
    `
  },
  {
    gateNum: 35,
    name: '1kgs_18_21_huwa_reverted_to_h1931',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w15 (هُوَ) Syntactic Copula Purity',
    description: 'Reverted 1 Kings 18:21 pos 15 (هُوَ) from syntactic copula back to H1931',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H1931', orig_word = 'הוּא', orig_surface = 'הוּא', orig_word_position = 11, verified_locator = 'OSHB:B11.C18.V21.w11', morph_pos = 'personal_pronoun', morph_source = 'oshb_wlc', verified_source = 'oshb_wlc'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 18 AND verse_num = 21 AND book_id = 11)
        AND ar_word_position = 15;
    `
  },
  {
    gateNum: 36,
    name: '1kgs_18_21_firqatayn_secondary_deleted',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w11 (الْفِرْقَتَيْنِ) Multi-Component Completeness',
    description: 'Deleted numeral component H8147 from 1 Kings 18:21 pos 11 (الْفِرْقَتَيْنِ)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 18 AND verse_num = 21 AND book_id = 11) AND ar_word_position = 11)
        AND strongs_id = 'H8147';
    `
  },
  {
    gateNum: 37,
    name: '1kgs_18_21_taaruj_secondary_deleted',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w9 (تَعْرُجُونَ) Multi-Component Completeness',
    description: 'Deleted pronominal component H859 from 1 Kings 18:21 pos 9 (تَعْرُجُونَ)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 18 AND verse_num = 21 AND book_id = 11) AND ar_word_position = 9)
        AND strongs_id = 'H859';
    `
  },
  {
    gateNum: 38,
    name: '1kgs_18_21_itba_w17_misattributed_position',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w17 (فَاتَّبِعُوهُ) Multi-Component Position & Morphology Isolation',
    description: 'Misattributed H310 component to w17 instead of w18 in 1 Kings 18:21 pos 17 (فَاتَّبِعُوهُ)',
    mutationSql: `
      UPDATE word_mapping_strongs
      SET orig_word_position = 17, orig_morphology = 'HVqv2mp'
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 18 AND verse_num = 21 AND book_id = 11) AND ar_word_position = 17)
        AND strongs_id = 'H310';
    `
  },
  {
    gateNum: 39,
    name: '1kgs_18_21_yujibhu_secondary_deleted',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w23 (يُجِبْهُ) Multi-Component Completeness',
    description: 'Deleted object pronoun component H853 from 1 Kings 18:21 pos 23 (يُجِبْهُ)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 18 AND verse_num = 21 AND book_id = 11) AND ar_word_position = 23)
        AND strongs_id = 'H853';
    `
  },
  {
    gateNum: 40,
    name: '1kings_18_21_firqatayn_reverted_to_dual_feminine',
    expectedFailTag: '[FAIL] 1 Kings 18:21 w11 (الْفِرْقَتَيْنِ) Primary Morphology Plural Masculine',
    description: 'Reverted 1 Kings 18:21 pos 11 (الْفِرْقَتَيْنِ) morph_gender/morph_number back to feminine dual',
    mutationSql: `
      UPDATE word_mappings
      SET morph_gender = 'feminine', morph_number = 'dual'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 18 AND verse_num = 21 AND book_id = 11)
        AND ar_word_position = 11;
    `
  },
  {
    gateNum: 41,
    name: 'zech_4_6_wakallamani_w3_deleted',
    expectedFailTag: '[FAIL] Zechariah 4:6 Full-Verse Canonical Loci',
    description: 'Deleted secondary component w3 (H413 אֵלַי֙) from Zechariah 4:6 pos 2 (وَكَلَّمَنِي)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 38) AND ar_word_position = 2)
        AND strongs_id = 'H413';
    `
  },
  {
    gateNum: 42,
    name: 'zech_4_6_bal_w16_deleted',
    expectedFailTag: '[FAIL] Zechariah 4:6 Full-Verse Canonical Loci',
    description: 'Deleted secondary component w16 (H518 אִם) from Zechariah 4:6 pos 14 (بَلْ)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 38) AND ar_word_position = 14)
        AND strongs_id = 'H518';
    `
  },
  {
    gateNum: 43,
    name: 'zech_4_6_ila_reverted_to_hr_sp1cs',
    expectedFailTag: '[FAIL] Zechariah 4:6 w7 (إِلَى) Exact Preposition Form',
    description: 'Reverted Zechariah 4:6 pos 7 (إِلَى) to אֵל / HR/Sp1cs at w7',
    mutationSql: `
      UPDATE word_mappings
      SET orig_surface = 'אֵל', orig_morphology = 'HR/Sp1cs', orig_word_position = 7, verified_locator = 'OSHB:B38.C4.V6.w7'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 38)
        AND ar_word_position = 7;
    `
  },
  {
    gateNum: 44,
    name: 'zech_4_6_kalimah_stale_h562_note',
    expectedFailTag: '[FAIL] Zechariah 4:6 w5 (كَلِمَةُ) Clean Notes (no H562) & Construct Case',
    description: 'Restored stale H562 note on Zechariah 4:6 pos 5 (كَلِمَةُ)',
    mutationSql: `
      UPDATE word_mappings
      SET grammar_notes = 'الربط الحالي بـ H562 غير دقيق'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 38)
        AND ar_word_position = 5;
    `
  },
  {
    gateNum: 45,
    name: 'zech_4_6_biruhi_missing_construct',
    expectedFailTag: '[FAIL] Zechariah 4:6 w15 (بِرُوحِي) Construct Case',
    description: 'Cleared morph_case construct from Zechariah 4:6 pos 15 (بِرُوحِي)',
    mutationSql: `
      UPDATE word_mappings
      SET morph_case = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 6 AND book_id = 38)
        AND ar_word_position = 15;
    `
  },
  {
    gateNum: 46,
    name: 'ezra_5_8_maluman_reverted_to_peal_active',
    expectedFailTag: '[FAIL] Ezra 5:8 w2 (مَعْلُومًا) Peil Passive Participle',
    description: 'Reverted Ezra 5:8 pos 2 (مَعْلُومًا) morph_stem/voice back to peal active',
    mutationSql: `
      UPDATE word_mappings
      SET morph_stem = 'peal', morph_voice = 'active'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 8 AND book_id = 15)
        AND ar_word_position = 2;
    `
  },
  {
    gateNum: 47,
    name: 'ezra_5_8_lamed_h9005_polluted_with_h4430',
    expectedFailTag: '[FAIL] Ezra 5:8 Lamed Preposition H9005 AR vs Noun Isolation',
    description: 'Replaced Ezra 5:8 pos 3 (لَدَى H9005) with attached noun Strongs H4430',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H4430'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 8 AND book_id = 15)
        AND ar_word_position = 3;
    `
  },
  {
    gateNum: 48,
    name: 'ezra_5_8_dhahabna_reverted_to_h235',
    expectedFailTag: '[FAIL] Ezra 5:8 arPos 6 (ذَهَبْنَا H236 w5)',
    description: 'Reverted Ezra 5:8 pos 6 (ذَهَبْنَا) back to erroneous Strongs H235',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H235'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 8 AND book_id = 15)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 49,
    name: 'ezra_5_8_bihijarah_missing_construct',
    expectedFailTag: '[FAIL] Ezra 5:8 arPos 17 (بِحِجَارَةٍ H69 ANcfsc construct)',
    description: 'Cleared morph_case construct from Ezra 5:8 pos 17 (بِحِجَارَةٍ)',
    mutationSql: `
      UPDATE word_mappings
      SET morph_case = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 8 AND book_id = 15)
        AND ar_word_position = 17;
    `
  },
  {
    gateNum: 50,
    name: 'ezra_5_8_stale_h1506_note_restored',
    expectedFailTag: '[FAIL] Ezra 5:8 Clean Grammar Notes (no stale IDs)',
    description: 'Restored stale H1506 error note on Ezra 5:8 pos 17 (بِحِجَارَةٍ)',
    mutationSql: `
      UPDATE word_mappings
      SET grammar_notes = 'الربط السابق بـ H1506 خاطئ'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 5 AND verse_num = 8 AND book_id = 15)
        AND ar_word_position = 17;
    `
  },
  {
    gateNum: 51,
    name: 'mark_10_45_yati_person_corrupted_to_first',
    expectedFailTag: '[FAIL] 20-Verse Benchmark Canonical Manifest Quality Gate',
    description: 'Corrupted Mark 10:45 pos 6 (يَأْتِ) morph_person from 3rd to 1st person (first)',
    mutationSql: `
      UPDATE word_mappings
      SET morph_person = 'first'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 10 AND verse_num = 45 AND book_id = 41)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 52,
    name: 'dan_4_17_likay_w9_di_deleted',
    expectedFailTag: '[FAIL] Daniel 4:17 pos 8 (لِكَىْ) Multi-Component Integrity',
    description: 'Deleted secondary component H1768@w9 from Daniel 4:17 pos 8 (لِكَىْ)',
    mutationSql: `
      DELETE FROM word_mapping_strongs
      WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 17 AND book_id = 27) AND ar_word_position = 8)
        AND strongs_id = 'H1768';
    `
  },
  {
    gateNum: 53,
    name: 'dan_4_17_qere_pos16_reverted_to_w16',
    expectedFailTag: '[FAIL] Daniel 4:17 Qere Loci',
    description: 'Reverted Daniel 4:17 pos 16 (النَّاسِ) from Qere w18 back to corrupted w16',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 16, verified_locator = 'OSHB:B27.C4.V14.w16'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 17 AND book_id = 27)
        AND ar_word_position = 16;
    `
  },
  {
    gateNum: 54,
    name: 'dan_4_17_give_reverted_to_h3052_w20',
    expectedFailTag: '[FAIL] Daniel 4:17 Tail Repairs',
    description: 'Reverted Daniel 4:17 pos 17 (فَيُعْطِيهَا) from H5415@w22 back to H3052@w20',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H3052', orig_word_position = 20, verified_locator = 'OSHB:B27.C4.V14.w20'
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 17 AND book_id = 27)
        AND ar_word_position = 17;
    `
  },
  {
    gateNum: 55,
    name: 'dan_4_17_yasha_discrepancy_note_cleared',
    expectedFailTag: '[FAIL] Daniel 4:17 pos 19 (يَشَاءُ H6634 w21)',
    description: 'Cleared OSHB AVqp3ms vs BDB Yiqtol discrepancy note on Daniel 4:17 pos 19 (يَشَاءُ)',
    mutationSql: `
      UPDATE word_mappings
      SET grammar_notes = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 17 AND book_id = 27)
        AND ar_word_position = 19;
    `
  },
  {
    gateNum: 56,
    name: 'dan_4_17_construct_cleared_or_stale_note',
    expectedFailTag: '[FAIL] Daniel 4:17 Construct States (pos 3,6,8,15,22) & Clean Notes',
    description: 'Cleared morph_case construct on Daniel 4:17 pos 15 (مَمْلَكَةِ)',
    mutationSql: `
      UPDATE word_mappings
      SET morph_case = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE chapter_num = 4 AND verse_num = 17 AND book_id = 27)
        AND ar_word_position = 15;
    `
  },
  {
    gateNum: 57,
    name: 'mark_12_30_repeated_clause_reverted_to_w7',
    expectedFailTag: '[FAIL] 1Thess 5:16 & Mark 12:30 Repeated-Clause Context Anti-Collision Non-Regression',
    description: 'Reverted Mark 12:30 pos 7 (وَمِنْ) from Clause 2 w13 back to Clause 1 w7 (identical word & morph)',
    mutationSql: `
      UPDATE word_mappings
      SET orig_word_position = 7, verified_locator = 'SBLGNT:B41.C12.V30.w7'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 41 AND chapter_num = 12 AND verse_num = 30)
        AND ar_word_position = 7;
    `
  },
  {
    gateNum: 58,
    name: 'mark_12_30_tr_robinson_morph_case_mutated',
    expectedFailTag: '[FAIL] Scrivener TR Robinson Morphology Literal + All Derived Fields (Mark 12:30 pos 16,18,19)',
    description: 'Mutated Mark 12:30 TR pos 16 (D-NSF) morph_case to accusative while keeping Strongs/surface/locator valid',
    mutationSql: `
      UPDATE word_mappings
      SET morph_case = 'accusative'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 41 AND chapter_num = 12 AND verse_num = 30)
        AND ar_word_position = 16;
    `
  },
  {
    gateNum: 59,
    name: '1thess_5_16_fabricated_kairos_restored',
    expectedFailTag: '[FAIL] 1Thess 5:16 & Mark 12:30 Repeated-Clause Context Anti-Collision Non-Regression',
    description: 'Restored fabricated G2540 @ TR:w3 onto 1Thess 5:16 pos 3 (حِينٍ)',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'G2540', orig_word_position = 3, verified_locator = 'TR:B52.C5.V16.w3'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 52 AND chapter_num = 5 AND verse_num = 16)
        AND ar_word_position = 3;
    `
  },
  {
    gateNum: 60,
    name: 'josh_24_15_fabricated_h517_restored',
    expectedFailTag: '[FAIL] Holdout Batch 2 Hebrew Lev 19:18, Deut 8:3, Josh 24:15 Non-Regression',
    description: 'Restored fabricated H517 onto Josh 24:15 pos 32 (أم particle mislinked as mother noun)',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H517', orig_word_position = 13, verified_locator = 'OSHB:B6.C24.V15.w13', morph_source = 'oshb_wlc'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 6 AND chapter_num = 24 AND verse_num = 15)
        AND ar_word_position = 32;
    `
  },
  {
    gateNum: 61,
    name: 'prov_16_9_shifted_w4_regression',
    expectedFailTag: '[FAIL] Holdout Batch 2 Hebrew Prov 16:9 Alignment & Control Exod 20:13 Untouched',
    description: 'Reverted Prov 16:9 pos 6 (الرب) back to stale w4/H1870 shift',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H1870', orig_word_position = 4, verified_locator = 'OSHB:B20.C16.V9.w4'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 20 AND chapter_num = 16 AND verse_num = 9)
        AND ar_word_position = 6;
    `
  },
  {
    gateNum: 62,
    name: 'ezra_4_12_strongs_lexicon_and_peil_lost',
    expectedFailTag: '[FAIL] Holdout Batch 3 Aramaic Ezra 4:12 Qere/Peil & Zero strongs_lexicon Provenance',
    description: 'Reverted Ezra 4:12 pos 1 morph_source to strongs_lexicon & cleared passive_participle',
    mutationSql: `
      UPDATE word_mappings
      SET morph_source = 'strongs_lexicon', morph_mood = NULL
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 4 AND verse_num = 12)
        AND ar_word_position = 1;
    `
  },
  {
    gateNum: 63,
    name: 'dan_2_44_h7662_regression',
    expectedFailTag: '[FAIL] Holdout Batch 3 Aramaic Ezra 6:14, Ezra 7:12 & Dan 2:44 Alignment Non-Regression',
    description: 'Corrupted Dan 2:44 pos 14 (تُتْرَكُ) from H7662@w17 back to wrong H7725@w14',
    mutationSql: `
      UPDATE word_mappings
      SET strongs_id = 'H7725', orig_word_position = 14, verified_locator = 'OSHB:B27.C2.V44.w14'
      WHERE verse_id = (SELECT id FROM verses WHERE book_id = 27 AND chapter_num = 2 AND verse_num = 44)
        AND ar_word_position = 14;
    `
  }
];

let verifiedGates = 0;

for (const tc of testCases) {
  console.log(`[${tc.gateNum}/${testCases.length}] Testing Gate ${tc.gateNum}: ${tc.description}...`);
  createFreshScratchDb();
  execSqlOnScratch(tc.mutationSql);
  const res = runAuditOnScratch();
  cleanScratchDb();

  const failedSpecifically = !res.passed && res.output.includes(tc.expectedFailTag);
  if (failedSpecifically) {
    console.log(`  ✓ [SUCCESS] Actual CI audit specifically triggered ${tc.expectedFailTag}`);
    verifiedGates++;
  } else {
    console.error(`  ✗ [FAILURE] Actual CI audit did NOT specifically trigger ${tc.expectedFailTag}`);
    console.error(`  Output snippet:\n${res.output.split('\n').filter(l => l.includes('[FAIL]') || l.includes('FAILURES')).join('\n')}`);
  }
}

cleanScratchDb();

console.log('\n========================================================================');
console.log(`NEGATIVE CI GATE VERIFICATION: ${verifiedGates}/${testCases.length} FORBIDDEN STATES SPECIFICALLY REJECTED.`);
console.log('========================================================================');

if (verifiedGates === testCases.length) {
  console.log('✓ MATHEMATICAL PROOF: Each forbidden state specifically triggers its dedicated [FAIL] gate in production audit.');
  process.exit(0);
} else {
  console.error('✗ Some negative tests failed to trigger their specific failure tag.');
  process.exit(1);
}
