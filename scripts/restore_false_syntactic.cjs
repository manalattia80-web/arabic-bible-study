const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');

function runSql(sql) {
  const tmp = path.resolve(__dirname, 'tmp_restore_syn.sql');
  fs.writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(`"${sqlite}" "${dbPath}" < "${tmp}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// Content words restoration
const restorations = [
  // John 20:21
  // AVD: فَقَالَ لَهُمْ يَسُوعُ أَيْضًا: «سَلاَمٌ لَكُمْ! كَمَا أَرْسَلَنِي الآبُ أُرْسِلُكُمْ أَنَا».
  // Greek: εἶπεν (1) οὖν (2) αὐτοῖς (3) ὁ (4) Ἰησοῦς (5) πάλιν (6)· Εἰρήνη (7) ὑμῖν (8)· καθὼς (9) ἀπέσταλκέν (10) με (11) ὁ (12) πατήρ (13), κἀγὼ (14) πέμπω (15) ὑμᾶς (16).
  {
    book_id: 43, chapter: 20, verse: 21,
    words: [
      {
        ar_pos: 4, ar_word: 'أَيْضًا:', orig_pos: 6, orig_surface: 'πάλιν', orig_word: 'πάλιν',
        strongs_id: 'G3825', morph_pos: 'adverb', orig_morphology: 'D- --------',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B43.C20.V21.w6', relation_type: 'direct_translation'
      },
      {
        ar_pos: 5, ar_word: '«سَلاَمٌ', orig_pos: 7, orig_surface: 'Εἰρήνη', orig_word: 'εἰρήνη',
        strongs_id: 'G1515', morph_pos: 'noun', orig_morphology: 'N- -NSF',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B43.C20.V21.w7', relation_type: 'direct_translation'
      }
    ]
  },

  // Mark 9:19
  // Greek: ὁ δὲ ἀποκριθεὶς αὐτοῖς λέγει· Ὦ γενεὰ ἄπιστος...
  // AVD: فَأَجَابَ وَقَالَ لَهُمْ: «أَيُّهَا الْجِيلُ غَيْرُ الْمُؤْمِنِ...
  {
    book_id: 41, chapter: 9, verse: 19,
    words: [
      {
        ar_pos: 3, ar_word: 'لَهُمْ:', orig_pos: 4, orig_surface: 'αὐτοῖς', orig_word: 'αὐτός',
        strongs_id: 'G846', morph_pos: 'personal_pronoun', orig_morphology: 'RP -DPM',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B41.C9.V19.w4', relation_type: 'direct_translation'
      },
      {
        ar_pos: 4, ar_word: '«أَيُّهَا', orig_pos: 6, orig_surface: 'Ὦ', orig_word: 'ὦ',
        strongs_id: 'G5599', morph_pos: 'interjection', orig_morphology: 'I- --------',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B41.C9.V19.w6', relation_type: 'direct_translation'
      }
    ]
  },

  // Mark 11:31
  // Greek: καὶ διελογίζοντο πρὸς ἑαυτοὺς λέγοντες· Ἐὰν εἴπωμεν...
  // AVD: فَفَكَّرُوا فِي أَنْفُسِهِمْ قَائِلِينَ: «إِنْ قُلْنَا...
  {
    book_id: 41, chapter: 11, verse: 31,
    words: [
      {
        ar_pos: 5, ar_word: '«إِنْ', orig_pos: 6, orig_surface: 'Ἐὰν', orig_word: 'ἐάν',
        strongs_id: 'G1437', morph_pos: 'conjunction', orig_morphology: 'C- --------',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B41.C11.V31.w6', relation_type: 'direct_translation'
      }
    ]
  },

  // Luke 22:59
  // Greek: καὶ διαστάσης ὡσεὶ ὥρας μιᾶς ἄλλος τις διισχυρίζετο λέγων· Ἐπ’ ἀληθείας καὶ οὗτος μετ’ αὐτοῦ ἦν...
  // AVD: وَلَمَّا مَضَى نَحْوُ سَاعَةٍ وَاحِدَةٍ أَكَّدَ آخَرُ قَائِلاً: «بِالْحَقِّ إِنَّ هذَا أَيْضًا كَانَ مَعَهُ...
  {
    book_id: 42, chapter: 22, verse: 59,
    words: [
      {
        ar_pos: 2, ar_word: 'مَضَى', orig_pos: 2, orig_surface: 'διαστάσης', orig_word: 'διίστημι',
        strongs_id: 'G1339', morph_pos: 'verb_participle', orig_morphology: 'V- -AAPGSF',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B42.C22.V59.w2', relation_type: 'direct_translation'
      },
      {
        ar_pos: 6, ar_word: 'أَكَّدَ', orig_pos: 8, orig_surface: 'διισχυρίζετο', orig_word: 'διισχυρίζομαι',
        strongs_id: 'G1340', morph_pos: 'verb_finite', orig_morphology: 'V- 3IAI-S--',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B42.C22.V59.w8', relation_type: 'direct_translation'
      },
      {
        ar_pos: 9, ar_word: '«بِالْحَقِّ', orig_pos: 11, orig_surface: 'ἀληθείας', orig_word: 'ἀλήθεια',
        strongs_id: 'G225', morph_pos: 'noun', orig_morphology: 'N- -GSF',
        source: 'morphgnt_sblgnt', locator: 'SBLGNT:B42.C22.V59.w11', relation_type: 'compound_phrase'
      }
    ]
  },

  // 1 Samuel 26:16
  // Hebrew: חַי־יְהוָה כִּי בְנֵי־מָוֶת אַתֶּם אֲשֶׁר לוֹא־שְׁמַרְתֶּם עַל־אֲדֹנֵיכֶם... חֲנִית הַמֶּלֶךְ וְאֶת־צְפַחַת הַמַּיִם אֲשֶׁר מְרַאֲשֹׁתָו׃
  // AVD: حَيٌّ هُوَ الرَّبُّ، إِنَّكُمْ أَبْنَاءُ الْمَوْتِ أَنْتُمْ، لأَنَّكُمْ لَمْ تُحَافِظُوا عَلَى سَيِّدِكُمْ... رُمْحُ الْمَلِكِ وَكُوزُ الْمَاءِ الَّذِي كَانَ عِنْدَ رَأْسِهِ؟
  {
    book_id: 9, chapter: 26, verse: 16,
    words: [
      {
        ar_pos: 16, ar_word: 'تُحَافِظُوا', orig_pos: 11, orig_surface: 'שְׁמַרְתֶּם', orig_word: 'שָׁמַר',
        strongs_id: 'H8104', morph_pos: 'verb_finite', orig_morphology: 'HVqp2mp',
        source: 'oshb_wlc', locator: 'OSHB:B9.C26.V16.w11', relation_type: 'direct_translation'
      },
      {
        ar_pos: 28, ar_word: 'وَكُوزُ', orig_pos: 21, orig_surface: 'וְאֶת־צְפַחַת', orig_word: 'צַפַּחַת',
        strongs_id: 'H6835', morph_pos: 'noun', orig_morphology: 'HC/Ncfsc',
        source: 'oshb_wlc', locator: 'OSHB:B9.C26.V16.w21', relation_type: 'compound_phrase'
      },
      {
        ar_pos: 33, ar_word: 'رَأْسِهِ', orig_pos: 25, orig_surface: 'מְרַאֲשֹׁתָיו', orig_word: 'מְרַאֲשׁוֹת',
        strongs_id: 'H4763', morph_pos: 'noun_with_suffix', orig_morphology: 'HNcfpc/Sp3ms',
        source: 'oshb_wlc', locator: 'OSHB:B9.C26.V16.w25', relation_type: 'compound_phrase'
      }
    ]
  },

  // Isaiah 54:4
  // Hebrew: אַל־תִּירְאִי כִּי־לֹא תֵבוֹשִׁי וְאַל־תִּכָּלְמִי כִּי לֹא תַחְפִּירִי כִּי בֹשֶׁת עֲלוּמַיִךְ תִּשְׁכָּחִי וְחֶרְפַּת אַלְמְנוּתַיִךְ לֹא תִזְכְּרִי־עוֹד׃
  // AVD: «لاَ تَخَافِي لأَنَّكِ لاَ تَخْزَيْنَ، وَلاَ تَخْجَلِي لأَنَّكِ لاَ تَسْتَحِينَ. فَإِنَّكِ تَنْسَيْنَ خِزْيَ صَبَاكِ، وَعَارُ تَرَمُّلِكِ لاَ تَذْكُرِينَهُ بَعْدُ.
  {
    book_id: 23, chapter: 54, verse: 4,
    words: [
      {
        ar_pos: 10, ar_word: 'تَسْتَحِينَ', orig_pos: 7, orig_surface: 'תַחְפִּירִי', orig_word: 'חָפֵר',
        strongs_id: 'H2659', morph_pos: 'verb_finite', orig_morphology: 'HVhi2fs',
        source: 'oshb_wlc', locator: 'OSHB:B23.C54.V4.w7', relation_type: 'direct_translation'
      },
      {
        ar_pos: 12, ar_word: 'تَنْسَيْنَ', orig_pos: 11, orig_surface: 'תִּשְׁכָּחִי', orig_word: 'שָׁכַח',
        strongs_id: 'H7911', morph_pos: 'verb_finite', orig_morphology: 'HVqi2fs',
        source: 'oshb_wlc', locator: 'OSHB:B23.C54.V4.w11', relation_type: 'direct_translation'
      },
      {
        ar_pos: 14, ar_word: 'صَبَاكِ', orig_pos: 10, orig_surface: 'עֲלוּמַיִךְ', orig_word: 'עֲלוּמִים',
        strongs_id: 'H5934', morph_pos: 'noun_with_suffix', orig_morphology: 'HNcmpc/Sp2fs',
        source: 'oshb_wlc', locator: 'OSHB:B23.C54.V4.w10', relation_type: 'direct_translation'
      },
      {
        ar_pos: 16, ar_word: 'تَرَمُّلِكِ', orig_pos: 13, orig_surface: 'אַלְמְנוּתַיִךְ', orig_word: 'אַלְמָנוּת',
        strongs_id: 'H488', morph_pos: 'noun_with_suffix', orig_morphology: 'HNcfsc/Sp2fs',
        source: 'oshb_wlc', locator: 'OSHB:B23.C54.V4.w13', relation_type: 'direct_translation'
      },
      {
        ar_pos: 18, ar_word: 'تَذْكُرِينَهُ', orig_pos: 15, orig_surface: 'תִזְכְּרִי', orig_word: 'זָכַר',
        strongs_id: 'H2142', morph_pos: 'verb_finite', orig_morphology: 'HVqi2fs',
        source: 'oshb_wlc', locator: 'OSHB:B23.C54.V4.w15', relation_type: 'direct_translation'
      }
    ]
  },

  // Isaiah 60:5
  // Hebrew: אָז תִּרְאִי וְנָהַרְתְּ וּפָחַד וְרָחַב לְבָבֵךְ כִּי־יֵהָפֵךְ עָלַיִךְ הֲמוֹן יָם חֵיל גּוֹיִם יָבֹא לָךְ׃
  // AVD: حِينَئِذٍ تَنْظُرِينَ وَتُنِيرِينَ وَيَخْفُقُ قَلْبُكِ وَيَتَّسِعُ، لأَنَّهُ تَتَحَوَّلُ إِلَيْكِ ثَرْوَةُ الْبَحْرِ، وَيَأْتِي إِلَيْكِ غِنَى الأُمَمِ.
  {
    book_id: 23, chapter: 60, verse: 5,
    words: [
      {
        ar_pos: 2, ar_word: 'تَنْظُرِينَ', orig_pos: 2, orig_surface: 'תִּרְאִי', orig_word: 'רָאָה',
        strongs_id: 'H7200', morph_pos: 'verb_finite', orig_morphology: 'HVqi2fs',
        source: 'oshb_wlc', locator: 'OSHB:B23.C60.V5.w2', relation_type: 'direct_translation'
      },
      {
        ar_pos: 3, ar_word: 'وَتُنِيرِينَ', orig_pos: 3, orig_surface: 'וְנָהַרְתְּ', orig_word: 'נָהַר',
        strongs_id: 'H5102', morph_pos: 'verb_finite', orig_morphology: 'HC/Vqq2fs',
        source: 'oshb_wlc', locator: 'OSHB:B23.C60.V5.w3', relation_type: 'direct_translation'
      },
      {
        ar_pos: 4, ar_word: 'وَيَخْفُقُ', orig_pos: 4, orig_surface: 'וּפָחַד', orig_word: 'פָּחַד',
        strongs_id: 'H6342', morph_pos: 'verb_finite', orig_morphology: 'HC/Vqq3ms',
        source: 'oshb_wlc', locator: 'OSHB:B23.C60.V5.w4', relation_type: 'direct_translation'
      },
      {
        ar_pos: 6, ar_word: 'وَيَتَّسِعُ', orig_pos: 5, orig_surface: 'וְרָחַב', orig_word: 'רָחַב',
        strongs_id: 'H7337', morph_pos: 'verb_finite', orig_morphology: 'HC/Vqq3ms',
        source: 'oshb_wlc', locator: 'OSHB:B23.C60.V5.w5', relation_type: 'direct_translation'
      },
      {
        ar_pos: 14, ar_word: 'غِنَى', orig_pos: 12, orig_surface: 'חֵיל', orig_word: 'חַיִל',
        strongs_id: 'H2428', morph_pos: 'noun', orig_morphology: 'HNcmsc',
        source: 'oshb_wlc', locator: 'OSHB:B23.C60.V5.w12', relation_type: 'direct_translation'
      }
    ]
  },

  // Jeremiah 52:21
  // Hebrew: וְהָעַמּוּדִים שְׁמֹנֶה עֶשְׂרֵה אַמָּה קוֹמָה הָעַמֻּד הָאֶחָד וְחוּט שְׁתֵּים־עֶשְׂרֵה אַמָּה יְסֻבֶּנּוּ וְעָבְיוֹ אַרְבַּע אֶצְבָּעוֹת נָבוּב׃
  // AVD: أَمَّا الْعَمُودَانِ، فَكَانَ طُولُ الْعَمُودِ الْوَاحِدِ ثَمَانِيَ عَشْرَةَ ذِرَاعًا، وَخَيْطٌ اثْنَتَا عَشْرَةَ ذِرَاعًا يُحِيطُ بِهِ، وَغِلَظُهُ أَرْבَعُ أَصَابِعَ، وَهُوَ أَجْوَفُ.
  {
    book_id: 24, chapter: 52, verse: 21,
    words: [
      {
        ar_pos: 14, ar_word: 'يُحِيطُ', orig_pos: 10, orig_surface: 'יְסֻבֶּנּוּ', orig_word: 'סָבַב',
        strongs_id: 'H5437', morph_pos: 'verb_finite', orig_morphology: 'HVqi3ms/Sp3ms',
        source: 'oshb_wlc', locator: 'OSHB:B24.C52.V21.w10', relation_type: 'direct_translation'
      },
      {
        ar_pos: 16, ar_word: 'وَغِلَظُهُ', orig_pos: 11, orig_surface: 'וְעָבְיוֹ', orig_word: 'עֳבִי',
        strongs_id: 'H5672', morph_pos: 'noun_with_suffix', orig_morphology: 'HC/Ncmsc/Sp3ms',
        source: 'oshb_wlc', locator: 'OSHB:B24.C52.V21.w11', relation_type: 'compound_phrase'
      },
      {
        ar_pos: 20, ar_word: 'أَجْوَفُ', orig_pos: 14, orig_surface: 'נָבוּב', orig_word: 'נָבַב',
        strongs_id: 'H5033', morph_pos: 'adjective', orig_morphology: 'HAamsa',
        source: 'oshb_wlc', locator: 'OSHB:B24.C52.V21.w14', relation_type: 'direct_translation'
      }
    ]
  }
];

let sql = 'BEGIN TRANSACTION;\n';

for (const group of restorations) {
  for (const w of group.words) {
    sql += `
    UPDATE word_mappings
    SET orig_word_position = ${w.orig_pos},
        orig_surface = '${w.orig_surface}',
        orig_word = '${w.orig_word}',
        strongs_id = '${w.strongs_id}',
        morph_pos = '${w.morph_pos}',
        orig_morphology = '${w.orig_morphology}',
        morph_source = '${w.source}',
        verified_locator = '${w.locator}',
        relation_type = '${w.relation_type}',
        grammar_notes = 'تم استعادة الارتباط المعجمي والتصريفي الأصيل في الإصدار 332'
    WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${group.book_id} AND chapter_num = ${group.chapter} AND verse_num = ${group.verse})
      AND ar_word_position = ${w.ar_pos};

    -- Ensure entry in word_mapping_strongs
    INSERT OR REPLACE INTO word_mapping_strongs (
      mapping_id, strongs_id, link_order, link_role, orig_component,
      orig_word_position, orig_morphology, morph_source
    ) VALUES (
      (SELECT id FROM word_mappings WHERE verse_id = (SELECT id FROM verses WHERE book_id = ${group.book_id} AND chapter_num = ${group.chapter} AND verse_num = ${group.verse}) AND ar_word_position = ${w.ar_pos}),
      '${w.strongs_id}', 1, 'primary', '${w.orig_surface}',
      ${w.orig_pos}, '${w.orig_morphology}', '${w.source}'
    );
    `;
  }
}

sql += 'COMMIT;\n';

runSql(sql);
console.log('Successfully restored falsely labeled content words across the sample!');
