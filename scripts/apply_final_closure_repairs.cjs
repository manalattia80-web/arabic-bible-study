const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_full_sub_repair.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// Full repairs catalog for all 76 substantive errors + Rev 9:14 SBLGNT reconciliation
const allRepairs = [
  // 1. Revelation 9:14 SBLGNT Reconciliation:
  // In SBLGNT: ὁ (w5) ἔχων (w6) τὴν (w7) σάλπιγγα (w8)
  // Text in verses table must be updated to exact SBLGNT
  // w4 «الَّذِي» -> ὁ (w5, G3588, RA -NSM)
  // w5 «مَعَهُ» -> ἔχων (w6, G2192, V- -PAPNSM)
  {
    type: 'custom_sql',
    sql: `
    UPDATE verses 
    SET text_original = 'λέγουσαν τῷ ἕκτῳ ἀγγέλῳ, ὁ ἔχων τὴν σάλπιγγα, Λῦσον τοὺς τέσσαρας ἀγγέλους τοὺς δεδεμένους ἐπὶ τῷ ποταμῷ τῷ μεγάλῳ Εὐφράτῃ.'
    WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14;

    UPDATE word_mappings
    SET orig_surface = 'ὁ',
        orig_word = 'ὁ',
        strongs_id = 'G3588',
        morph_pos = 'article',
        orig_morphology = 'RA -NSM',
        verified_locator = 'SBLGNT:B66.C9.V14.w5',
        relation_type = 'direct_translation',
        grammar_notes = 'أداة التعريف ὁ في طبعة SBLGNT تؤدي وظيفة الموصول النعتي، ويقابلها في النص المستلم (TR) اسم الموصول الصريح ὃς.'
    WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14)
      AND ar_word_position = 4;

    UPDATE word_mapping_strongs
    SET orig_component = 'ὁ',
        strongs_id = 'G3588',
        orig_morphology = 'RA -NSM',
        orig_word_position = 5
    WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14) AND ar_word_position = 4);

    UPDATE word_mappings
    SET orig_surface = 'ἔχων',
        orig_word = 'ἔχω',
        strongs_id = 'G2192',
        morph_pos = 'verb_participle',
        orig_morphology = 'V- -PAPNSM',
        verified_locator = 'SBLGNT:B66.C9.V14.w6',
        relation_type = 'contextual_rendering',
        grammar_notes = 'اسم فاعل فاعل مفرد مذكر ἔχων في طبعة SBLGNT (G2192) صِيغ في العربية بشبه الجملة «مَعَهُ» لأداء دلالة الحيازة. وتقابلها في النص المستلم (TR) صيغة الماضي الناقص εἶχε.'
    WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14)
      AND ar_word_position = 5;

    UPDATE word_mapping_strongs
    SET orig_component = 'ἔχων',
        strongs_id = 'G2192',
        orig_morphology = 'V- -PAPNSM',
        orig_word_position = 6
    WHERE mapping_id = (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = 66 AND chapter_num = 9 AND verse_num = 14) AND ar_word_position = 5);
    `
  },

  // 2. Mark 5:5 - G2699 κατακόπτων (cutting himself) not G2616 (oppressing)
  {
    book_id: 41, chapter: 5, verse: 5, ar_pos: 6, orig_pos: 6,
    orig_surface: 'ὄρεσιν', orig_word: 'ὄρος', strongs_id: 'G3735', morph: 'N- -DPN', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B41.C5.V5.w6'
  },
  {
    book_id: 41, chapter: 5, verse: 5, ar_pos: 8, orig_pos: 9,
    orig_surface: 'μνήμασιν', orig_word: 'μνῆμα', strongs_id: 'G3418', morph: 'N- -DPN', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B41.C5.V5.w9'
  },
  {
    book_id: 41, chapter: 5, verse: 5, ar_pos: 10, orig_pos: 12,
    orig_surface: 'κατακόπτων', orig_word: 'κατακόπτω', strongs_id: 'G2699', morph: 'V- -PAPNSM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B41.C5.V5.w12'
  },

  // 3. Mark 11:31
  {
    book_id: 41, chapter: 11, verse: 31, ar_pos: 1, orig_pos: 2,
    orig_surface: 'διελογίζοντο', orig_word: 'dialogizomai', orig_word_real: 'διαλογίζομαι', strongs_id: 'G1260', morph: 'V- 3IAI-P--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B41.C11.V31.w2'
  },
  {
    book_id: 41, chapter: 11, verse: 31, ar_pos: 4, orig_pos: 5,
    orig_surface: 'λέγοντες', orig_word: 'λέγω', strongs_id: 'G3004', morph: 'V- -PAPNPM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B41.C11.V31.w5'
  },
  {
    book_id: 41, chapter: 11, verse: 31, ar_pos: 6, orig_pos: 7,
    orig_surface: 'εἴπωμεν', orig_word: 'λέγω', strongs_id: 'G3004', morph: 'V- 2AAS-P--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B41.C11.V31.w7'
  },
  {
    book_id: 41, chapter: 11, verse: 31, ar_pos: 9, orig_pos: 11,
    orig_surface: 'ἐρεῖ', orig_word: 'ἐρῶ', strongs_id: 'G2046', morph: 'V- 3FAI-S--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B41.C11.V31.w11'
  },

  // 4. John 6:22 - συνεισῆλθεν G4884 (not G4819) & ἐνέβησαν G1684
  {
    book_id: 43, chapter: 6, verse: 22, ar_pos: 23, orig_pos: 23,
    orig_surface: 'ἐνέβησαν', orig_word: 'ἐμβαίνω', strongs_id: 'G1684', morph: 'V- 2AAI-P--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B43.C6.V22.w23'
  },
  {
    book_id: 43, chapter: 6, verse: 22, ar_pos: 28, orig_pos: 19,
    orig_surface: 'συνεισῆλθεν', orig_word: 'συνεισέρχομαι', strongs_id: 'G4884', morph: 'V- 2AAI-S--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B43.C6.V22.w19'
  },

  // 5. John 11:10 - προσκόπτει G4350 (not G4417)
  {
    book_id: 43, chapter: 11, verse: 10, ar_pos: 8, orig_pos: 7,
    orig_surface: 'προσκόπτει', orig_word: 'προσκόπτω', strongs_id: 'G4350', morph: 'V- 3PAI-S--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B43.C11.V10.w7'
  },

  // 6. John 16:23
  {
    book_id: 43, chapter: 16, verse: 23, ar_pos: 10, orig_pos: 10,
    orig_surface: 'ὑμῖν', orig_word: 'σύ', strongs_id: 'G4771', morph: 'RP -DPM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B43.C16.V23.w10'
  },
  {
    book_id: 43, chapter: 16, verse: 23, ar_pos: 12, orig_pos: 12,
    orig_surface: 'ὅσα', orig_word: 'ὅσος', strongs_id: 'G3745', morph: 'RC -APN', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B43.C16.V23.w12'
  },
  {
    book_id: 43, chapter: 16, verse: 23, ar_pos: 13, orig_pos: 13,
    orig_surface: 'ἂν', orig_word: 'ἄν', strongs_id: 'G302', morph: 'X- --------', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B43.C16.V23.w13'
  },

  // 7. John 20:21
  {
    book_id: 43, chapter: 20, verse: 21, ar_pos: 6, orig_pos: 8,
    orig_surface: 'ὑμῖν', orig_word: 'σύ', strongs_id: 'G4771', morph: 'RP -DPM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B43.C20.V21.w8'
  },

  // 8. Acts 11:28
  {
    book_id: 44, chapter: 11, verse: 28, ar_pos: 10, orig_pos: 10,
    orig_surface: 'μεγάλην', orig_word: 'μέγας', strongs_id: 'G3173', morph: 'AA -ASF', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B44.C11.V28.w10'
  },

  // 9. Acts 26:12 - ἐπιτροπῆς G2011 (commission) not G2003
  {
    book_id: 44, chapter: 26, verse: 12, ar_pos: 2, orig_pos: 3,
    orig_surface: 'πορευόμενος', orig_word: 'πορεύομαι', strongs_id: 'G4198', morph: 'V- -PEPNSM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B44.C26.V12.w3'
  },
  {
    book_id: 44, chapter: 26, verse: 12, ar_pos: 9, orig_pos: 7,
    orig_surface: 'ἐπιτροπῆς', orig_word: 'ἐπιτροπή', strongs_id: 'G2011', morph: 'N- -GSF', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B44.C26.V12.w7'
  },

  // 10. Romans 10:12
  {
    book_id: 45, chapter: 10, verse: 12, ar_pos: 14, orig_pos: 14,
    orig_surface: 'ἐπικαλουμένους', orig_word: 'ἐπικαλέω', strongs_id: 'G1941', morph: 'V- -PMPAPM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B45.C10.V12.w14'
  },
  {
    book_id: 45, chapter: 10, verse: 12, ar_pos: 15, orig_pos: 15,
    orig_surface: 'αὐτόν', orig_word: 'αὐτός', strongs_id: 'G846', morph: 'RP -ASM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B45.C10.V12.w15'
  },

  // 11. 1 Corinthians 3:2
  {
    book_id: 46, chapter: 3, verse: 2, ar_pos: 10, orig_pos: 9,
    orig_surface: 'ἀλλ’', orig_word: 'ἀλλά', strongs_id: 'G235', morph: 'C- --------', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B46.C3.V2.w9'
  },

  // 12. Colossians 2:11 - ἀχειροποιήτῳ G886 (not G5499)
  {
    book_id: 51, chapter: 2, verse: 11, ar_pos: 7, orig_pos: 5,
    orig_surface: 'ἀχειροποιήτῳ', orig_word: 'ἀχειροποίητος', strongs_id: 'G886', morph: 'AA -DSF', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B51.C2.V11.w5'
  },

  // 13. Colossians 2:15
  {
    book_id: 51, chapter: 2, verse: 15, ar_pos: 9, orig_pos: 8,
    orig_surface: 'αὐτῷ', orig_word: 'αὐτός', strongs_id: 'G846', morph: 'RP -DSM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B51.C2.V15.w8'
  },

  // 14. 1 Timothy 6:9
  {
    book_id: 54, chapter: 6, verse: 9, ar_pos: 5, orig_pos: 3,
    orig_surface: 'πλουτεῖν', orig_word: 'πλουτέω', strongs_id: 'G4147', morph: 'V- -PAN----', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B54.C6.V9.w3'
  },
  {
    book_id: 54, chapter: 6, verse: 9, ar_pos: 6, orig_pos: 3,
    orig_surface: 'πλουτεῖν', orig_word: 'πλουτέω', strongs_id: 'G4147', morph: 'V- -PAN----', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B54.C6.V9.w3'
  },

  // 15. Matthew 21:44
  {
    book_id: 40, chapter: 21, verse: 44, ar_pos: 10, orig_pos: 4,
    orig_surface: 'ἐπὶ', orig_word: 'ἐπί', strongs_id: 'G1909', morph: 'P- --------', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B40.C21.V44.w4'
  },

  // 16. Matthew 22:30
  {
    book_id: 40, chapter: 22, verse: 30, ar_pos: 8, orig_pos: 8,
    orig_surface: 'ἀλλ’', orig_word: 'ἀλλά', strongs_id: 'G235', morph: 'C- --------', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B40.C22.V30.w8'
  },
  {
    book_id: 40, chapter: 22, verse: 30, ar_pos: 9, orig_pos: 10,
    orig_surface: 'εἰσίν', orig_word: 'εἰμί', strongs_id: 'G1510', morph: 'V- 3PAI-P--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B40.C22.V30.w10'
  },

  // 17. Luke 1:12
  {
    book_id: 42, chapter: 1, verse: 12, ar_pos: 1, orig_pos: 2,
    orig_surface: 'ἰδών', orig_word: 'ὁράω', strongs_id: 'G3708', morph: 'V- 2AAPNSM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B42.C1.V12.w2'
  },
  {
    book_id: 42, chapter: 1, verse: 12, ar_pos: 6, orig_pos: 6,
    orig_surface: 'ἐπ’', orig_word: 'ἐπί', strongs_id: 'G1909', morph: 'P- --------', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B42.C1.V12.w6'
  },

  // 18. Luke 22:59
  {
    book_id: 42, chapter: 22, verse: 59, ar_pos: 13, orig_pos: 15,
    orig_surface: 'ἦν', orig_word: 'εἰμί', strongs_id: 'G1510', morph: 'V- 3IAI-S--', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B42.C22.V59.w15'
  },
  {
    book_id: 42, chapter: 22, verse: 59, ar_pos: 14, orig_pos: 14,
    orig_surface: 'αὐτοῦ', orig_word: 'αὐτός', strongs_id: 'G846', morph: 'RP -GSM', source: 'morphgnt_sblgnt', loc: 'SBLGNT:B42.C22.V59.w14'
  },

  // 19. Hebrew OT Verses:
  // Exodus 36:18
  {
    book_id: 2, chapter: 36, verse: 18, ar_pos: 4, orig_pos: 3,
    orig_surface: 'נְחֹשֶׁת', orig_word: 'נְחֹשֶׁת', strongs_id: 'H5178', morph: 'HNcfsa', source: 'oshb_wlc', loc: 'OSHB:B2.C36.V18.w3'
  },

  // Joshua 3:12
  {
    book_id: 6, chapter: 3, verse: 12, ar_pos: 6, orig_pos: 7,
    orig_surface: 'מִכֹּל', orig_word: 'כֹּל', strongs_id: 'H3605', morph: 'HR/Ncmsc', source: 'oshb_wlc', loc: 'OSHB:B6.C3.V12.w7'
  },
  {
    book_id: 6, chapter: 3, verse: 12, ar_pos: 11, orig_pos: 10,
    orig_surface: 'מִשָּׁבֶט', orig_word: 'שֵׁבֶט', strongs_id: 'H7626', morph: 'HR/Ncmsa', source: 'oshb_wlc', loc: 'OSHB:B6.C3.V12.w10'
  },

  // Joshua 22:23
  {
    book_id: 6, chapter: 22, verse: 23, ar_pos: 2, orig_pos: 2,
    orig_surface: 'לָנוּ', orig_word: 'לְ', strongs_id: 'H9005', morph: 'HR/Sp1cp', source: 'oshb_wlc', loc: 'OSHB:B6.C22.V23.w2'
  },
  {
    book_id: 6, chapter: 22, verse: 23, ar_pos: 5, orig_pos: 4,
    orig_surface: 'מֵאַחֲרֵי', orig_word: 'אַחַר', strongs_id: 'H310', morph: 'HR/R', source: 'oshb_wlc', loc: 'OSHB:B6.C22.V23.w4'
  },

  // Judges 20:42
  {
    book_id: 7, chapter: 20, verse: 42, ar_pos: 3, orig_pos: 3,
    orig_surface: 'בְּנֵי', orig_word: 'בֵּן', strongs_id: 'H1121', morph: 'HNcmpc', source: 'oshb_wlc', loc: 'OSHB:B7.C20.V42.w3'
  },
  {
    book_id: 7, chapter: 20, verse: 42, ar_pos: 8, orig_pos: 8,
    orig_surface: 'הַמִּלְחָמָה', orig_word: 'מִלְחָמָה', strongs_id: 'H4421', morph: 'HTd/Ncfsa', source: 'oshb_wlc', loc: 'OSHB:B7.C20.V42.w8'
  },
  {
    book_id: 7, chapter: 20, verse: 42, ar_pos: 12, orig_pos: 11,
    orig_surface: 'מִן־הֶעָרִים', orig_word: 'עִיר', strongs_id: 'H5892b', morph: 'HR/Td/Ncfpa', source: 'oshb_wlc', loc: 'OSHB:B7.C20.V42.w11'
  },

  // 2 Kings 5:1
  {
    book_id: 12, chapter: 5, verse: 1, ar_pos: 14, orig_pos: 11,
    orig_surface: 'בְיָדוֹ', orig_word: 'יָד', strongs_id: 'H3027', morph: 'HR/Ncbsc/Sp3ms', source: 'oshb_wlc', loc: 'OSHB:B12.C5.V1.w11'
  },
  {
    book_id: 12, chapter: 5, verse: 1, ar_pos: 15, orig_pos: 11,
    orig_surface: 'בְיָדוֹ', orig_word: 'יָד', strongs_id: 'H3027', morph: 'HR/Ncbsc/Sp3ms', source: 'oshb_wlc', loc: 'OSHB:B12.C5.V1.w11'
  },

  // 2 Kings 10:30
  {
    book_id: 12, chapter: 10, verse: 30, ar_pos: 4, orig_pos: 3,
    orig_surface: 'יַעַן', orig_word: 'יַעַן', strongs_id: 'H3282', morph: 'HC', source: 'oshb_wlc', loc: 'OSHB:B12.C10.V30.w3'
  },
  {
    book_id: 12, chapter: 10, verse: 30, ar_pos: 24, orig_pos: 18,
    orig_surface: 'רְבִעִים', orig_word: 'רְבִיעִי', strongs_id: 'H7243', morph: 'HAampa', source: 'oshb_wlc', loc: 'OSHB:B12.C10.V30.w18'
  },

  // Ezra 7:4 - בֻּקִּי Bukki H1231 (not half shekel H1235!)
  {
    book_id: 15, chapter: 7, verse: 4, ar_pos: 6, orig_pos: 5,
    orig_surface: 'בֻּקִּי', orig_word: 'בֻּקִּי', strongs_id: 'H1231', morph: 'HNp', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V4.w5'
  },

  // Job 27:12
  {
    book_id: 18, chapter: 27, verse: 12, ar_pos: 9, orig_pos: 8,
    orig_surface: 'תֶּהְבָּלוּ', orig_word: 'הָבַל', strongs_id: 'H1891', morph: 'HVqi2mp', source: 'oshb_wlc', loc: 'OSHB:B18.C27.V12.w8'
  },

  // Job 38:21
  {
    book_id: 18, chapter: 38, verse: 21, ar_pos: 2, orig_pos: 2,
    orig_surface: 'כִּי־', orig_word: 'כִּי', strongs_id: 'H3588', morph: 'HC', source: 'oshb_wlc', loc: 'OSHB:B18.C38.V21.w2'
  },

  // Psalms 53:4
  {
    book_id: 19, chapter: 53, verse: 4, ar_pos: 7, orig_pos: 4,
    orig_surface: 'עַמִּי', orig_word: 'עַם', strongs_id: 'H5971', morph: 'HNcmsc/Sp1cs', source: 'oshb_wlc', loc: 'OSHB:B19.C53.V4.w4'
  },

  // Psalms 55:11
  {
    book_id: 19, chapter: 55, verse: 11, ar_pos: 1, orig_pos: 2,
    orig_surface: 'הַוּוֹת', orig_word: 'הַוָּה', strongs_id: 'H1942', morph: 'HNcfpa', source: 'oshb_wlc', loc: 'OSHB:B19.C55.V11.w2'
  },
  {
    book_id: 19, chapter: 55, verse: 11, ar_pos: 5, orig_pos: 5,
    orig_surface: 'יָמִישׁ', orig_word: 'מוּשׁ', strongs_id: 'H4185', morph: 'HVhi3ms', source: 'oshb_wlc', loc: 'OSHB:B19.C55.V11.w5'
  },
  {
    book_id: 19, chapter: 55, verse: 11, ar_pos: 6, orig_pos: 6,
    orig_surface: 'מֵרְחֹבָהּ', orig_word: 'רְחוֹב', strongs_id: 'H7339', morph: 'HR/Ncbsc/Sp3fs', source: 'oshb_wlc', loc: 'OSHB:B19.C55.V11.w6'
  },

  // Psalms 62:9
  {
    book_id: 19, chapter: 62, verse: 9, ar_pos: 3, orig_pos: 3,
    orig_surface: 'בְנֵי־אָדָם', orig_word: 'בֵּן', strongs_id: 'H1121', morph: 'HNcmpc', source: 'oshb_wlc', loc: 'OSHB:B19.C62.V9.w3'
  },
  {
    book_id: 19, chapter: 62, verse: 9, ar_pos: 6, orig_pos: 5,
    orig_surface: 'בְּנֵי', orig_word: 'בֵּן', strongs_id: 'H1121', morph: 'HNcmpc', source: 'oshb_wlc', loc: 'OSHB:B19.C62.V9.w5'
  },
  {
    book_id: 19, chapter: 62, verse: 9, ar_pos: 9, orig_pos: 8,
    orig_surface: 'בְּמֹאזְנַיִם', orig_word: 'מֹאזְנַיִם', strongs_id: 'H3976', morph: 'HR/Ncmdsa', source: 'oshb_wlc', loc: 'OSHB:B19.C62.V9.w8'
  },
  {
    book_id: 19, chapter: 62, verse: 9, ar_pos: 13, orig_pos: 10,
    orig_surface: 'מֵהֶבֶל', orig_word: 'הֶבֶל', strongs_id: 'H1892', morph: 'HR/Ncmsa', source: 'oshb_wlc', loc: 'OSHB:B19.C62.V9.w10'
  },

  // Psalms 65:3
  {
    book_id: 19, chapter: 65, verse: 3, ar_pos: 1, orig_pos: 2,
    orig_surface: 'עֲוֹנֹת', orig_word: 'עָוֹן', strongs_id: 'H5771', morph: 'HNcbpc', source: 'oshb_wlc', loc: 'OSHB:B19.C65.V3.w2'
  },
  {
    book_id: 19, chapter: 65, verse: 3, ar_pos: 4, orig_pos: 4,
    orig_surface: 'מִמֶּנִּי', orig_word: 'מִן', strongs_id: 'H4480', morph: 'HR/Sp1cs', source: 'oshb_wlc', loc: 'OSHB:B19.C65.V3.w4'
  },
  {
    book_id: 19, chapter: 65, verse: 3, ar_pos: 8, orig_pos: 6,
    orig_surface: 'תְּכַפְּרֵם', orig_word: 'כָּפַר', strongs_id: 'H3722', morph: 'HVpi2ms/Sp3mp', source: 'oshb_wlc', loc: 'OSHB:B19.C65.V3.w6'
  },

  // Proverbs 9:13
  {
    book_id: 20, chapter: 9, verse: 13, ar_pos: 5, orig_pos: 5,
    orig_surface: 'וּבַל־', orig_word: 'בַּל', strongs_id: 'H1077', morph: 'HC/Tn', source: 'oshb_wlc', loc: 'OSHB:B20.C9.V13.w5'
  },

  // Jeremiah 52:21
  {
    book_id: 24, chapter: 52, verse: 21, ar_pos: 3, orig_pos: 5,
    orig_surface: 'קוֹמָה', orig_word: 'קוֹמָה', strongs_id: 'H6967', morph: 'HNcfsa', source: 'oshb_wlc', loc: 'OSHB:B24.C52.V21.w5'
  },
  {
    book_id: 24, chapter: 52, verse: 21, ar_pos: 4, orig_pos: 5,
    orig_surface: 'קוֹמָה', orig_word: 'קוֹמָה', strongs_id: 'H6967', morph: 'HNcfsa', source: 'oshb_wlc', loc: 'OSHB:B24.C52.V21.w5'
  },
  {
    book_id: 24, chapter: 52, verse: 21, ar_pos: 15, orig_pos: 10,
    orig_surface: 'יְסֻבֶּנּוּ', orig_word: 'סָבַב', strongs_id: 'H5437', morph: 'HVqi3ms/Sp3ms', source: 'oshb_wlc', loc: 'OSHB:B24.C52.V21.w10'
  },
  {
    book_id: 24, chapter: 52, verse: 21, ar_pos: 19, orig_pos: 14,
    orig_surface: 'נָבוּב', orig_word: 'נָבַב', strongs_id: 'H5033', morph: 'HAamsa', source: 'oshb_wlc', loc: 'OSHB:B24.C52.V21.w14'
  },

  // Aramaic OT:
  // Ezra 7:21
  {
    book_id: 15, chapter: 7, verse: 21, ar_pos: 11, orig_pos: 12,
    orig_surface: 'בַּעֲבַר', orig_word: 'עֲבַר', strongs_id: 'H5675', morph: 'TR/Ncmsc', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V21.w12'
  },
  {
    book_id: 15, chapter: 7, verse: 21, ar_pos: 14, orig_pos: 13,
    orig_surface: 'דִּי', orig_word: 'דִּי', strongs_id: 'H1768', morph: 'TTr', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V21.w13'
  },
  {
    book_id: 15, chapter: 7, verse: 21, ar_pos: 16, orig_pos: 16,
    orig_surface: 'כָּל־דִּי', orig_word: 'כֹּל', strongs_id: 'H3606', morph: 'TNcmsc', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V21.w16'
  },
  {
    book_id: 15, chapter: 7, verse: 21, ar_pos: 18, orig_pos: 19,
    orig_surface: 'מִנְכוֹן', orig_word: 'מִן', strongs_id: 'H4481', morph: 'TR/Sp2mp', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V21.w19'
  },

  // Ezra 7:24
  {
    book_id: 15, chapter: 7, verse: 24, ar_pos: 14, orig_pos: 14,
    orig_surface: 'שַׁלִּיט', orig_word: 'שַׁלִּיט', strongs_id: 'H7990', morph: 'TAamsa', source: 'oshb_wlc', loc: 'OSHB:B15.C7.V24.w14'
  },

  // Daniel 2:38
  {
    book_id: 27, chapter: 2, verse: 38, ar_pos: 2, orig_pos: 2,
    orig_surface: 'דָיְרִין', orig_word: 'דּוּר', strongs_id: 'H1753', morph: 'TVrmpa', source: 'oshb_wlc', loc: 'OSHB:B27.C2.V38.w2'
  },

  // Daniel 4:13
  {
    book_id: 27, chapter: 4, verse: 13, ar_pos: 2, orig_pos: 2,
    orig_surface: 'חָזֵה', orig_word: 'חֲזָא', strongs_id: 'H2370', morph: 'TVrmsa', source: 'oshb_wlc', loc: 'OSHB:B27.C4.V13.w2'
  },
  {
    book_id: 27, chapter: 4, verse: 13, ar_pos: 8, orig_pos: 9,
    orig_surface: 'וַאֲלוּ', orig_word: 'אֲלוּ', strongs_id: 'H431', morph: 'TC/Tj', source: 'oshb_wlc', loc: 'OSHB:B27.C4.V13.w9'
  },
  {
    book_id: 27, chapter: 4, verse: 13, ar_pos: 13, orig_pos: 13,
    orig_surface: 'שְׁמַיָּא', orig_word: 'שְׁמַיִן', strongs_id: 'H8065', morph: 'TNcmpd', source: 'oshb_wlc', loc: 'OSHB:B27.C4.V13.w13'
  },

  // Daniel 4:30
  {
    book_id: 27, chapter: 4, verse: 30, ar_pos: 9, orig_pos: 9,
    orig_surface: 'בֱנַיְתַהּ', orig_word: 'בְּנָא', strongs_id: 'H1124', morph: 'TVqp1cs/Sp3fs', source: 'oshb_wlc', loc: 'OSHB:B27.C4.V30.w9'
  },
  {
    book_id: 27, chapter: 4, verse: 30, ar_pos: 14, orig_pos: 15,
    orig_surface: 'וְלִיקָר', orig_word: 'יְקָר', strongs_id: 'H3367', morph: 'TC/R/Ncmsc', source: 'oshb_wlc', loc: 'OSHB:B27.C4.V30.w15'
  },

  // Daniel 5:5
  {
    book_id: 27, chapter: 5, verse: 5, ar_pos: 2, orig_pos: 2,
    orig_surface: 'בַהּ־שַׁעֲתָה', orig_word: 'שָׁעָה', strongs_id: 'H8160', morph: 'TR/Sp3fs/Ncfsa', source: 'oshb_wlc', loc: 'OSHB:B27.C5.V5.w2'
  },
  {
    book_id: 27, chapter: 5, verse: 5, ar_pos: 9, orig_pos: 9,
    orig_surface: 'לָקֳבֵל', orig_word: 'קֳבֵל', strongs_id: 'H6903', morph: 'TR/R', source: 'oshb_wlc', loc: 'OSHB:B27.C5.V5.w9'
  }
];

let sql = 'BEGIN TRANSACTION;\n';

for (const r of allRepairs) {
  if (r.type === 'custom_sql') {
    sql += r.sql + '\n';
    continue;
  }

  const lemma = r.orig_word_real || r.orig_word;
  sql += `
  UPDATE word_mappings
  SET orig_word_position = ${r.orig_pos},
      orig_surface = '${r.orig_surface}',
      orig_word = '${lemma}',
      strongs_id = '${r.strongs_id}',
      orig_morphology = '${r.morph}',
      morph_source = '${r.source}',
      verified_locator = '${r.loc}',
      grammar_notes = 'تم إغلاق وتدقيق التحليل الصرفي والمعجمي في الإصدار الختامي'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${r.book_id} AND chapter_num = ${r.chapter} AND verse_num = ${r.verse})
    AND ar_word_position = ${r.ar_pos};

  INSERT OR REPLACE INTO word_mapping_strongs (
    mapping_id, strongs_id, link_order, link_role, orig_component,
    orig_word_position, orig_morphology, morph_source
  ) VALUES (
    (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${r.book_id} AND chapter_num = ${r.chapter} AND verse_num = ${r.verse}) AND ar_word_position = ${r.ar_pos}),
    '${r.strongs_id}', 1, 'primary', '${r.orig_surface}',
    ${r.orig_pos}, '${r.morph}', '${r.source}'
  );
  `;
}

sql += 'COMMIT;\n';

runSql(sql);
console.log('Successfully applied all philological closures!');
