const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseMorphology } = require('./morphology_engine.cjs');

const SQLITE = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const DB = path.resolve(__dirname, '../mobile/assets/bible_study.db');

const updates = [
  // 1. Exodus 15:2
  { book: 2, ch: 15, vs: 2, pos: 8, loc: 'OSHB:B2.C15.V2.w8', orig_pos: 8, orig: 'אֵל', surf: 'אֵלִי֙', morph: 'HNcmsc/Sp1cs', strongs: 'H410' },

  // 2. Leviticus 26:12
  { book: 3, ch: 26, vs: 12, pos: 2, loc: 'OSHB:B3.C26.V12.w2', orig_pos: 2, orig: 'תָּוֶךְ', surf: 'בְּתוֹכְכֶם', morph: 'HR/Ncmsc/Sp2mp', strongs: 'H8432' },

  // 3. Deuteronomy 6:5
  { book: 5, ch: 6, vs: 5, pos: 7, loc: 'OSHB:B5.C6.V5.w7', orig_pos: 7, orig: 'כֹּל', surf: 'וּבְכָל', morph: 'HC/R/Ncmsc', strongs: 'H3605' },
  { book: 5, ch: 6, vs: 5, pos: 9, loc: 'OSHB:B5.C6.V5.w8', orig_pos: 8, orig: 'נֶפֶשׁ', surf: 'נַפְשְׁךָ֖', morph: 'HNcbsc/Sp2ms', strongs: 'H5315' },
  { book: 5, ch: 6, vs: 5, pos: 10, loc: 'OSHB:B5.C6.V5.w9', orig_pos: 9, orig: 'כֹּל', surf: 'וּבְכָל', morph: 'HC/R/Ncmsc', strongs: 'H3605' },

  // 4. Joshua 1:9
  { book: 6, ch: 1, vs: 9, pos: 14, loc: 'OSHB:B6.C1.V9.w15', orig_pos: 15, orig: 'הָלַךְ', surf: 'תֵּלֵֽךְ׃', morph: 'HVqi2ms', strongs: 'H1980' },

  // 5. 1 Kings 18:21
  { book: 11, ch: 18, vs: 21, pos: 6, loc: 'OSHB:B11.C18.V21.w6', orig_pos: 6, orig: 'אָמַר', surf: 'וַיֹּ֙אמֶר֙', morph: 'HC/Vqw3ms', strongs: 'H559' },
  { book: 11, ch: 18, vs: 21, pos: 7, loc: 'OSHB:B11.C18.V21.w7', orig_pos: 7, orig: 'עַד', surf: 'עַד־', morph: 'HR', strongs: 'H5704' },
  { book: 11, ch: 18, vs: 21, pos: 8, loc: 'OSHB:B11.C18.V21.w8', orig_pos: 8, orig: 'מָתַי', surf: 'מָתַ֞י', morph: 'HTi', strongs: 'H4970' },
  { book: 11, ch: 18, vs: 21, pos: 12, loc: 'OSHB:B11.C18.V21.w14', orig_pos: 14, orig: 'אִם', surf: 'אִם־', morph: 'HC', strongs: 'H518' },
  { book: 11, ch: 18, vs: 21, pos: 17, loc: 'OSHB:B11.C18.V21.w17', orig_pos: 17, orig: 'הָלַךְ', surf: 'לְכ֣וּ אַחֲרָ֔יו', morph: 'HVqv2mp', strongs: 'H1980' },
  { book: 11, ch: 18, vs: 21, pos: 18, loc: 'OSHB:B11.C18.V21.w19', orig_pos: 19, orig: 'אִם', surf: 'וְאִם־', morph: 'HC/C', strongs: 'H518' },
  { book: 11, ch: 18, vs: 21, pos: 21, loc: 'OSHB:B11.C18.V21.w21', orig_pos: 21, orig: 'הָלַךְ', surf: 'לְכ֣וּ אַחֲרָ֑יו', morph: 'HVqv2mp', strongs: 'H1980' },

  // 6. Zechariah 4:6
  { book: 38, ch: 4, vs: 6, pos: 5, loc: 'OSHB:B38.C4.V6.w6', orig_pos: 6, orig: 'דָּבָר', surf: 'דְּבַר־', morph: 'HNcmsc', strongs: 'H1697' },

  // 7. Ezra 5:8
  { book: 15, ch: 5, vs: 8, pos: 3, loc: 'OSHB:B15.C5.V8.w3', orig_pos: 3, orig: 'מֶלֶךְ', surf: 'לְמַלְכָּ֗א', morph: 'AR/Ncmsd/Td', strongs: 'H4430' },
  { book: 15, ch: 5, vs: 8, pos: 5, loc: 'OSHB:B15.C5.V8.w4', orig_pos: 4, orig: 'דִּי', surf: 'דִּֽי', morph: 'ATr', strongs: 'H1768' },
  { book: 15, ch: 5, vs: 8, pos: 7, loc: 'OSHB:B15.C5.V8.w6', orig_pos: 6, orig: 'יְהוּד', surf: 'לִיה֤וּד', morph: 'AR/Np', strongs: 'H3061' },
  { book: 15, ch: 5, vs: 8, pos: 10, loc: 'OSHB:B15.C5.V8.w8', orig_pos: 8, orig: 'בַּיִת', surf: 'לְבֵית֙', morph: 'AR/Ncmsc', strongs: 'H1005' },
  { book: 15, ch: 5, vs: 8, pos: 18, loc: 'OSHB:B15.C5.V8.w14', orig_pos: 14, orig: 'גְּלָל', surf: 'גְּלָ֔ל', morph: 'ANcmsa', strongs: 'H1560' },
  { book: 15, ch: 5, vs: 8, pos: 20, loc: 'OSHB:B15.C5.V8.w15', orig_pos: 15, orig: 'אָע', surf: 'וְאָ֖ע', morph: 'AC/Ncmsa', strongs: 'H636' },
  { book: 15, ch: 5, vs: 8, pos: 22, loc: 'OSHB:B15.C5.V8.w17', orig_pos: 17, orig: 'כְּתַל', surf: 'בְּכֻתְלַיָּ֑א', morph: 'AR/Ncmpd/Td', strongs: 'H3797' },
  { book: 15, ch: 5, vs: 8, pos: 23, loc: 'OSHB:B15.C5.V8.w19', orig_pos: 19, orig: 'דָּךְ', surf: 'דָ֛ךְ', morph: 'APdxfs', strongs: 'H1791' },
  { book: 15, ch: 5, vs: 8, pos: 24, loc: 'OSHB:B15.C5.V8.w18', orig_pos: 18, orig: 'עֲבִידָה', surf: 'וַעֲבִ֥ידְתָּא', morph: 'AC/Ncfsd/Td', strongs: 'H5673' },
  { book: 15, ch: 5, vs: 8, pos: 25, loc: 'OSHB:B15.C5.V8.w21', orig_pos: 21, orig: 'עֲבַד', surf: 'מִתְעַבְדָ֖א', morph: 'AVurfsa', strongs: 'H5648' },
  { book: 15, ch: 5, vs: 8, pos: 26, loc: 'OSHB:B15.C5.V8.w20', orig_pos: 20, orig: 'אָסְפַּרְנָא', surf: 'אָסְפַּ֥רְנָא', morph: 'AD', strongs: 'H629' },
  { book: 15, ch: 5, vs: 8, pos: 27, loc: 'OSHB:B15.C5.V8.w22', orig_pos: 22, orig: 'צְלַח', surf: 'וּמַצְלַ֥ח', morph: 'AC/Varmsa', strongs: 'H6744' },
  { book: 15, ch: 5, vs: 8, pos: 29, loc: 'OSHB:B15.C5.V8.w23', orig_pos: 23, orig: 'יַד', surf: 'בְּיֶדְהֹֽם', morph: 'AR/Ncfsc/Sp3mp', strongs: 'H3028' },

  // 8. Daniel 4:17 (MT Dan 4:14)
  { book: 27, ch: 4, vs: 17, pos: 1, loc: 'OSHB:B27.C4.V14.w3', orig_pos: 3, orig: 'פִּתְגָם', surf: 'פִּתְגָמָ֔א', morph: 'ANcmsd/Td', strongs: 'H6600' },
  { book: 27, ch: 4, vs: 17, pos: 2, loc: 'OSHB:B27.C4.V14.w3', orig_pos: 3, orig: 'פִּתְגָם', surf: 'פִּתְגָמָ֔א', morph: 'ANcmsd/Td', strongs: 'H6600' },
  { book: 27, ch: 4, vs: 17, pos: 3, loc: 'OSHB:B27.C4.V14.w1', orig_pos: 1, orig: 'גְּזֵרָה', surf: 'בִּגְזֵרַ֤ת', morph: 'AR/Ncfsc', strongs: 'H1510' },
  { book: 27, ch: 4, vs: 17, pos: 5, loc: 'OSHB:B27.C4.V14.w6', orig_pos: 6, orig: 'שְׁאֵלָה', surf: 'שְׁאֵֽלְתָ֑א', morph: 'ANcfsd/Td', strongs: 'H7595' },
  { book: 27, ch: 4, vs: 17, pos: 6, loc: 'OSHB:B27.C4.V14.w4', orig_pos: 4, orig: 'מֵאמַר', surf: 'וּמֵאמַ֥ר', morph: 'AC/Ncmsc', strongs: 'H3983' },
  { book: 27, ch: 4, vs: 17, pos: 7, loc: 'OSHB:B27.C4.V14.w5', orig_pos: 5, orig: 'קַדִּישׁ', surf: 'קַדִּישִׁ֖ין', morph: 'AAampa', strongs: 'H6922' },
  { book: 27, ch: 4, vs: 17, pos: 12, loc: 'OSHB:B27.C4.V14.w15', orig_pos: 15, orig: 'עִלָּאָה', surf: 'עִלָּאָ֜ה', morph: 'ANcmsd/Td', strongs: 'H5943' },
  { book: 27, ch: 4, vs: 17, pos: 15, loc: 'OSHB:B27.C4.V14.w16', orig_pos: 16, orig: 'מַלְכוּ', surf: 'בְּמַלְכ֣וּת', morph: 'AR/Ncfsc', strongs: 'H4437' },
  { book: 27, ch: 4, vs: 17, pos: 18, loc: 'OSHB:B27.C4.V14.w19', orig_pos: 19, orig: 'מַן', surf: 'וּלְמַן', morph: 'AC/R/Pfxcs', strongs: 'H4479' },

  // 9. Galatians 5:22
  { book: 48, ch: 5, vs: 22, pos: 11, loc: 'SBLGNT:B48.C5.V22.w11', orig_pos: 11, orig: 'ἀγαθωσύνη', surf: 'ἀγαθωσύνη', morph: 'N- ----NSF-', strongs: 'G19' }
];

let sqls = ['BEGIN TRANSACTION;'];

for (const u of updates) {
  sqls.push(`
    UPDATE word_mappings
    SET verified_locator = '${u.loc}',
        orig_word_position = ${u.orig_pos},
        orig_word = '${u.orig}',
        orig_surface = '${u.surf}',
        orig_morphology = '${u.morph}',
        strongs_id = '${u.strongs}'
    WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${u.book} AND chapter_num = ${u.ch} AND verse_num = ${u.vs})
      AND ar_word_position = ${u.pos};
  `);
}

fs.writeFileSync('temp_align_batch.sql', sqls.concat(['COMMIT;']).join('\n'));
execSync(`"${SQLITE}" "${DB}" < temp_align_batch.sql`);
fs.unlinkSync('temp_align_batch.sql');

console.log('Applied verified alignments from OSHB XML.');

// Now fetch ALL records in the 20 verses and systematically re-derive morphology
const targetVerses = [
  { book: 2, ch: 15, vs: 2 }, { book: 3, ch: 26, vs: 12 }, { book: 5, ch: 6, vs: 5 },
  { book: 6, ch: 1, vs: 9 }, { book: 8, ch: 1, vs: 16 }, { book: 11, ch: 18, vs: 21 },
  { book: 14, ch: 7, vs: 14 }, { book: 15, ch: 5, vs: 8 }, { book: 27, ch: 4, vs: 17 },
  { book: 38, ch: 4, vs: 6 }, { book: 40, ch: 11, vs: 28 }, { book: 41, ch: 10, vs: 45 },
  { book: 42, ch: 15, vs: 20 }, { book: 43, ch: 14, vs: 6 }, { book: 45, ch: 8, vs: 28 },
  { book: 48, ch: 5, vs: 22 }, { book: 50, ch: 4, vs: 6 }, { book: 51, ch: 3, vs: 12 },
  { book: 60, ch: 5, vs: 7 }, { book: 62, ch: 4, vs: 8 }
];

const whereClauses = targetVerses.map(v => `(v.book_id = ${v.book} AND v.chapter_num = ${v.ch} AND v.verse_num = ${v.vs})`).join(' OR ');
const selectAllSql = `
SELECT wm.id, wm.orig_morphology
FROM word_mappings wm
JOIN verses v ON wm.verse_id = v.id
WHERE ${whereClauses};
`;
fs.writeFileSync('temp_all_morph.sql', selectAllSql);
const allRows = execSync(`"${SQLITE}" "${DB}" < temp_all_morph.sql`).toString('utf8').trim().split('\n');
fs.unlinkSync('temp_all_morph.sql');

console.log(`Re-deriving morphology for ${allRows.length} words...`);

let updateBatch = ['BEGIN TRANSACTION;'];
const escapeVal = (val) => val ? `'${val}'` : 'NULL';

for (const row of allRows) {
  if (!row) continue;
  const [id, rawMorph] = row.split('|');
  const parsed = parseMorphology(rawMorph);

  updateBatch.push(`
    UPDATE word_mappings
    SET morph_pos = ${escapeVal(parsed.pos)},
        morph_stem = ${escapeVal(parsed.stem)},
        morph_tense = ${escapeVal(parsed.tense)},
        morph_voice = ${escapeVal(parsed.voice)},
        morph_mood = ${escapeVal(parsed.mood)},
        morph_person = ${escapeVal(parsed.person)},
        morph_gender = ${escapeVal(parsed.gender)},
        morph_number = ${escapeVal(parsed.number)},
        morph_case = ${escapeVal(parsed.case)}
    WHERE id = '${id}';
  `);
}

// Synchronize word_mapping_strongs with word_mappings for all primary roles
updateBatch.push(`
  UPDATE word_mapping_strongs
  SET orig_word_position = (SELECT wm.orig_word_position FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      strongs_id = (SELECT wm.strongs_id FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      orig_morphology = (SELECT wm.orig_morphology FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      morph_source = (SELECT wm.morph_source FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id)
  WHERE link_role = 'primary';
`);

updateBatch.push('COMMIT;');

fs.writeFileSync('temp_update_derived.sql', updateBatch.join('\n'));
execSync(`"${SQLITE}" "${DB}" < temp_update_derived.sql`);
fs.unlinkSync('temp_update_derived.sql');

console.log('Successfully re-derived all morphology and synchronized word_mapping_strongs!');
