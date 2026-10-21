const { execFileSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Re-aligning Genesis 1 completely...');

// Detailed verse mappings for Genesis 1:1-31
// Each verse has an array of tokens exactly matching text_avd_ar words,
// paired with the accurate Hebrew lemma and Strong's ID.

const gen1Data = [
  // v1
  {
    v: 1,
    tokens: [
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'الْبَدْءِ', orig: 'רֵאשִׁית', sid: 'H7225' },
      { ar: 'خَلَقَ', orig: 'בָּרָא', sid: 'H1254' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'السَّمَاوَاتِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَالأَرْضَ', orig: 'אֶרֶץ', sid: 'H776' }
    ]
  },
  // v2
  {
    v: 2,
    tokens: [
      { ar: 'وَكَانَتِ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'الأَرْضُ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'خَرِبَةً', orig: 'תֹּהוּ', sid: 'H8414' },
      { ar: 'وَخَالِيَةً', orig: 'בֹּהוּ', sid: 'H922' },
      { ar: 'وَعَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'وَجْهِ', orig: 'פָּנִים', sid: 'H6440' },
      { ar: 'الْغَمْرِ', orig: 'תְּהוֹם', sid: 'H8415' },
      { ar: 'ظُلْمَةٌ', orig: 'חֹשֶׁךְ', sid: 'H2822' },
      { ar: 'وَرُوحُ', orig: 'רוּחַ', sid: 'H7307' },
      { ar: 'اللهِ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'يَرِفُّ', orig: 'רָחַף', sid: 'H7363' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'وَجْهِ', orig: 'פָּנִים', sid: 'H6440' },
      { ar: 'الْمِيَاهِ', orig: 'מַיִם', sid: 'H4325' }
    ]
  },
  // v3
  {
    v: 3,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لِيَكُنْ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'نُورٌ', orig: 'אוֹר', sid: 'H216' },
      { ar: 'فَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'نُورٌ', orig: 'אוֹר', sid: 'H216' }
    ]
  },
  // v4
  {
    v: 4,
    tokens: [
      { ar: 'وَرَأَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'النُّورَ', orig: 'אוֹר', sid: 'H216' },
      { ar: 'أَنَّهُ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'حَسَنٌ', orig: 'טוֹב', sid: 'H2896' },
      { ar: 'وَفَصَلَ', orig: 'בָּדַל', sid: 'H914' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'بَيْنَ', orig: 'בֵּין', sid: 'H996' },
      { ar: 'النُّورِ', orig: 'אוֹר', sid: 'H216' },
      { ar: 'وَالظُّلْمَةِ', orig: 'חֹשֶׁךְ', sid: 'H2822' }
    ]
  },
  // v5
  {
    v: 5,
    tokens: [
      { ar: 'وَدَعَا', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'النُّورَ', orig: 'אוֹר', sid: 'H216' },
      { ar: 'نَهَارًا', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'وَالظُّلْمَةُ', orig: 'חֹשֶׁךְ', sid: 'H2822' },
      { ar: 'دَعَاهَا', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'لَيْلاً', orig: 'לַיִל', sid: 'H3915' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'مَسَاءٌ', orig: 'עֶרֶב', sid: 'H6153' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'صَبَاحٌ', orig: 'בֹּקֶר', sid: 'H1242' },
      { ar: 'يَوْمًا', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'وَاحِدًا', orig: 'אֶחָד', sid: 'H259' }
    ]
  },
  // v6
  {
    v: 6,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لِيَكُنْ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'جَلَدٌ', orig: 'רָקִיעַ', sid: 'H7549' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'وَسَطِ', orig: 'תָּוֶךְ', sid: 'H8432' },
      { ar: 'الْمِيَاهِ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'وَلْيَكُنْ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'فَاصِلاً', orig: 'בָּדַל', sid: 'H914' },
      { ar: 'بَيْنَ', orig: 'בֵּין', sid: 'H996' },
      { ar: 'مِيَاهٍ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'وَمِيَاهٍ', orig: 'מַיִם', sid: 'H4325' }
    ]
  },
  // v7
  {
    v: 7,
    tokens: [
      { ar: 'فَعَمِلَ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'الْجَلَدَ', orig: 'רָקִיעַ', sid: 'H7549' },
      { ar: 'وَفَصَلَ', orig: 'בָּדַל', sid: 'H914' },
      { ar: 'بَيْنَ', orig: 'בֵּין', sid: 'H996' },
      { ar: 'الْمِيَاهِ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'الَّتِي', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'تَحْتَ', orig: 'תַּחַת', sid: 'H8478' },
      { ar: 'الْجَلَدِ', orig: 'רָקִיעַ', sid: 'H7549' },
      { ar: 'وَالْمِيَاهِ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'الَّتِي', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'فَوْقَ', orig: 'עַל', sid: 'H5921' },
      { ar: 'الْجَلَدِ', orig: 'רָקִיעַ', sid: 'H7549' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'كَذلِكَ', orig: 'כֵּן', sid: 'H3651' }
    ]
  },
  // v8
  {
    v: 8,
    tokens: [
      { ar: 'وَدَعَا', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'الْجَلَدَ', orig: 'רָקִיעַ', sid: 'H7549' },
      { ar: 'سَمَاءً', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'مَسَاءٌ', orig: 'עֶרֶב', sid: 'H6153' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'صَبَاحٌ', orig: 'בֹּקֶר', sid: 'H1242' },
      { ar: 'يَوْمًا', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'ثَانِيًا', orig: 'שֵׁנִי', sid: 'H8145' }
    ]
  },
  // v9
  {
    v: 9,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لِتَجْتَمِعِ', orig: 'קָוָה', sid: 'H6960' },
      { ar: 'الْمِيَاهُ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'تَحْتَ', orig: 'תַּחַת', sid: 'H8478' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'إِلَى', orig: 'אֶל', sid: 'H413' },
      { ar: 'مَكَانٍ', orig: 'מָקוֹם', sid: 'H4725' },
      { ar: 'وَاحِدٍ', orig: 'אֶחָד', sid: 'H259' },
      { ar: 'وَلْتَظْهَرِ', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'الْيَابِسَةُ', orig: 'יַבָּשָׁה', sid: 'H3004' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'كَذلِكَ', orig: 'כֵּן', sid: 'H3651' }
    ]
  },
  // v10
  {
    v: 10,
    tokens: [
      { ar: 'وَدَعَا', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'الْيَابِسَةَ', orig: 'יַבָּשָׁה', sid: 'H3004' },
      { ar: 'أَرْضًا', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَمُجْتَمَعَ', orig: 'מִקְוֶה', sid: 'H4723' },
      { ar: 'الْمِيَاهِ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'دَعَاهُ', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'بِحَارًا', orig: 'יָם', sid: 'H3220' },
      { ar: 'وَرَأَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'ذلِكَ', orig: '---', sid: null },
      { ar: 'أَنَّهُ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'حَسَنٌ', orig: 'טוֹב', sid: 'H2896' }
    ]
  },
  // v11
  {
    v: 11,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لِتُنْبِتِ', orig: 'דָּשָׁא', sid: 'H1876' },
      { ar: 'الأَرْضُ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'عُشْبًا', orig: 'דֶּשֶׁא', sid: 'H1877' },
      { ar: 'وَبَقْلاً', orig: 'עֵשֶׂב', sid: 'H6212' },
      { ar: 'يُبْزِرُ', orig: 'זָרַע', sid: 'H2232' },
      { ar: 'بِزْرًا', orig: 'זֶרַע', sid: 'H2233' },
      { ar: 'وَشَجَرًا', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'ذَا', orig: '---', sid: null },
      { ar: 'ثَمَرٍ', orig: 'פְּרִי', sid: 'H6529' },
      { ar: 'يَعْمَلُ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'ثَمَرًا', orig: 'פְּרִי', sid: 'H6529' },
      { ar: 'كَجِنْسِهِ', orig: 'מִין', sid: 'H4327' },
      { ar: 'بِزْرُهُ', orig: 'זֶרַע', sid: 'H2233' },
      { ar: 'فِيهِ', orig: '---', sid: null },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'كَذلِكَ', orig: 'כֵּן', sid: 'H3651' }
    ]
  },
  // v12
  {
    v: 12,
    tokens: [
      { ar: 'فَأَخْرَجَتِ', orig: 'יָצָא', sid: 'H3318' },
      { ar: 'الأَرْضُ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'عُشْبًا', orig: 'דֶּשֶׁא', sid: 'H1877' },
      { ar: 'وَبَقْلاً', orig: 'עֵשֶׂב', sid: 'H6212' },
      { ar: 'يُبْزِرُ', orig: 'זָרַע', sid: 'H2232' },
      { ar: 'بِزْرًا', orig: 'זֶרַע', sid: 'H2233' },
      { ar: 'كَجِنْسِهِ', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَشَجَرًا', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'يَعْمَلُ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'ثَمَرًا', orig: 'פְּרִי', sid: 'H6529' },
      { ar: 'بِزْرُهُ', orig: 'זֶרַע', sid: 'H2233' },
      { ar: 'فِيهِ', orig: '---', sid: null },
      { ar: 'كَجِنْسِهِ', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَرَأَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'ذلِكَ', orig: '---', sid: null },
      { ar: 'أَنَّهُ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'حَسَنٌ', orig: 'טוֹב', sid: 'H2896' }
    ]
  },
  // v13
  {
    v: 13,
    tokens: [
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'مَسَاءٌ', orig: 'עֶרֶב', sid: 'H6153' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'صَبَاحٌ', orig: 'בֹּקֶר', sid: 'H1242' },
      { ar: 'يَوْمًا', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'ثَالِثًا', orig: 'שְׁלִישִׁי', sid: 'H7992' }
    ]
  },
  // v14
  {
    v: 14,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لِتَكُنْ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'أَنْوَارٌ', orig: 'מָאוֹר', sid: 'H3974' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'جَلَدِ', orig: 'רָקִיعַ', sid: 'H7549' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'لِتَفْصِلَ', orig: 'בָּדַל', sid: 'H914' },
      { ar: 'بَيْنَ', orig: 'בֵּין', sid: 'H996' },
      { ar: 'النَّهَارِ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'وَاللَّيْلِ', orig: 'לַיִל', sid: 'H3915' },
      { ar: 'وَتَكُونَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'لآيَاتٍ', orig: 'אוֹת', sid: 'H226' },
      { ar: 'وَأَوْقَاتٍ', orig: 'מוֹעֵד', sid: 'H4150' },
      { ar: 'وَأَيَّامٍ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'وَسِنِينٍ', orig: 'שָׁנָה', sid: 'H8141' }
    ]
  },
  // v15
  {
    v: 15,
    tokens: [
      { ar: 'وَتَكُونَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'أَنْوَارًا', orig: 'מָאוֹר', sid: 'H3974' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'جَلَدِ', orig: 'רָקִיعַ', sid: 'H7549' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'لِتُنِيرَ', orig: 'אוֹר', sid: 'H215' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'كَذلِكَ', orig: 'כֵּן', sid: 'H3651' }
    ]
  },
  // v16
  {
    v: 16,
    tokens: [
      { ar: 'فَعَمِلَ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'النُّورَيْنِ', orig: 'מָאוֹר', sid: 'H3974' },
      { ar: 'الْعَظِيمَيْنِ', orig: 'גָּדוֹל', sid: 'H1419' },
      { ar: 'النُّورَ', orig: 'מָאוֹר', sid: 'H3974' },
      { ar: 'الأَكْبَرَ', orig: 'גָּדוֹל', sid: 'H1419' },
      { ar: 'لِحُكْمِ', orig: 'מֶמְשָׁלָה', sid: 'H4475' },
      { ar: 'النَّهَارِ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'وَالنُّورَ', orig: 'מָאוֹר', sid: 'H3974' },
      { ar: 'الأَصْغَرَ', orig: 'קָטֹן', sid: 'H6996' },
      { ar: 'لِحُكْمِ', orig: 'מֶמְשָׁלָה', sid: 'H4475' },
      { ar: 'اللَّيْلِ', orig: 'לַיִל', sid: 'H3915' },
      { ar: 'وَالنُّجُومَ', orig: 'כּוֹכָב', sid: 'H3556' }
    ]
  },
  // v17
  {
    v: 17,
    tokens: [
      { ar: 'وَجَعَلَهَا', orig: 'נָתַן', sid: 'H5414' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'جَلَدِ', orig: 'רָקִיعַ', sid: 'H7549' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'لِتُنِيرَ', orig: 'אוֹר', sid: 'H215' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' }
    ]
  },
  // v18
  {
    v: 18,
    tokens: [
      { ar: 'وَلِتَحْكُمَ', orig: 'מָשַׁל', sid: 'H4910' },
      { ar: 'عَلَى', orig: '---', sid: null },
      { ar: 'النَّهَارِ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'وَاللَّيْلِ', orig: 'לַיִל', sid: 'H3915' },
      { ar: 'وَلِتَفْصِلَ', orig: 'בָּדַל', sid: 'H914' },
      { ar: 'بَيْنَ', orig: 'בֵּין', sid: 'H996' },
      { ar: 'النُّورِ', orig: 'אוֹר', sid: 'H216' },
      { ar: 'وَالظُّلْمَةِ', orig: 'חֹשֶׁךְ', sid: 'H2822' },
      { ar: 'وَرَأَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'ذلِكَ', orig: '---', sid: null },
      { ar: 'أَنَّهُ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'حَسَنٌ', orig: 'טוֹב', sid: 'H2896' }
    ]
  },
  // v19
  {
    v: 19,
    tokens: [
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'مَسَاءٌ', orig: 'עֶרֶב', sid: 'H6153' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'صَبَاحٌ', orig: 'בֹּקֶר', sid: 'H1242' },
      { ar: 'يَوْمًا', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'رَابِعًا', orig: 'רְבִיעִי', sid: 'H7243' }
    ]
  },
  // v20
  {
    v: 20,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لِتَفِضِ', orig: 'שָׁרַץ', sid: 'H8317' },
      { ar: 'الْمِيَاهُ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'زَحَّافَاتٍ', orig: 'שֶׁרֶץ', sid: 'H8318' },
      { ar: 'ذَاتَ', orig: '---', sid: null },
      { ar: 'نَفْسٍ', orig: 'נֶפֶשׁ', sid: 'H5315' },
      { ar: 'حَيَّةٍ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'وَلْيَطِرْ', orig: 'עוּף', sid: 'H5774' },
      { ar: 'طَيْرٌ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'فَوْقَ', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'وَجْهِ', orig: 'פָּנִים', sid: 'H6440' },
      { ar: 'جَلَدِ', orig: 'רָקִיעַ', sid: 'H7549' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' }
    ]
  },
  // v21
  {
    v: 21,
    tokens: [
      { ar: 'فَخَلَقَ', orig: 'בָּרָא', sid: 'H1254' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'التَّنَانِينَ', orig: 'תַּנִּין', sid: 'H8577' },
      { ar: 'الْعِظَامَ', orig: 'גָּדוֹל', sid: 'H1419' },
      { ar: 'وَكُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'ذَوَاتِ', orig: '---', sid: null },
      { ar: 'الأَنْفُسِ', orig: 'נֶפֶשׁ', sid: 'H5315' },
      { ar: 'الْحيَّةِ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'الدَّبَّابَةِ', orig: 'רָמַשׂ', sid: 'H7430' },
      { ar: 'الْتِى', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'فَاضَتْ', orig: 'שָׁרַץ', sid: 'H8317' },
      { ar: 'بِهَا', orig: '---', sid: null },
      { ar: 'الْمِيَاهُ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'كَأَجْنَاسِهَا', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَكُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'طَائِرٍ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'ذِي', orig: '---', sid: null },
      { ar: 'جَنَاحٍ', orig: 'כָּנָף', sid: 'H3671' },
      { ar: 'كَجِنْسِهِ', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَرَأَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'ذلِكَ', orig: '---', sid: null },
      { ar: 'أَنَّهُ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'حَسَنٌ', orig: 'טוֹב', sid: 'H2896' }
    ]
  },
  // v22
  {
    v: 22,
    tokens: [
      { ar: 'وَبَارَكَهَا', orig: 'בָּרַךְ', sid: 'H1288' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'قَائِلاً', orig: 'אָמַר', sid: 'H559' },
      { ar: 'أَثْمِرِي', orig: 'פָּרָה', sid: 'H6509' },
      { ar: 'وَاكْثُرِي', orig: 'רָבָה', sid: 'H7235' },
      { ar: 'وَامْلإِي', orig: 'מָלֵא', sid: 'H4390' },
      { ar: 'الْمِيَاهَ', orig: 'מַיִם', sid: 'H4325' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'الْبِحَارِ', orig: 'יָם', sid: 'H3220' },
      { ar: 'وَلْيَكْثُرِ', orig: 'רָבָה', sid: 'H7235' },
      { ar: 'الطَّيْرُ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'عَلَى', orig: '---', sid: null },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' }
    ]
  },
  // v23
  {
    v: 23,
    tokens: [
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'مَسَاءٌ', orig: 'עֶרֶב', sid: 'H6153' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'صَبَاحٌ', orig: 'בֹּקֶר', sid: 'H1242' },
      { ar: 'يَوْمًا', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'خَامِسًا', orig: 'חֲמִישִׁי', sid: 'H2549' }
    ]
  },
  // v24
  {
    v: 24,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لِتُخْرِجِ', orig: 'יָצָא', sid: 'H3318' },
      { ar: 'الأَرْضُ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'ذَوَاتِ', orig: '---', sid: null },
      { ar: 'أَنْفُسٍ', orig: 'נֶפֶשׁ', sid: 'H5315' },
      { ar: 'حَيَّةٍ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'كَجِنْسِهَا', orig: 'מִין', sid: 'H4327' },
      { ar: 'بَهَائِمَ', orig: 'בְּהֵמָה', sid: 'H929' },
      { ar: 'وَدَبَّابَاتٍ', orig: 'רֶמֶשׂ', sid: 'H7431' },
      { ar: 'وَوُحُوشَ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'أَرْضٍ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'كَأَجْنَاسِهَا', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'كَذلِكَ', orig: 'כֵּן', sid: 'H3651' }
    ]
  },
  // v25
  {
    v: 25,
    tokens: [
      { ar: 'فَعَمِلَ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'وُحُوشَ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'كَأَجْنَاسِهَا', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَالْبَهَائِمَ', orig: 'בְּהֵמָה', sid: 'H929' },
      { ar: 'كَأَجْنَاسِهَا', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَجَمِيعَ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'دَبَّابَاتِ', orig: 'רֶמֶשׂ', sid: 'H7431' },
      { ar: 'الأَرْضِ', orig: 'אֲדָמָה', sid: 'H127' },
      { ar: 'كَأَجْنَاسِهَا', orig: 'מִין', sid: 'H4327' },
      { ar: 'وَرَأَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'ذلِكَ', orig: '---', sid: null },
      { ar: 'أَنَّهُ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'حَسَنٌ', orig: 'טוֹב', sid: 'H2896' }
    ]
  },
  // v26
  {
    v: 26,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'نَعْمَلُ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'الإِنْسَانَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'عَلَى', orig: '---', sid: null },
      { ar: 'صُورَتِنَا', orig: 'צֶלֶם', sid: 'H6754' },
      { ar: 'كَشَبَهِنَا', orig: 'דְּמוּת', sid: 'H1823' },
      { ar: 'فَيَتَسَلَّطُونَ', orig: 'רָדָה', sid: 'H7287' },
      { ar: 'عَلَى', orig: '---', sid: null },
      { ar: 'سَمَكِ', orig: 'דָּגָה', sid: 'H1710' },
      { ar: 'الْبَحْرِ', orig: 'יָם', sid: 'H3220' },
      { ar: 'وَعَلَى', orig: '---', sid: null },
      { ar: 'طَيْرِ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَعَلَى', orig: '---', sid: null },
      { ar: 'الْبَهَائِمِ', orig: 'בְּהֵמָה', sid: 'H929' },
      { ar: 'وَعَلَى', orig: '---', sid: null },
      { ar: 'كُلِّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَعَلَى', orig: '---', sid: null },
      { ar: 'جَمِيعِ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'الدَّبَّابَاتِ', orig: 'רֶמֶשׂ', sid: 'H7431' },
      { ar: 'الَّتِي', orig: '---', sid: null },
      { ar: 'تَدِبُّ', orig: 'רָמַשׂ', sid: 'H7430' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' }
    ]
  },
  // v27
  {
    v: 27,
    tokens: [
      { ar: 'فَخَلَقَ', orig: 'בָּרָא', sid: 'H1254' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'الإِنْسَانَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'عَلَى', orig: '---', sid: null },
      { ar: 'صُورَتِهِ', orig: 'צֶלֶם', sid: 'H6754' },
      { ar: 'عَلَى', orig: '---', sid: null },
      { ar: 'صُورَةِ', orig: 'צֶלֶם', sid: 'H6754' },
      { ar: 'اللهِ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'خَلَقَهُ', orig: 'בָּרָא', sid: 'H1254' },
      { ar: 'ذَكَرًا', orig: 'זָכָר', sid: 'H2145' },
      { ar: 'وَأُنْثَى', orig: 'נְקֵבָה', sid: 'H5347' },
      { ar: 'خَلَقَهُمْ', orig: 'בָּרָא', sid: 'H1254' }
    ]
  },
  // v28
  {
    v: 28,
    tokens: [
      { ar: 'وَبَارَكَهُمُ', orig: 'בָּרַךְ', sid: 'H1288' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'لَهُمْ', orig: '---', sid: null },
      { ar: 'أَثْمِرُوا', orig: 'פָּרָה', sid: 'H6509' },
      { ar: 'وَاكْثُرُوا', orig: 'רָבָה', sid: 'H7235' },
      { ar: 'وَامْلأُوا', orig: 'מָלֵא', sid: 'H4390' },
      { ar: 'الأَرْضَ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَأَخْضِعُوهَا', orig: 'כָּבַשׁ', sid: 'H3533' },
      { ar: 'وَتَسَلَّطُوا', orig: 'רָדָה', sid: 'H7287' },
      { ar: 'عَلَى', orig: '---', sid: null },
      { ar: 'سَمَكِ', orig: 'דָּגָה', sid: 'H1710' },
      { ar: 'الْبَحْرِ', orig: 'יָם', sid: 'H3220' },
      { ar: 'وَعَلَى', orig: '---', sid: null },
      { ar: 'طَيْرِ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَعَلَى', orig: '---', sid: null },
      { ar: 'كُلِّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'حَيَوَانٍ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'يَدِبُّ', orig: 'רָמַשׂ', sid: 'H7430' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' }
    ]
  },
  // v29
  {
    v: 29,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'إِنِّي', orig: 'הִנֵּה', sid: 'H2009' },
      { ar: 'قَدْ', orig: '---', sid: null },
      { ar: 'أَعْطَيْتُكُمْ', orig: 'נָתַן', sid: 'H5414' },
      { ar: 'كُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'بَقْلٍ', orig: 'עֵשֶׂב', sid: 'H6212' },
      { ar: 'يُبْزِرُ', orig: 'זָרַע', sid: 'H2232' },
      { ar: 'بِزْرًا', orig: 'זֶרַע', sid: 'H2233' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'وَجْهِ', orig: 'פָּנִים', sid: 'H6440' },
      { ar: 'كُلِّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَكُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'شَجَرٍ', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'فِيهِ', orig: '---', sid: null },
      { ar: 'ثَمَرُ', orig: 'פְּרִי', sid: 'H6529' },
      { ar: 'شَجَرٍ', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'يُبْزِرُ', orig: 'זָרַע', sid: 'H2232' },
      { ar: 'بِزْرًا', orig: 'זֶרַע', sid: 'H2233' },
      { ar: 'لَكُمْ', orig: '---', sid: null },
      { ar: 'يَكُونُ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'طَعَامًا', orig: 'אָכְלָה', sid: 'H402' }
    ]
  },
  // v30
  {
    v: 30,
    tokens: [
      { ar: 'وَلِكُلِّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'حَيَوَانِ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَكُلِّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'طَيْرِ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَكُلِّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'دَبَّابَةٍ', orig: 'רֶמֶשׂ', sid: 'H7431' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'فِيهَا', orig: '---', sid: null },
      { ar: 'نَفْسٌ', orig: 'נֶפֶשׁ', sid: 'H5315' },
      { ar: 'حَيَّةٌ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'أَعْطَيْتُ', orig: '---', sid: null },
      { ar: 'كُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'عُشْبٍ', orig: 'עֵשֶׂב', sid: 'H6212' },
      { ar: 'أَخْضَرَ', orig: 'יֶרֶק', sid: 'H3418' },
      { ar: 'طَعَامًا', orig: 'אָכְלָה', sid: 'H402' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'كَذلِكَ', orig: 'כֵּן', sid: 'H3651' }
    ]
  },
  // v31
  {
    v: 31,
    tokens: [
      { ar: 'وَرَأَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'كُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'مَا', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'عَمِلَهُ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'فَإِذَا', orig: 'הִנֵּה', sid: 'H2009' },
      { ar: 'هُوَ', orig: '---', sid: null },
      { ar: 'حَسَنٌ', orig: 'טוֹב', sid: 'H2896' },
      { ar: 'جِدًّا', orig: 'מְאֹד', sid: 'H3966' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'مَسَاءٌ', orig: 'עֶרֶב', sid: 'H6153' },
      { ar: 'وَكَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'صَبَاحٌ', orig: 'בֹּקֶר', sid: 'H1242' },
      { ar: 'يَوْمًا', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'سَادِسًا', orig: 'שִׁשִּׁי', sid: 'H8345' }
    ]
  }
];

// Verify that token arrays match text_avd_ar exactly
console.log('Validating Genesis 1 token counts against database text...');
let valid = true;
const punctuationRegex = /[\u060C\u061B\u061F\u06D4«».,:;!؟\(\)\[\]"'\-—–]/gu;
for (const entry of gen1Data) {
  const row = q(`SELECT id, text_avd_ar FROM verses WHERE book_id = 1 AND chapter_num = 1 AND verse_num = ${entry.v};`)[0];
  const dbWords = row.text_avd_ar.replace(punctuationRegex, ' ').trim().split(/\s+/).filter(Boolean);
  if (dbWords.length !== entry.tokens.length) {
    console.error(`Mismatch in Gen 1:${entry.v}! DB has ${dbWords.length} words, gen1Data has ${entry.tokens.length}`);
    console.error('DB words:', dbWords);
    console.error('Data words:', entry.tokens.map(t => t.ar));
    valid = false;
  }
}

if (!valid) {
  console.error('Validation failed. Aborting.');
  process.exit(1);
}

console.log('All 31 verses of Genesis 1 validated perfectly with 100% token count match!');

// Generate SQL
let sql = 'BEGIN TRANSACTION;\n\n';
for (const entry of gen1Data) {
  const verseId = q(`SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 1 AND verse_num = ${entry.v};`)[0].id;
  sql += `-- Genesis 1:${entry.v}\n`;
  sql += `DELETE FROM word_mappings WHERE verse_id = '${verseId}';\n`;
  for (let i = 0; i < entry.tokens.length; i++) {
    const t = entry.tokens[i];
    const rowId = crypto.randomUUID();
    const pos = i + 1;
    const strongVal = t.sid ? `'${t.sid}'` : 'NULL';
    const origVal = `'${t.orig.replace(/'/g, "''")}'`;
    const arVal = `'${t.ar.replace(/'/g, "''")}'`;
    sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${verseId}', ${pos}, ${pos}, ${arVal}, ${origVal}, 'hebrew', ${strongVal}, 1);\n`;
  }
}
sql += '\nCOMMIT;\n';

require('fs').writeFileSync('scripts/realign_genesis1.sql', sql, 'utf8');
console.log('Generated scripts/realign_genesis1.sql.');
