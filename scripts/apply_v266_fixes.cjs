const { execFileSync } = require('child_process');
const path = require('path');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

function runSql(sql) {
  execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
}

console.log('Starting v1.0.266 specific fixes...');

// 1. Deut 1:45
// Arabic text: فَرَجَعْتُمْ وَبَكَيْتُمْ أَمَامَ الرَّبِّ، وَلَمْ يَسْمَعِ الرَّبُّ لِصَوْتِكُمْ وَلاَ أَصْغَى إِلَيْكُمْ.
// Hebrew: וַתָּשֻׁ֥בוּ וַתִּבְכּ֖וּ לִפְנֵ֣י יְהוָ֑ה וְلֹֽא־שָׁמַ֤ע יְהוָה֙ בְּקֹ֣לְכֶ֔ם וְלֹ֥א הֶאֱזִ֖ין אֲלֵיכֶֽם׃
const deut1_45 = q("SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 1 AND verse_num = 45;")[0];
if (deut1_45) {
  console.log(`Fixing Deut 1:45 (verse_id: ${deut1_45.id})...`);
  runSql(`
    DELETE FROM word_mappings WHERE verse_id = '${deut1_45.id}';
    INSERT INTO word_mappings (id, verse_id, ar_word, orig_word, orig_word_lang, strongs_id, ar_word_position, orig_word_position, is_verified, relation_type, grammar_notes) VALUES
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'فَرَجَعْتُمْ', 'שׁוּב', 'hebrew', 'H7725', 1, 1, 1, 'verb', 'فعل ماض عبري וַתָּשֻׁבוּ'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'وَبَكَيْتُمْ', 'בָּכָה', 'hebrew', 'H1058', 2, 2, 1, 'verb', 'فعل ماض عبري וַתִּבְכּוּ'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'أَمَامَ', 'פָּנִים', 'hebrew', 'H6440', 3, 3, 1, 'preposition', 'ظرف مكان عبري לִפְנֵי'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'الرَّبِّ،', 'יְהֹוָה', 'hebrew', 'H3068', 4, 4, 1, 'proper_noun', 'اسم الجلالة יְהוָה'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'وَلَمْ', 'לֹא', 'hebrew', 'H3808', 5, 5, 1, 'negative_particle', 'أداة نفي וְלֹא'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'يَسْمَعِ', 'שָׁמַע', 'hebrew', 'H8085', 6, 6, 1, 'verb', 'فعل ماض عبري שָׁמַע'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'الرَّبُّ', 'יְהֹוָה', 'hebrew', 'H3068', 7, 7, 1, 'proper_noun', 'اسم الجلالة יְהוָה'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'لِصَوْتِكُمْ', 'קוֹל', 'hebrew', 'H6963', 8, 8, 1, 'noun', 'اسم عبري בְּקֹלְכֶם'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'وَلاَ', 'לֹא', 'hebrew', 'H3808', 9, 9, 1, 'negative_particle', 'أداة عطف ونفي וְלֹא'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'أَصْغَى', 'אָזַן', 'hebrew', 'H238', 10, 10, 1, 'verb', 'فعل أصغى عبري הֶאֱזִין (Hiphil)'),
    (lower(hex(randomblob(16))), '${deut1_45.id}', 'إِلَيْكُمْ.', 'אֵל', 'hebrew', 'H413', 11, 11, 1, 'preposition', 'حرف جر عبري אֲלֵיכֶם');
  `);
}

// 2. Num 5:3
// Arabic text: الذَّكَرَ وَالأُنْثَى تَنْفُونَ. إِلَى خَارِجِ الْمَحَلَّةِ تَنْفُونَهُمْ لِكَيْلاَ يُنَجِّسُوا مَحَلاَّتِهِمْ حَيْثُ أَنَا سَاكِنٌ فِي وَسَطِهِمْ».
// Hebrew: מִזָּכָ֤ר עַד־נְקֵבָה֙ תְּשַׁלֵּ֔חוּ אֶל־מִח֥וּץ לַֽמַּחֲנֶ֖ה תְּשַׁלְּח֑וּם וְלֹ֤א יְטַמְּאוּ֙ אֶת־מַ֣חֲנֵיהֶ֔ם אֲשֶׁ֥ר אֲנִ֖י שֹׁכֵ֥ן בְּתֹוכָֽם׃
const num5_3 = q("SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 5 AND verse_num = 3;")[0];
if (num5_3) {
  console.log(`Fixing Num 5:3 (verse_id: ${num5_3.id})...`);
  runSql(`
    DELETE FROM word_mappings WHERE verse_id = '${num5_3.id}';
    INSERT INTO word_mappings (id, verse_id, ar_word, orig_word, orig_word_lang, strongs_id, ar_word_position, orig_word_position, is_verified, relation_type, grammar_notes) VALUES
    (lower(hex(randomblob(16))), '${num5_3.id}', 'الذَّكَرَ', 'זָכָר', 'hebrew', 'H2145', 1, 1, 1, 'noun', 'اسم عبري מִזָּכָר'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'وَالأُنْثَى', 'נְקֵבָה', 'hebrew', 'H5347', 2, 2, 1, 'noun', 'اسم عبري נְקֵבָה'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'تَنْفُونَ.', 'שָׁלַח', 'hebrew', 'H7971', 3, 3, 1, 'verb', 'فعل عبري תְּשַׁלֵּחוּ'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'إِلَى', 'אֵל', 'hebrew', 'H413', 4, 4, 1, 'preposition', 'حرف جر אֶל'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'خَارِجِ', 'מִחוּץ', 'hebrew', 'H2351', 5, 5, 1, 'noun', 'اسم عبري מִחוּץ'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'الْمَحَلَّةِ', 'מַחֲנֶה', 'hebrew', 'H4264', 6, 6, 1, 'noun', 'اسم عبري לַמַּחֲנֶה'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'تَنْفُونَهُمْ', 'שָׁלַח', 'hebrew', 'H7971', 7, 7, 1, 'verb', 'فعل مع ضمير תְּשַׁלְּחוּם'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'لِكَيْلاَ', '---', 'hebrew', null, 8, null, 1, 'negative_purpose_conjunction', 'أداة تعليل ونفي مركبة (لِكَيْ + لاَ) تقابل واو الغرض وأداة النفي العبرية (וְלֹא)'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'يُنَجِّسُوا', 'טָמֵא', 'hebrew', 'H2930', 9, 8, 1, 'verb', 'فعل مضارع عبري יְטַמְּאוּ (Piel)'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'مَحَلاَّتِهِمْ', 'מַחֲנֶה', 'hebrew', 'H4264', 10, 9, 1, 'noun', 'اسم عبري مضاف מַחֲנֵיהֶם'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'حَيْثُ', 'אֲשֶׁר', 'hebrew', 'H834', 11, 10, 1, 'relative_particle', 'اسم موصول ظرفي أصل عبري אֲשֶׁר'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'أَنَا', 'אֲנִי', 'hebrew', 'H589', 12, 11, 1, 'pronoun', 'ضمير متكلم عبري אֲנִי'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'سَاكِنٌ', 'שָׁכַן', 'hebrew', 'H7931', 13, 12, 1, 'participle', 'اسم فاعل عبري שֹׁכֵן'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'فِي', '---', 'hebrew', null, 14, null, 1, 'preposition_particle', 'باء الظرفية العبرية (בְּ) ملحقة صدراً بلفظ التوسط בְּתוֹכָם'),
    (lower(hex(randomblob(16))), '${num5_3.id}', 'وَسَطِهِمْ».', 'תָּוֶךְ', 'hebrew', 'H8432', 15, 13, 1, 'noun', 'اسم عبري בְּתוֹכָם');
  `);
}

// 3. Num 14:4
// Arabic text: فَقَالَ بَعْضُهُمْ لِبَعْضٍ: «نُقِيمُ رَئِيسًا وَنَرْجعُ إِلَى مِصْرَ».
// Hebrew: וַיֹּאמְר֖וּ אִ֣ישׁ אֶל־אָחִ֑יו נִתְּנָ֥ה רֹ֖אשׁ וְנָשׁ֥וּבָה מִצְרָֽיְמָה׃
const num14_4 = q("SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 14 AND verse_num = 4;")[0];
if (num14_4) {
  console.log(`Fixing Num 14:4 (verse_id: ${num14_4.id})...`);
  runSql(`
    DELETE FROM word_mappings WHERE verse_id = '${num14_4.id}';
    INSERT INTO word_mappings (id, verse_id, ar_word, orig_word, orig_word_lang, strongs_id, ar_word_position, orig_word_position, is_verified, relation_type, grammar_notes) VALUES
    (lower(hex(randomblob(16))), '${num14_4.id}', 'فَقَالَ', 'אָמַר', 'hebrew', 'H559', 1, 1, 1, 'verb', 'فعل عبري וַיֹּאמְרוּ'),
    (lower(hex(randomblob(16))), '${num14_4.id}', 'بَعْضُهُمْ', 'אִישׁ', 'hebrew', 'H376', 2, 2, 1, 'noun', 'لفظ عبري אִישׁ بمعنى كل واحد'),
    (lower(hex(randomblob(16))), '${num14_4.id}', 'لِبَعْضٍ:', 'אָח', 'hebrew', 'H251', 3, 3, 1, 'compound_reciprocal', 'تركيب تبادلي عبري (אֶל־אָחִיו - حرف جر مع أخيه) يقابله في العربية لبعض'),
    (lower(hex(randomblob(16))), '${num14_4.id}', '«نُقِيمُ', 'נָתַן', 'hebrew', 'H5414', 4, 4, 1, 'verb', 'فعل عبري נִתְּנָה نعيّن/نجعل'),
    (lower(hex(randomblob(16))), '${num14_4.id}', 'رَئِيسًا', 'רֹאשׁ', 'hebrew', 'H7218', 5, 5, 1, 'noun', 'اسم عبري רֹאשׁ رأس/قائد'),
    (lower(hex(randomblob(16))), '${num14_4.id}', 'وَنَرْجعُ', 'שׁוּב', 'hebrew', 'H7725', 6, 6, 1, 'verb', 'فعل عبري וְנָשׁוּבָה'),
    (lower(hex(randomblob(16))), '${num14_4.id}', 'إِلَى', 'אֵל', 'hebrew', 'H413', 7, null, 1, 'preposition_particle', 'مفهوم الوجهة من هاء الاتجاه الملحقة بـ מִצְרָיְמָה'),
    (lower(hex(randomblob(16))), '${num14_4.id}', 'مِصْرَ».', 'מִצְרַיִם', 'hebrew', 'H4714', 8, 7, 1, 'proper_noun', 'اسم علم مصر מִצְרָיְמָה');
  `);
}

// 4. Num 27:20
// Arabic text: وَاجْعَلْ مِنْ هَيْبَتِكَ عَلَيْهِ لِيَسْمَعَ لَهُ كُلُّ جَمَاعَةِ بَنِي إِسْرَائِيلَ،
// Hebrew: וְנָתַתָּ֥ה מֵהֹֽודְךָ֖ עָלָ֑יו לְמַ֣עַן יִשְׁמְע֔וּ כָּל־עֲדַ֖ת בְּנֵ֥י יִשְׂרָאֵֽל׃
const num27_20 = q("SELECT id FROM verses WHERE book_id = 4 AND chapter_num = 27 AND verse_num = 20;")[0];
if (num27_20) {
  console.log(`Fixing Num 27:20 (verse_id: ${num27_20.id})...`);
  runSql(`
    DELETE FROM word_mappings WHERE verse_id = '${num27_20.id}';
    INSERT INTO word_mappings (id, verse_id, ar_word, orig_word, orig_word_lang, strongs_id, ar_word_position, orig_word_position, is_verified, relation_type, grammar_notes) VALUES
    (lower(hex(randomblob(16))), '${num27_20.id}', 'وَاجْعَلْ', 'נָתַן', 'hebrew', 'H5414', 1, 1, 1, 'verb', 'فعل عبري וְנָתַתָּה'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'مِنْ', 'מִן', 'hebrew', 'H4480', 2, 2, 1, 'preposition', 'حرف جر מִן ملحق بـ מֵהוֹדְךָ'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'هَيْبَتِكَ', 'הוֹד', 'hebrew', 'H1935', 3, 2, 1, 'noun', 'اسم عبري הוֹד جلال/بهاء'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'عَلَيْهِ', 'עַל', 'hebrew', 'H5921', 4, 3, 1, 'preposition', 'حرف جر مع ضمير עָלָיו'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'لِيَسْمَعَ', 'שָׁמַע', 'hebrew', 'H8085', 5, 5, 1, 'purpose_verb', 'لام الغرض داخلة على الفعل المضارع تقابل لِمَعַן العبرية مع فعل السماع יִשְׁמְעוּ'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'لَهُ', '---', 'hebrew', null, 6, null, 1, 'implicit_referent', 'شبه جملة إيضاحية لتعدية فعل السماع بالعربية'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'كُلُّ', 'כֹּל', 'hebrew', 'H3605', 7, 6, 1, 'noun', 'اسم عبري כָּל־'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'جَمَاعَةِ', 'עֵדָה', 'hebrew', 'H5712', 8, 7, 1, 'noun', 'اسم عبري עֲדַת'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'بَنِي', 'בֵּן', 'hebrew', 'H1121', 9, 8, 1, 'noun', 'اسم عبري בְּנֵי'),
    (lower(hex(randomblob(16))), '${num27_20.id}', 'إِسْرَائِيلَ،', 'יִשְׂרָאֵל', 'hebrew', 'H3478', 10, 9, 1, 'proper_noun', 'اسم علم يִשְׂרָאֵל');
  `);
}

// 5. Deut 25:11
// Arabic text: «إِذَا تَخَاصَمَ رَجُلاَنِ، رَجُلٌ وَأَخُوهُ، وَتَقَدَّمَتِ امْرَأَةُ أَحَدِهِمَا لِكَيْ تُخَلِّصَ رَجُلَهَا مِنْ يَدِ ضَارِبِهِ، وَمَدَّتْ يَدَهَا وَأَمْسَكَتْ بِعَوْرَتِهِ،
// Hebrew: כִּֽי־יִנָּצ֨וּ אֲנָשִׁ֤ים יַחְדָּו֙ אִ֣ישׁ וְאָחִ֔יו וְקָֽרְבָה֙ אֵ֣שֶׁת הָֽאֶחָ֔ד לְהַצִּ֥יל אֶת־אִישָּׁ֖הּ מִיַּ֣ד מַכֵּ֑הוּ וְשָׁלְחָ֣ה יָדָ֔הּ וְהֶחֱזִ֖יקָה בִּמְבֻשָֽׁיו׃
const deut25_11 = q("SELECT id FROM verses WHERE book_id = 5 AND chapter_num = 25 AND verse_num = 11;")[0];
if (deut25_11) {
  console.log(`Fixing Deut 25:11 (verse_id: ${deut25_11.id})...`);
  runSql(`
    DELETE FROM word_mappings WHERE verse_id = '${deut25_11.id}';
    INSERT INTO word_mappings (id, verse_id, ar_word, orig_word, orig_word_lang, strongs_id, ar_word_position, orig_word_position, is_verified, relation_type, grammar_notes) VALUES
    (lower(hex(randomblob(16))), '${deut25_11.id}', '«إِذَا', 'כִּי', 'hebrew', 'H3588', 1, 1, 1, 'conjunction', 'أداة شرط عبرية כִּי־'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'تَخَاصَمَ', 'נָצָה', 'hebrew', 'H5327', 2, 2, 1, 'verb', 'فعل عبري יִנָּצוּ (Niphal)'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'رَجُلاَنِ،', 'אִישׁ', 'hebrew', 'H376', 3, 3, 1, 'noun', 'اسم جمع عبري אֲנָשִׁים יַחְדָּו'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'رَجُلٌ', 'אִישׁ', 'hebrew', 'H376', 4, 4, 1, 'noun', 'اسم عبري אִישׁ'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'وَأَخُوهُ،', 'אָח', 'hebrew', 'H251', 5, 5, 1, 'noun', 'اسم عبري וְאָחִיו'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'وَتَقَدَّمَتِ', 'קָרַב', 'hebrew', 'H7126', 6, 6, 1, 'verb', 'فعل عبري וְקָרְבָה'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'امْرَأَةُ', 'אִשָּׁה', 'hebrew', 'H802', 7, 7, 1, 'noun', 'اسم عبري אֵשֶׁת'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'أَحَدِهِمَا', 'אֶחָד', 'hebrew', 'H259', 8, 8, 1, 'numeral', 'اسم عدد عبري הָאֶחָד'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'لِكَيْ', '---', 'hebrew', null, 9, null, 1, 'purpose_conjunction', 'لام الغرض العبرية לְـ الملحقة بالمصدر לְהַצִּיל'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'تُخَلِّصَ', 'נָצַל', 'hebrew', 'H5337', 10, 9, 1, 'verb', 'مصدر ميمي عبري לְהַצִּיל (Hiphil)'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'رَجُلَهَا', 'אִישׁ', 'hebrew', 'H376', 11, 10, 1, 'noun', 'اسم عبري אִישָׁהּ'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'مِنْ', 'מִן', 'hebrew', 'H4480', 12, 11, 1, 'preposition', 'حرف جر מִן ملحق بـ מִיַּד'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'يَدِ', 'יָד', 'hebrew', 'H3027', 13, 11, 1, 'noun', 'اسم عبري יַד'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'ضَارِبِهِ،', 'נָכָה', 'hebrew', 'H5221', 14, 12, 1, 'participle', 'اسم فاعل عبري מַכֵּהוּ'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'وَمَدَّتْ', 'שָׁלַח', 'hebrew', 'H7971', 15, 13, 1, 'verb', 'فعل عبري וְשָׁלְחָה'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'يَدَهَا', 'יָד', 'hebrew', 'H3027', 16, 14, 1, 'noun', 'اسم عبري יָדָהּ'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'وَأَمْسَكَتْ', 'חָזַק', 'hebrew', 'H2388', 17, 15, 1, 'verb', 'فعل عبري וְהֶחֱזִיקָה'),
    (lower(hex(randomblob(16))), '${deut25_11.id}', 'بِعَوْرَتِهِ،', 'מְבוּשִׁים', 'hebrew', 'H4016', 18, 16, 1, 'noun', 'اسم عبري בִּמְבֻשָׁיו (H4016)');
  `);
}

// 6. Exo 1:14 pos 14
const exo1_14 = q("SELECT id FROM verses WHERE book_id = 2 AND chapter_num = 1 AND verse_num = 14;")[0];
if (exo1_14) {
  console.log(`Fixing Exo 1:14 word 14 orig_word_position (verse_id: ${exo1_14.id})...`);
  runSql(`
    UPDATE word_mappings 
    SET orig_word_position = 13 
    WHERE verse_id = '${exo1_14.id}' AND ar_word_position = 14;
  `);
}

// 7. Gen 2:10 positions
const gen2_10 = q("SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = 10;")[0];
if (gen2_10) {
  console.log(`Fixing Gen 2:10 positions (verse_id: ${gen2_10.id})...`);
  runSql(`
    DELETE FROM word_mappings WHERE verse_id = '${gen2_10.id}';
    INSERT INTO word_mappings (id, verse_id, ar_word, orig_word, orig_word_lang, strongs_id, ar_word_position, orig_word_position, is_verified, relation_type, grammar_notes) VALUES
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'وَكَانَ', '---', 'hebrew', null, 1, null, 1, 'auxiliary_copula', 'فعل ناقص رابط في الترجمة العربية'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'نَهْرٌ', 'נָהָר', 'hebrew', 'H5104', 2, 1, 1, 'noun', 'اسم عبري וְנָהָר'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'يَخْرُجُ', 'יֹצֵא', 'hebrew', 'H3318', 3, 2, 1, 'participle_predicate', 'اسم فاعل خبري عبري יֹצֵא'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'مِنْ', 'מִן', 'hebrew', 'H4480', 4, 3, 1, 'preposition', 'حرف جر عبري מִן ملحق صدراً بـ מֵעֵדֶן'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'عَدْنٍ', 'עֵדֶן', 'hebrew', 'H5731', 5, 3, 1, 'proper_noun', 'اسم علم عبري מֵעֵדֶן'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'لِيَسْقِيَ', 'שָׁקָה', 'hebrew', 'H8248', 6, 4, 1, 'verb', 'فعل عبري مصدري לְהַשְׁקוֹת'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'الْجَنَّةَ،', 'גַּן', 'hebrew', 'H1588', 7, 6, 1, 'noun', 'اسم عبري הַגָּן مسبوق بأداة المفعولية אֶת־'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'وَمِنْ', 'מִן', 'hebrew', 'H4480', 8, 7, 1, 'preposition', 'حرف جر عبري וּמִשָּׁם'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'هُنَاكَ', 'שָׁם', 'hebrew', 'H8033', 9, 7, 1, 'adverb', 'ظرف مكان عبري שָׁם في וּמִשָּׁם'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'يَنْقَسِمُ', 'פָּרַד', 'hebrew', 'H6504', 10, 8, 1, 'verb', 'فعل مضارع عبري יִפָּרֵד'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'فَيَصِيرُ', 'הָיָה', 'hebrew', 'H1961', 11, 9, 1, 'verb', 'فعل ماض تام عبري וְהָיָה'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'أَرْبَعَةَ', 'אַרְבַּע', 'hebrew', 'H702', 12, 10, 1, 'numeral', 'اسم عدد عبري לְאַרְבָּעָה'),
    (lower(hex(randomblob(16))), '${gen2_10.id}', 'رُؤُوسٍ:', 'רֹאשׁ', 'hebrew', 'H7218', 13, 11, 1, 'noun', 'اسم عبري רָאשִׁים');
  `);
}

console.log('All specific targeted fixes applied successfully.');
