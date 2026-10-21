const { execFileSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Generating Genesis 2 complete realignment...');

// Exact 25 verses data for Genesis 2
const gen2Data = [
  // v1
  {
    v: 1,
    tokens: [
      { ar: 'فَأُكْمِلَتِ', orig: 'כָּלָה', sid: 'H3615' },
      { ar: 'السَّمَاوَاتُ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَالأَرْضُ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَكُلُّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'جُنْدِهَا', orig: 'צָבָא', sid: 'H6635' }
    ]
  },
  // v2
  {
    v: 2,
    tokens: [
      { ar: 'وَفَرَغَ', orig: 'כָּלָה', sid: 'H3615' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'الْيَوْمِ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'السَّابعِ', orig: 'שְׁבִיעִי', sid: 'H7637' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'عَمَلِهِ', orig: 'מְלָאכָה', sid: 'H4399' },
      { ar: 'الَّذِي', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'عَمِلَ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'فَاسْتَرَاحَ', orig: 'שָׁבַת', sid: 'H7673' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'الْيَوْمِ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'السَّابعِ', orig: 'שְׁבִיעִי', sid: 'H7637' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'جَمِيعِ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'عَمَلِهِ', orig: 'מְלָאכָה', sid: 'H4399' },
      { ar: 'الَّذِي', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'عَمِلَ', orig: 'עָשָׂה', sid: 'H6213' }
    ]
  },
  // v3
  {
    v: 3,
    tokens: [
      { ar: 'وَبَارَكَ', orig: 'בָּרַךְ', sid: 'H1288' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'الْيَوْمَ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'السَّابعَ', orig: 'שְׁבִיעִי', sid: 'H7637' },
      { ar: 'وَقَدَّسَهُ', orig: 'קָדַשׁ', sid: 'H6942' },
      { ar: 'لأَنَّهُ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'فِيهِ', orig: '---', sid: null },
      { ar: 'اسْتَرَاحَ', orig: 'שָׁבַת', sid: 'H7673' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'جَمِيعِ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'عَمَلِهِ', orig: 'מְלָאכָה', sid: 'H4399' },
      { ar: 'الَّذِي', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'عَمِلَ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'اللهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'خَالِقًا', orig: 'בָּרָא', sid: 'H1254' }
    ]
  },
  // v4
  {
    v: 4,
    tokens: [
      { ar: 'هذِهِ', orig: 'אֵלֶּה', sid: 'H428' },
      { ar: 'مَبَادِئُ', orig: 'תּוֹלְדוֹת', sid: 'H8435' },
      { ar: 'السَّمَاوَاتِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَالأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'حِينَ', orig: '---', sid: null },
      { ar: 'خُلِقَتْ', orig: 'בָּרָא', sid: 'H1254' },
      { ar: 'يَوْمَ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'عَمِلَ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'الأَرْضَ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَالسَّمَاوَاتِ', orig: 'שָׁמַיִם', sid: 'H8064' }
    ]
  },
  // v5
  {
    v: 5,
    tokens: [
      { ar: 'كُلُّ', orig: 'כֹּל', sid: 'H3605' },
      { ar: 'شَجَرِ', orig: 'שִׂיחַ', sid: 'H7880' },
      { ar: 'الْبَرِّيَّةِ', orig: 'שָׂדֶה', sid: 'H7704' },
      { ar: 'لَمْ', orig: 'טֶרֶם', sid: 'H2962' },
      { ar: 'يَكُنْ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'بَعْدُ', orig: 'טֶרֶם', sid: 'H2962' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَكُلُّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'عُشْبِ', orig: 'עֵשֶׂב', sid: 'H6212' },
      { ar: 'الْبَرِّيَّةِ', orig: 'שָׂדֶה', sid: 'H7704' },
      { ar: 'لَمْ', orig: 'טֶרֶם', sid: 'H2962' },
      { ar: 'يَنْبُتْ', orig: 'צָمַח', sid: 'H6779' },
      { ar: 'بَعْدُ', orig: 'טֶרֶם', sid: 'H2962' },
      { ar: 'لأَنَّ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'الرَّبَّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهَ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لَمْ', orig: 'לֹא', sid: 'H3808' },
      { ar: 'يَكُنْ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'قَدْ', orig: 'دلالة نحوية تابعة للفعل', sid: null },
      { ar: 'أَمْطَرَ', orig: 'מָטַר', sid: 'H4305' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَلاَ', orig: 'دلالة نحوية للربط والنفي', sid: null },
      { ar: 'كَانَ', orig: 'אַיִן', sid: 'H369' },
      { ar: 'إِنْسَانٌ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'لِيَعْمَلَ', orig: 'עָבַד', sid: 'H5647' },
      { ar: 'الأَرْضَ', orig: 'אֲדָמָה', sid: 'H127' }
    ]
  },
  // v6
  {
    v: 6,
    tokens: [
      { ar: 'ثُمَّ', orig: '---', sid: null },
      { ar: 'كَانَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'ضَبَابٌ', orig: 'אֵד', sid: 'H108' },
      { ar: 'يَطْلَعُ', orig: 'עָלָה', sid: 'H5927' },
      { ar: 'مِنَ', orig: 'מִן', sid: 'H4480' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'وَيَسْقِي', orig: 'שָׁקָה', sid: 'H8248' },
      { ar: 'كُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'وَجْهِ', orig: 'פָּנִים', sid: 'H6440' },
      { ar: 'الأَرْضِ', orig: 'אֲדָמָה', sid: 'H127' }
    ]
  },
  // v7
  {
    v: 7,
    tokens: [
      { ar: 'وَجَبَلَ', orig: 'יָצַר', sid: 'H3335' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'تُرَابًا', orig: 'עָפָר', sid: 'H6083' },
      { ar: 'مِنَ', orig: 'מִן', sid: 'H4480' },
      { ar: 'الأَرْضِ', orig: 'אֲדָמָה', sid: 'H127' },
      { ar: 'وَنَفَخَ', orig: 'נָפַח', sid: 'H5301' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'أَنْفِهِ', orig: 'אַף', sid: 'H639' },
      { ar: 'نَسَمَةَ', orig: 'נְשָׁמָה', sid: 'H5397' },
      { ar: 'حَيَاةٍ', orig: 'חַי', sid: 'H2416' },
      { ar: 'فَصَارَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'آدَمُ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'نَفْسًا', orig: 'נֶפֶשׁ', sid: 'H5315' },
      { ar: 'حَيَّةً', orig: 'חַיָּה', sid: 'H2416' }
    ]
  },
  // v8
  {
    v: 8,
    tokens: [
      { ar: 'وَغَرَسَ', orig: 'נָטַע', sid: 'H5193' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'جَنَّةً', orig: 'גַּן', sid: 'H1588' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'عَدْنٍ', orig: 'עֵדֶן', sid: 'H5731' },
      { ar: 'شَرْقًا', orig: 'קֶדֶם', sid: 'H6924' },
      { ar: 'وَوَضَعَ', orig: 'שׂוּם', sid: 'H7760' },
      { ar: 'هُنَاكَ', orig: 'שָׁם', sid: 'H8033' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'الَّذِي', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'جَبَلَهُ', orig: 'יָצַר', sid: 'H3335' }
    ]
  },
  // v9
  {
    v: 9,
    tokens: [
      { ar: 'وَأَنْبَتَ', orig: 'צָמַח', sid: 'H6779' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'مِنَ', orig: 'מִן', sid: 'H4480' },
      { ar: 'الأَرْضِ', orig: 'אֲדָמָה', sid: 'H127' },
      { ar: 'كُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'شَجَرَةٍ', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'شَهِيَّةٍ', orig: 'חָמַד', sid: 'H2530' },
      { ar: 'لِلنَّظَرِ', orig: 'מַרְאֶה', sid: 'H4758' },
      { ar: 'وَجَيِّدَةٍ', orig: 'טוֹב', sid: 'H2896' },
      { ar: 'لِلأَكْلِ', orig: 'מַאֲכָל', sid: 'H3978' },
      { ar: 'وَشَجَرَةَ', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'الْحَيَاةِ', orig: 'חַי', sid: 'H2416' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'وَسَطِ', orig: 'תָּוֶךְ', sid: 'H8432' },
      { ar: 'الْجَنَّةِ', orig: 'גַּן', sid: 'H1588' },
      { ar: 'وَشَجَرَةَ', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'مَعْرِفَةِ', orig: 'דַּעַת', sid: 'H1847' },
      { ar: 'الْخَيْرِ', orig: 'טוֹב', sid: 'H2896' },
      { ar: 'وَالشَّرِّ', orig: 'רַע', sid: 'H7451' }
    ]
  },
  // v10
  {
    v: 10,
    tokens: [
      { ar: 'وَكَانَ', orig: 'יָצָא', sid: 'H3318' },
      { ar: 'نَهْرٌ', orig: 'נָהָר', sid: 'H5104' },
      { ar: 'يَخْرُجُ', orig: 'יָצָא', sid: 'H3318' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'عَدْنٍ', orig: 'עֵדֶן', sid: 'H5731' },
      { ar: 'لِيَسْقِيَ', orig: 'שָׁקָה', sid: 'H8248' },
      { ar: 'الْجَنَّةَ', orig: 'גַּן', sid: 'H1588' },
      { ar: 'وَمِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'هُنَاكَ', orig: 'שָׁם', sid: 'H8033' },
      { ar: 'يَفْتَرِقُ', orig: 'פָּרַד', sid: 'H6504' },
      { ar: 'فَيَصِيرُ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'أَرْبَعَةَ', orig: 'אַרְבַּע', sid: 'H702' },
      { ar: 'رُؤُوسٍ', orig: 'רֹאשׁ', sid: 'H7218' }
    ]
  },
  // v11
  {
    v: 11,
    tokens: [
      { ar: 'اِسْمُ', orig: 'שֵׁם', sid: 'H8034' },
      { ar: 'الْوَاحِدِ', orig: 'אֶחָד', sid: 'H259' },
      { ar: 'فِيشُونُ', orig: 'פִּישׁוֹן', sid: 'H6376' },
      { ar: 'وَهُوَ', orig: 'הוּא', sid: 'H1931' },
      { ar: 'الْمُحِيطُ', orig: 'סָבַב', sid: 'H5437' },
      { ar: 'بِجَمِيعِ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'أَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'الْحَوِيلَةِ', orig: 'חֲוִילָה', sid: 'H2341' },
      { ar: 'حَيْثُ', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'الذَّهَبُ', orig: 'זָהָב', sid: 'H2091' }
    ]
  },
  // v12
  {
    v: 12,
    tokens: [
      { ar: 'وَذَهَبُ', orig: 'זָהָב', sid: 'H2091' },
      { ar: 'تِلْكَ', orig: 'הוּא', sid: 'H1931' },
      { ar: 'الأَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'جَيِّدٌ', orig: 'טוֹב', sid: 'H2896' },
      { ar: 'هُنَاكَ', orig: 'שָׁם', sid: 'H8033' },
      { ar: 'الْمُقْلُ', orig: 'בְּדֹלַח', sid: 'H916' },
      { ar: 'وَحَجَرُ', orig: 'אֶבֶן', sid: 'H68' },
      { ar: 'الْجَزْعِ', orig: 'שֹׁהַם', sid: 'H7718' }
    ]
  },
  // v13
  {
    v: 13,
    tokens: [
      { ar: 'وَاسْمُ', orig: 'שֵׁם', sid: 'H8034' },
      { ar: 'النَّهْرِ', orig: 'נָהָר', sid: 'H5104' },
      { ar: 'الثَّانِي', orig: 'שֵׁנִי', sid: 'H8145' },
      { ar: 'جِيحُونُ', orig: 'גִּיחוֹן', sid: 'H1521' },
      { ar: 'وَهُوَ', orig: 'הוּא', sid: 'H1931' },
      { ar: 'الْمُحِيطُ', orig: 'סָבַב', sid: 'H5437' },
      { ar: 'بِجَمِيعِ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'أَرْضِ', orig: 'אֶרֶץ', sid: 'H776' },
      { ar: 'كُوشٍ', orig: 'כּוּשׁ', sid: 'H3568' }
    ]
  },
  // v14
  {
    v: 14,
    tokens: [
      { ar: 'وَاسْمُ', orig: 'שֵׁם', sid: 'H8034' },
      { ar: 'النَّهْرِ', orig: 'נָהָר', sid: 'H5104' },
      { ar: 'الثَّالِثِ', orig: 'שְׁלִישִׁי', sid: 'H7992' },
      { ar: 'حِدَّاقِلُ', orig: 'חִדֶּקֶל', sid: 'H2313' },
      { ar: 'وَهُوَ', orig: 'הוּא', sid: 'H1931' },
      { ar: 'الْجَارِي', orig: 'הָלַךְ', sid: 'H1980' },
      { ar: 'شَرْقِيَّ', orig: 'קִדְמַת', sid: 'H6926' },
      { ar: 'أَشُّورَ', orig: 'אַשּׁוּר', sid: 'H804' },
      { ar: 'وَالنَّهْرُ', orig: 'נָהָר', sid: 'H5104' },
      { ar: 'الرَّابِعُ', orig: 'רְבִיעִי', sid: 'H7243' },
      { ar: 'الْفُرَاتُ', orig: 'פְּרָת', sid: 'H6578' }
    ]
  },
  // v15
  {
    v: 15,
    tokens: [
      { ar: 'وَأَخَذَ', orig: 'לָקַח', sid: 'H3947' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'وَوَضَعَهُ', orig: 'נוּחַ', sid: 'H3240' },
      { ar: 'فِي', orig: '---', sid: null },
      { ar: 'جَنَّةِ', orig: 'גַּן', sid: 'H1588' },
      { ar: 'عَدْنٍ', orig: 'עֵדֶן', sid: 'H5731' },
      { ar: 'لِيَعْمَلَهَا', orig: 'עָבַד', sid: 'H5647' },
      { ar: 'وَيَحْفَظَهَا', orig: 'שָׁמַר', sid: 'H8104' }
    ]
  },
  // v16
  {
    v: 16,
    tokens: [
      { ar: 'وَأَوْصَى', orig: 'צָוָה', sid: 'H6680' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'قَائِلاً', orig: 'אָמַר', sid: 'H559' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'جَمِيعِ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'شَجَرِ', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'الْجَنَّةِ', orig: 'גַּן', sid: 'H1588' },
      { ar: 'تَأْكُلُ', orig: 'אָכַל', sid: 'H398' },
      { ar: 'أَكْلاً', orig: 'אָכַל', sid: 'H398' }
    ]
  },
  // v17
  {
    v: 17,
    tokens: [
      { ar: 'وَأَمَّا', orig: '---', sid: null },
      { ar: 'شَجَرَةُ', orig: 'עֵץ', sid: 'H6086' },
      { ar: 'مَعْرِفَةِ', orig: 'דַּעַת', sid: 'H1847' },
      { ar: 'الْخَيْرِ', orig: 'טוֹב', sid: 'H2896' },
      { ar: 'وَالشَّرِّ', orig: 'רַע', sid: 'H7451' },
      { ar: 'فَلاَ', orig: 'לֹא', sid: 'H3808' },
      { ar: 'تَأْكُلْ', orig: 'אָכַל', sid: 'H398' },
      { ar: 'مِنْهَا', orig: 'מִן', sid: 'H4480' },
      { ar: 'لأَنَّكَ', orig: 'כִּי', sid: 'H3588' },
      { ar: 'يَوْمَ', orig: 'יוֹם', sid: 'H3117' },
      { ar: 'تَأْكُلُ', orig: 'אָכַל', sid: 'H398' },
      { ar: 'مِنْهَا', orig: 'מִן', sid: 'H4480' },
      { ar: 'مَوْتًا', orig: 'מוּת', sid: 'H4191' },
      { ar: 'تَمُوتُ', orig: 'מוּת', sid: 'H4191' }
    ]
  },
  // v18
  {
    v: 18,
    tokens: [
      { ar: 'وَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'لَيْسَ', orig: 'לֹא', sid: 'H3808' },
      { ar: 'جَيِّدًا', orig: 'טוֹב', sid: 'H2896' },
      { ar: 'أَنْ', orig: '---', sid: null },
      { ar: 'يَكُونَ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'آدَمُ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'وَحْدَهُ', orig: 'בַּד', sid: 'H905' },
      { ar: 'فَأَصْنَعَ', orig: 'עָשָׂה', sid: 'H6213' },
      { ar: 'لَهُ', orig: '---', sid: null },
      { ar: 'مُعِينًا', orig: 'עֵזֶר', sid: 'H5828' },
      { ar: 'نَظِيرَهُ', orig: 'נֶגֶד', sid: 'H5048' }
    ]
  },
  // v19
  {
    v: 19,
    tokens: [
      { ar: 'وَجَبَلَ', orig: 'יָצַר', sid: 'H3335' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'مِنَ', orig: 'מִן', sid: 'H4480' },
      { ar: 'الأَرْضِ', orig: 'אֲדָמָה', sid: 'H127' },
      { ar: 'كُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'حَيَوَانَاتِ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'الْبَرِّيَّةِ', orig: 'שָׂדֶה', sid: 'H7704' },
      { ar: 'وَكُلَّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'طُيُورِ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'فَأَحْضَرَهَا', orig: 'בּוֹא', sid: 'H935' },
      { ar: 'إِلَى', orig: 'אֶל', sid: 'H413' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'لِيَرَى', orig: 'רָאָה', sid: 'H7200' },
      { ar: 'مَاذَا', orig: 'מָה', sid: 'H4100' },
      { ar: 'يَدْعُوهَا', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'وَكُلُّ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'مَا', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'دَعَا', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'بِهِ', orig: '---', sid: null },
      { ar: 'آدَمُ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'ذَاتَ', orig: '---', sid: null },
      { ar: 'نَفْسٍ', orig: 'נֶפֶשׁ', sid: 'H5315' },
      { ar: 'حَيَّةٍ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'فَهُوَ', orig: 'הוּא', sid: 'H1931' },
      { ar: 'اسْمُهَا', orig: 'שֵׁם', sid: 'H8034' }
    ]
  },
  // v20
  {
    v: 20,
    tokens: [
      { ar: 'فَدَعَا', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'آدَمُ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'بِأَسْمَاءٍ', orig: 'שֵׁם', sid: 'H8034' },
      { ar: 'جَمِيعَ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'الْبَهَائِمِ', orig: 'בְּהֵמָה', sid: 'H929' },
      { ar: 'وَطُيُورَ', orig: 'עוֹף', sid: 'H5775' },
      { ar: 'السَّمَاءِ', orig: 'שָׁמַיִם', sid: 'H8064' },
      { ar: 'وَجَمِيعَ', orig: 'כָּל', sid: 'H3605' },
      { ar: 'حَيَوَانَاتِ', orig: 'חַיָּה', sid: 'H2416' },
      { ar: 'الْبَرِّيَّةِ', orig: 'שָׂדֶה', sid: 'H7704' },
      { ar: 'وَأَمَّا', orig: '---', sid: null },
      { ar: 'لِنَفْسِهِ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'فَلَمْ', orig: 'לֹא', sid: 'H3808' },
      { ar: 'يَجِدْ', orig: 'מָצָא', sid: 'H4672' },
      { ar: 'مُعِينًا', orig: 'עֵזֶר', sid: 'H5828' },
      { ar: 'نَظِيرَهُ', orig: 'נֶגֶד', sid: 'H5048' }
    ]
  },
  // v21
  {
    v: 21,
    tokens: [
      { ar: 'فَأَوْقَعَ', orig: 'נָפַל', sid: 'H5307' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'سُبَاتًا', orig: 'תַּרְדֵּמָה', sid: 'H8639' },
      { ar: 'عَلَى', orig: 'עַל', sid: 'H5921' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'فَنَامَ', orig: 'יָשֵׁן', sid: 'H3462' },
      { ar: 'فَأَخَذَ', orig: 'לָקַח', sid: 'H3947' },
      { ar: 'وَاحِدَةً', orig: 'אֶחָד', sid: 'H259' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'أَضْلاَعِهِ', orig: 'צֵלָע', sid: 'H6763' },
      { ar: 'وَأَغْلَقَ', orig: 'סָגַר', sid: 'H5462' },
      { ar: 'مَكَانَهَا', orig: 'תַּחַת', sid: 'H8478' },
      { ar: 'بِلَحْمٍ', orig: 'בָּשָׂר', sid: 'H1320' }
    ]
  },
  // v22
  {
    v: 22,
    tokens: [
      { ar: 'وَبَنَى', orig: 'בָּנָה', sid: 'H1129' },
      { ar: 'الرَّبُّ', orig: 'יְהֹוָה', sid: 'H3068' },
      { ar: 'الإِلهُ', orig: 'אֱלֹהִים', sid: 'H430' },
      { ar: 'الضِّلْعَ', orig: 'צֵלָע', sid: 'H6763' },
      { ar: 'الَّتِي', orig: 'אֲשֶׁר', sid: 'H834' },
      { ar: 'أَخَذَهَا', orig: 'לָקַח', sid: 'H3947' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'امْرَأَةً', orig: 'אִשָּׁה', sid: 'H802' },
      { ar: 'وَأَحْضَرَهَا', orig: 'בּוֹא', sid: 'H935' },
      { ar: 'إِلَى', orig: 'אֶל', sid: 'H413' },
      { ar: 'آدَمَ', orig: 'אָדָם', sid: 'H120' }
    ]
  },
  // v23
  {
    v: 23,
    tokens: [
      { ar: 'فَقَالَ', orig: 'אָמַר', sid: 'H559' },
      { ar: 'آدَمُ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'هذِهِ', orig: 'זֹאת', sid: 'H2063' },
      { ar: 'الآنَ', orig: 'פַּעַם', sid: 'H6471' },
      { ar: 'عَظْمٌ', orig: 'עֶצֶם', sid: 'H6106' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'عِظَامِي', orig: 'עֶצֶם', sid: 'H6106' },
      { ar: 'وَلَحْمٌ', orig: 'בָּשָׂר', sid: 'H1320' },
      { ar: 'مِنْ', orig: 'מִן', sid: 'H4480' },
      { ar: 'لَحْمِي', orig: 'בָּשָׂר', sid: 'H1320' },
      { ar: 'هذِهِ', orig: 'זֹאת', sid: 'H2063' },
      { ar: 'تُدْعَى', orig: 'קָרָא', sid: 'H7121' },
      { ar: 'امْرَأَةً', orig: 'אִשָּׁה', sid: 'H802' },
      { ar: 'لأَنَّهَا', orig: 'כִּי', sid: 'H3588' },
      { ar: 'مِنِ', orig: 'מִן', sid: 'H4480' },
      { ar: 'امْرِءٍ', orig: 'אִישׁ', sid: 'H376' },
      { ar: 'أُخِذَتْ', orig: 'לָקַח', sid: 'H3947' }
    ]
  },
  // v24
  {
    v: 24,
    tokens: [
      { ar: 'لِذلِكَ', orig: 'עַל־כֵּן', sid: 'H3651' },
      { ar: 'يَتْرُكُ', orig: 'עָזַב', sid: 'H5800' },
      { ar: 'الرَّجُلُ', orig: 'אִישׁ', sid: 'H376' },
      { ar: 'أَبَاهُ', orig: 'אָב', sid: 'H1' },
      { ar: 'وَأُمَّهُ', orig: 'אֵם', sid: 'H517' },
      { ar: 'وَيَلْتَصِقُ', orig: 'דָּבַק', sid: 'H1692' },
      { ar: 'بِامْرَأَتِهِ', orig: 'אִשָּׁה', sid: 'H802' },
      { ar: 'وَيَكُونَانِ', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'جَسَدًا', orig: 'בָּשָׂר', sid: 'H1320' },
      { ar: 'وَاحِدًا', orig: 'אֶחָד', sid: 'H259' }
    ]
  },
  // v25
  {
    v: 25,
    tokens: [
      { ar: 'وَكَانَا', orig: 'הָיָה', sid: 'H1961' },
      { ar: 'كِلاَهُمَا', orig: 'שְׁנַיִם', sid: 'H8147' },
      { ar: 'عُرْيَانَيْنِ', orig: 'עָרוֹם', sid: 'H6174' },
      { ar: 'آدَمُ', orig: 'אָדָם', sid: 'H120' },
      { ar: 'وَامْرَأَتُهُ', orig: 'אִשָּׁה', sid: 'H802' },
      { ar: 'وَهُمَا', orig: '---', sid: null },
      { ar: 'لاَ', orig: 'לֹא', sid: 'H3808' },
      { ar: 'يَخْزَيَانِ', orig: 'בּוּשׁ', sid: 'H954' }
    ]
  }
];

// Validate all 25 verses against text_avd_ar
console.log('Validating Genesis 2 tokens against database text...');
const punctuationRegex = /[\u060C\u061B\u061F\u06D4«».,:;!؟\(\)\[\]"'\-—–]/gu;
let valid = true;

for (const entry of gen2Data) {
  const row = q(`SELECT id, text_avd_ar FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = ${entry.v};`)[0];
  const dbWords = row.text_avd_ar.replace(punctuationRegex, ' ').trim().split(/\s+/).filter(Boolean);
  if (dbWords.length !== entry.tokens.length) {
    console.error(`Mismatch in Gen 2:${entry.v}! DB has ${dbWords.length} words, gen2Data has ${entry.tokens.length}`);
    console.error('DB words:', dbWords);
    console.error('Data words:', entry.tokens.map(t => t.ar));
    valid = false;
  }
}

if (!valid) {
  console.error('Validation failed. Aborting.');
  process.exit(1);
}

console.log('All 25 verses of Genesis 2 validated perfectly with 100% token count match!');

// Generate SQL
let sql = 'BEGIN TRANSACTION;\n\n';
for (const entry of gen2Data) {
  const verseId = q(`SELECT id FROM verses WHERE book_id = 1 AND chapter_num = 2 AND verse_num = ${entry.v};`)[0].id;
  sql += `-- Genesis 2:${entry.v}\n`;
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

require('fs').writeFileSync('scripts/realign_genesis2.sql', sql, 'utf8');
console.log('Generated scripts/realign_genesis2.sql.');
