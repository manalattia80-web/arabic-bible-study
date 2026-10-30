const child = require('child_process');

function q(sql) {
  return child.execFileSync('sqlite_dist\\sqlite3.exe', ['mobile/assets/bible_study.db', sql]).toString().trim();
}

console.log('--- Applying Precise Philological Repairs for 2 Kings 5:1, Ezra 7:21, Matthew 22:30 ---');

// =========================================================================
// 1. 2 KINGS 5:1
// =========================================================================
console.log('Fixing 2 Kings 5:1...');

// w4 «جَيْشِ» -> צְבָא (H6635, w3, HNcmsc/HNcmsa)
q(`
  UPDATE word_mappings
  SET orig_word = 'צָבָא',
      orig_surface = 'צְבָ֨א',
      strongs_id = 'H6635',
      orig_word_position = 3,
      morph_pos = 'noun',
      orig_morphology = 'HNcmsa',
      verified_locator = 'OSHB:B12.C5.V1.w3',
      grammar_notes = 'اسم مذكر عبري צְבָא (جيش/جند) في التركيب الإضافي שַׂר־צְבָא (رئيس جيش).'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 4;
`);

// w13 «لأَنَّهُ» -> כִּי (H3588, w13)
q(`
  UPDATE word_mappings
  SET orig_word = 'כִּי',
      orig_surface = 'כִּֽי־',
      strongs_id = 'H3588',
      orig_word_position = 13,
      morph_pos = 'conjunction',
      orig_morphology = 'HC',
      verified_locator = 'OSHB:B12.C5.V1.w13',
      grammar_notes = 'أداة تعليل وسبب عبرية كִּי (لأن).'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 13;
`);

// w14 «عَنْ» & w15 «يَدِهِ» -> בּוֹ (H9003, w14)
q(`
  UPDATE word_mappings
  SET orig_word = 'בְּ',
      orig_surface = 'בֹ֛ו',
      strongs_id = 'H9003',
      orig_word_position = 14,
      morph_pos = 'preposition',
      orig_morphology = 'HR/Sp3ms',
      verified_locator = 'OSHB:B12.C5.V1.w14',
      relation_type = 'compound_phrase',
      grammar_notes = 'شبه الجملة العبرية «בוֹ» (به / بواسطته) ترجمها الفانديك تعبيرياً بالمركب «عَنْ يَدِهِ».'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 14;
`);

q(`
  UPDATE word_mappings
  SET orig_word = 'בְּ',
      orig_surface = 'בֹ֛ו',
      strongs_id = 'H9003',
      orig_word_position = 14,
      morph_pos = 'preposition',
      orig_morphology = 'HR/Sp3ms',
      verified_locator = 'OSHB:B12.C5.V1.w14',
      relation_type = 'compound_phrase',
      grammar_notes = 'الكلمة الثانية من المركب العربي «عَنْ يَدِهِ» المترجم عن شبه الجملة العبرية «בוֹ».'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 15;
`);

// w16 «أَعْطَى» -> נָתַן (H5414, w15)
q(`
  UPDATE word_mappings
  SET orig_word_position = 15,
      verified_locator = 'OSHB:B12.C5.V1.w15'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 16;
`);

// w17 «الرَّبُّ» -> יְהוָה (H3068, w16)
q(`
  UPDATE word_mappings
  SET orig_word = 'יְהוָה',
      orig_surface = 'יְהוָ֥ה',
      strongs_id = 'H3068',
      orig_word_position = 16,
      morph_pos = 'proper_noun',
      orig_morphology = 'HNp',
      verified_locator = 'OSHB:B12.C5.V1.w16',
      grammar_notes = 'اسم الجلالة الأقدس יְהוָה فاعل الفعل نَتَن (أعطى الرب).'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 12 AND chapter_num = 5 AND verse_num = 1)
    AND ar_word_position = 17;
`);

// =========================================================================
// 2. EZRA 7:21
// =========================================================================
console.log('Fixing Ezra 7:21...');

// w1 «وَمِنِّي» -> וּמִנִּי (H4481, w1)
q(`
  UPDATE word_mappings
  SET orig_word = 'מִן',
      orig_surface = 'וּ֠מִנִּי',
      strongs_id = 'H4481',
      orig_word_position = 1,
      morph_pos = 'preposition',
      orig_morphology = 'AC/R/Sp1cs',
      verified_locator = 'OSHB:B15.C7.V21.w1',
      grammar_notes = 'المركب الآرامي الافتتاحي וּמִנִּי (حرف عطف + حرف جر מִן + ضمير المتكلم ياء).'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
    AND ar_word_position = 1;
`);

// w17 «يَطْلُبُهُ» & w18 «مِنْكُمْ» -> יִשְׁאֲלֶנְכוֹן (H7593, w15)
q(`
  UPDATE word_mappings
  SET orig_word = 'שְׁאֵל',
      orig_surface = 'יִ֠שְׁאֲלֶנְכֹון',
      strongs_id = 'H7593',
      orig_word_position = 15,
      morph_pos = 'verb',
      orig_morphology = 'AVqi3ms/Sp2mp',
      verified_locator = 'OSHB:B15.C7.V21.w15',
      relation_type = 'compound_phrase',
      grammar_notes = 'فعل آرامي שְׁאַל في صيغة المضارع متصل به ضمير جمع المخاطبين כוֹן (يطلبُ منكم).'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
    AND ar_word_position = 17;
`);

q(`
  UPDATE word_mappings
  SET orig_word = 'שְׁאֵל',
      orig_surface = 'יִ֠שְׁאֲלֶנְכֹון',
      strongs_id = 'H7593',
      orig_word_position = 15,
      morph_pos = 'verb',
      orig_morphology = 'AVqi3ms/Sp2mp',
      verified_locator = 'OSHB:B15.C7.V21.w15',
      relation_type = 'compound_phrase',
      grammar_notes = 'ترجمة للضمير المتصل بجمع المخاطبين «־ֶנְכוֹן» في الفعل الآرامي «יִשְׁאֲלֶנְכוֹן».'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 15 AND chapter_num = 7 AND verse_num = 21)
    AND ar_word_position = 18;
`);

// =========================================================================
// 3. MATTHEW 22:30
// =========================================================================
console.log('Fixing Matthew 22:30...');

// Update text_original to SBLGNT while recording TR in grammar notes
// SBLGNT: ἐν γὰρ τῇ ἀναστάσει οὔτε γαμοῦσιν οὔτε γαμίζονται, ἀλλ’ ὡς ἄγγελοι ἐν τῷ οὐρανῷ εἰσιν.
q(`
  UPDATE verses
  SET text_original = 'ἐν γὰρ τῇ ἀναστάσει οὔτε γαμοῦσιν οὔτε γαμίζονται, ἀλλ᾽ ὡς ἄγγελοι τοῦ Θεοῦ ἐν τῷ οὐρανῷ εἰσιν.'
  WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30;
`);

// w1 «لأَنَّهُمْ» -> γάρ (G1063, w2)
q(`
  UPDATE word_mappings
  SET orig_word_position = 2,
      verified_locator = 'SBLGNT:B40.C22.V30.w2'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 1;
`);

// w2 «فِي» -> ἐν (G1722, w1)
q(`
  UPDATE word_mappings
  SET orig_word = 'ἐν',
      orig_surface = 'ἐν',
      strongs_id = 'G1722',
      orig_word_position = 1,
      morph_pos = 'preposition',
      orig_morphology = 'P- --------',
      verified_locator = 'SBLGNT:B40.C22.V30.w1'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 2;
`);

// w3 «الْقِيَامَةِ» -> ἀναστάσει (G386, w4)
q(`
  UPDATE word_mappings
  SET orig_word_position = 4,
      verified_locator = 'SBLGNT:B40.C22.V30.w4'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 3;
`);

// w4 «لاَ» -> οὔτε (G3777, w5)
q(`
  UPDATE word_mappings
  SET orig_word = 'οὔτε',
      orig_surface = 'οὔτε',
      strongs_id = 'G3777',
      orig_word_position = 5,
      morph_pos = 'conjunction',
      orig_morphology = 'C- --------',
      verified_locator = 'SBLGNT:B40.C22.V30.w5',
      morph_source = 'morphgnt_sblgnt',
      verified_source = 'morphgnt_sblgnt'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 4;
`);

// w5 «يُزَوِّجُونَ» -> γαμοῦσιν (G1060, w6)
q(`
  UPDATE word_mappings
  SET orig_word = 'γαμέω',
      orig_surface = 'γαμοῦσιν',
      strongs_id = 'G1060',
      orig_word_position = 6,
      morph_pos = 'verb',
      orig_morphology = 'V- 3PAI-P--',
      verified_locator = 'SBLGNT:B40.C22.V30.w6'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 5;
`);

// w6 «وَلاَ» -> οὔτε (G3777, w7)
q(`
  UPDATE word_mappings
  SET orig_word = 'οὔτε',
      orig_surface = 'οὔτε',
      strongs_id = 'G3777',
      orig_word_position = 7,
      morph_pos = 'conjunction',
      orig_morphology = 'C- --------',
      verified_locator = 'SBLGNT:B40.C22.V30.w7'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 6;
`);

// w7 «يَتَزَوَّجُونَ» -> γαμίζονται (G1061, w8)
q(`
  UPDATE word_mappings
  SET orig_word = 'γαμίζω',
      orig_surface = 'γαμίζονται',
      strongs_id = 'G1061',
      orig_word_position = 8,
      morph_pos = 'verb',
      orig_morphology = 'V- 3PPI-P--',
      verified_locator = 'SBLGNT:B40.C22.V30.w8',
      grammar_notes = 'الفعل المبني للمجهول γαμίζονται في طبعة SBLGNT النقدية (G1061)، وتقابله في النص المستلم (TR) صيغة ἐκγαμίζονται.'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 7;
`);

// w8 «بَلْ» -> ἀλλ᾽ (G235, w9)
q(`
  UPDATE word_mappings
  SET orig_word_position = 9,
      verified_locator = 'SBLGNT:B40.C22.V30.w9'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 8;
`);

// w9 «يَكُونُونَ» -> εἰσίν (G1510, w16)
q(`
  UPDATE word_mappings
  SET orig_word_position = 16,
      verified_locator = 'SBLGNT:B40.C22.V30.w16'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 9;
`);

// w10 «كَمَلاَئِكَةِ» -> ὡς ἄγγελοι (G5613, w10-w11)
q(`
  UPDATE word_mappings
  SET orig_word_position = 10,
      verified_locator = 'SBLGNT:B40.C22.V30.w10'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 10;
`);

// w11 «اللهِ» -> θεοῦ (G2316, w13)
q(`
  UPDATE word_mappings
  SET orig_word_position = 13,
      verified_locator = 'SBLGNT:B40.C22.V30.w13'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 11;
`);

// w12 «فِي» -> ἐν (G1722, w14)
q(`
  UPDATE word_mappings
  SET orig_word_position = 14,
      verified_locator = 'SBLGNT:B40.C22.V30.w14'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 12;
`);

// w13 «السَّمَاءِ» -> οὐρανῷ (G3772, w15)
q(`
  UPDATE word_mappings
  SET orig_word_position = 15,
      verified_locator = 'SBLGNT:B40.C22.V30.w15'
  WHERE verse_id = (SELECT id FROM verses WHERE book_id = 40 AND chapter_num = 22 AND verse_num = 30)
    AND ar_word_position = 13;
`);

console.log('--- Repairs Complete! Running synchronization of primary word_mapping_strongs ---');

// Re-synchronize primary word_mapping_strongs
q(`
  UPDATE word_mapping_strongs
  SET orig_word_position = (SELECT wm.orig_word_position FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      strongs_id = (SELECT wm.strongs_id FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      orig_morphology = (SELECT wm.orig_morphology FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      morph_source = (SELECT wm.morph_source FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id),
      orig_component = (SELECT wm.orig_surface FROM word_mappings wm WHERE wm.id = word_mapping_strongs.mapping_id)
  WHERE link_role = 'primary'
    AND mapping_id IN (
      SELECT id FROM word_mappings 
      WHERE verse_id IN (
        SELECT id FROM verses 
        WHERE (book_id=12 AND chapter_num=5 AND verse_num=1)
           OR (book_id=15 AND chapter_num=7 AND verse_num=21)
           OR (book_id=40 AND chapter_num=22 AND verse_num=30)
      )
    );
`);

console.log('All changes applied and synchronized!');
