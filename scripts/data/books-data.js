/**
 * books-data.js
 * Static reference data for all 66 canonical Bible books.
 * Includes Arabic (AVD), English, and original language names.
 */

export const BOOKS = [
  // ─── OLD TESTAMENT (39 books) ────────────────────────────────────────────
  { id: 1,  testament_id: 1, name_ar: 'تكوين',              name_ar_short: 'تك',    name_en: 'Genesis',          name_en_short: 'Gen',  name_original: 'בְּרֵאשִׁית',           chapter_count: 50,  sort_order: 1  },
  { id: 2,  testament_id: 1, name_ar: 'خروج',               name_ar_short: 'خر',    name_en: 'Exodus',           name_en_short: 'Exo',  name_original: 'שְׁמוֹת',               chapter_count: 40,  sort_order: 2  },
  { id: 3,  testament_id: 1, name_ar: 'لاويين',             name_ar_short: 'لا',    name_en: 'Leviticus',        name_en_short: 'Lev',  name_original: 'וַיִּקְרָא',            chapter_count: 27,  sort_order: 3  },
  { id: 4,  testament_id: 1, name_ar: 'العدد',              name_ar_short: 'عد',    name_en: 'Numbers',          name_en_short: 'Num',  name_original: 'בְּמִדְבַּר',           chapter_count: 36,  sort_order: 4  },
  { id: 5,  testament_id: 1, name_ar: 'تثنية',              name_ar_short: 'تث',    name_en: 'Deuteronomy',      name_en_short: 'Deu',  name_original: 'דְּבָרִים',             chapter_count: 34,  sort_order: 5  },
  { id: 6,  testament_id: 1, name_ar: 'يشوع',               name_ar_short: 'يش',    name_en: 'Joshua',           name_en_short: 'Jos',  name_original: 'יְהוֹשֻׁעַ',           chapter_count: 24,  sort_order: 6  },
  { id: 7,  testament_id: 1, name_ar: 'القضاة',             name_ar_short: 'قض',    name_en: 'Judges',           name_en_short: 'Jdg',  name_original: 'שׁוֹפְטִים',            chapter_count: 21,  sort_order: 7  },
  { id: 8,  testament_id: 1, name_ar: 'راعوث',              name_ar_short: 'رع',    name_en: 'Ruth',             name_en_short: 'Rut',  name_original: 'רוּת',                  chapter_count: 4,   sort_order: 8  },
  { id: 9,  testament_id: 1, name_ar: 'صموئيل الأول',       name_ar_short: 'صم1',   name_en: '1 Samuel',         name_en_short: '1Sa',  name_original: 'שְׁמוּאֵל א',           chapter_count: 31,  sort_order: 9  },
  { id: 10, testament_id: 1, name_ar: 'صموئيل الثاني',      name_ar_short: 'صم2',   name_en: '2 Samuel',         name_en_short: '2Sa',  name_original: 'שְׁמוּאֵל ב',           chapter_count: 24,  sort_order: 10 },
  { id: 11, testament_id: 1, name_ar: 'الملوك الأول',        name_ar_short: 'مل1',   name_en: '1 Kings',          name_en_short: '1Ki',  name_original: 'מְלָכִים א',            chapter_count: 22,  sort_order: 11 },
  { id: 12, testament_id: 1, name_ar: 'الملوك الثاني',       name_ar_short: 'مل2',   name_en: '2 Kings',          name_en_short: '2Ki',  name_original: 'מְלָכִים ב',            chapter_count: 25,  sort_order: 12 },
  { id: 13, testament_id: 1, name_ar: 'أخبار الأيام الأول',  name_ar_short: 'أخ1',   name_en: '1 Chronicles',     name_en_short: '1Ch',  name_original: 'דִּבְרֵי הַיָּמִים א',  chapter_count: 29,  sort_order: 13 },
  { id: 14, testament_id: 1, name_ar: 'أخبار الأيام الثاني', name_ar_short: 'أخ2',   name_en: '2 Chronicles',     name_en_short: '2Ch',  name_original: 'דִּבְרֵי הַיָּמִים ב',  chapter_count: 36,  sort_order: 14 },
  { id: 15, testament_id: 1, name_ar: 'عزرا',               name_ar_short: 'عز',    name_en: 'Ezra',             name_en_short: 'Ezr',  name_original: 'עֶזְרָא',               chapter_count: 10,  sort_order: 15 },
  { id: 16, testament_id: 1, name_ar: 'نحميا',              name_ar_short: 'نح',    name_en: 'Nehemiah',         name_en_short: 'Neh',  name_original: 'נְחֶמְיָה',             chapter_count: 13,  sort_order: 16 },
  { id: 17, testament_id: 1, name_ar: 'أستير',              name_ar_short: 'أس',    name_en: 'Esther',           name_en_short: 'Est',  name_original: 'אֶסְתֵּר',              chapter_count: 10,  sort_order: 17 },
  { id: 18, testament_id: 1, name_ar: 'أيوب',               name_ar_short: 'أي',    name_en: 'Job',              name_en_short: 'Job',  name_original: 'אִיּוֹב',               chapter_count: 42,  sort_order: 18 },
  { id: 19, testament_id: 1, name_ar: 'المزامير',           name_ar_short: 'مز',    name_en: 'Psalms',           name_en_short: 'Psa',  name_original: 'תְּהִלִּים',            chapter_count: 150, sort_order: 19 },
  { id: 20, testament_id: 1, name_ar: 'الأمثال',            name_ar_short: 'أم',    name_en: 'Proverbs',         name_en_short: 'Pro',  name_original: 'מִשְׁלֵי',              chapter_count: 31,  sort_order: 20 },
  { id: 21, testament_id: 1, name_ar: 'الجامعة',            name_ar_short: 'جا',    name_en: 'Ecclesiastes',     name_en_short: 'Ecc',  name_original: 'קֹהֶלֶת',               chapter_count: 12,  sort_order: 21 },
  { id: 22, testament_id: 1, name_ar: 'نشيد الأناشيد',      name_ar_short: 'نش',    name_en: 'Song of Solomon',  name_en_short: 'Sng',  name_original: 'שִׁיר הַשִּׁירִים',     chapter_count: 8,   sort_order: 22 },
  { id: 23, testament_id: 1, name_ar: 'إشعياء',             name_ar_short: 'إش',    name_en: 'Isaiah',           name_en_short: 'Isa',  name_original: 'יְשַׁעְיָהוּ',          chapter_count: 66,  sort_order: 23 },
  { id: 24, testament_id: 1, name_ar: 'إرميا',              name_ar_short: 'إر',    name_en: 'Jeremiah',         name_en_short: 'Jer',  name_original: 'יִרְמְיָהוּ',           chapter_count: 52,  sort_order: 24 },
  { id: 25, testament_id: 1, name_ar: 'مراثي إرميا',        name_ar_short: 'مر',    name_en: 'Lamentations',     name_en_short: 'Lam',  name_original: 'אֵיכָה',                chapter_count: 5,   sort_order: 25 },
  { id: 26, testament_id: 1, name_ar: 'حزقيال',             name_ar_short: 'حز',    name_en: 'Ezekiel',          name_en_short: 'Eze',  name_original: 'יְחֶזְקֵאל',            chapter_count: 48,  sort_order: 26 },
  { id: 27, testament_id: 1, name_ar: 'دانيال',             name_ar_short: 'دا',    name_en: 'Daniel',           name_en_short: 'Dan',  name_original: 'דָּנִיֵּאל',            chapter_count: 12,  sort_order: 27 },
  { id: 28, testament_id: 1, name_ar: 'هوشع',               name_ar_short: 'هو',    name_en: 'Hosea',            name_en_short: 'Hos',  name_original: 'הוֹשֵׁעַ',              chapter_count: 14,  sort_order: 28 },
  { id: 29, testament_id: 1, name_ar: 'يوئيل',              name_ar_short: 'يو',    name_en: 'Joel',             name_en_short: 'Joe',  name_original: 'יוֹאֵל',                chapter_count: 3,   sort_order: 29 },
  { id: 30, testament_id: 1, name_ar: 'عاموس',              name_ar_short: 'عا',    name_en: 'Amos',             name_en_short: 'Amo',  name_original: 'עָמוֹס',                chapter_count: 9,   sort_order: 30 },
  { id: 31, testament_id: 1, name_ar: 'عوبديا',             name_ar_short: 'عو',    name_en: 'Obadiah',          name_en_short: 'Oba',  name_original: 'עֹבַדְיָה',             chapter_count: 1,   sort_order: 31 },
  { id: 32, testament_id: 1, name_ar: 'يونان',              name_ar_short: 'يو',    name_en: 'Jonah',            name_en_short: 'Jon',  name_original: 'יוֹנָה',                chapter_count: 4,   sort_order: 32 },
  { id: 33, testament_id: 1, name_ar: 'ميخا',               name_ar_short: 'مي',    name_en: 'Micah',            name_en_short: 'Mic',  name_original: 'מִיכָה',                chapter_count: 7,   sort_order: 33 },
  { id: 34, testament_id: 1, name_ar: 'ناحوم',              name_ar_short: 'نا',    name_en: 'Nahum',            name_en_short: 'Nah',  name_original: 'נַחוּם',                chapter_count: 3,   sort_order: 34 },
  { id: 35, testament_id: 1, name_ar: 'حبقوق',              name_ar_short: 'حب',    name_en: 'Habakkuk',         name_en_short: 'Hab',  name_original: 'חֲבַקּוּק',             chapter_count: 3,   sort_order: 35 },
  { id: 36, testament_id: 1, name_ar: 'صفنيا',              name_ar_short: 'صف',    name_en: 'Zephaniah',        name_en_short: 'Zep',  name_original: 'צְפַנְיָה',             chapter_count: 3,   sort_order: 36 },
  { id: 37, testament_id: 1, name_ar: 'حجي',                name_ar_short: 'حج',    name_en: 'Haggai',           name_en_short: 'Hag',  name_original: 'חַגַּי',                chapter_count: 2,   sort_order: 37 },
  { id: 38, testament_id: 1, name_ar: 'زكريا',              name_ar_short: 'زك',    name_en: 'Zechariah',        name_en_short: 'Zec',  name_original: 'זְכַרְיָה',             chapter_count: 14,  sort_order: 38 },
  { id: 39, testament_id: 1, name_ar: 'ملاخي',              name_ar_short: 'ملا',   name_en: 'Malachi',          name_en_short: 'Mal',  name_original: 'מַלְאָכִי',             chapter_count: 4,   sort_order: 39 },

  // ─── NEW TESTAMENT (27 books) ────────────────────────────────────────────
  { id: 40, testament_id: 2, name_ar: 'متى',                name_ar_short: 'مت',    name_en: 'Matthew',          name_en_short: 'Mat',  name_original: 'ΚΑΤΑ ΜΑΤΘΑΙΟΝ',         chapter_count: 28,  sort_order: 40 },
  { id: 41, testament_id: 2, name_ar: 'مرقس',               name_ar_short: 'مر',    name_en: 'Mark',             name_en_short: 'Mar',  name_original: 'ΚΑΤΑ ΜΑΡΚΟΝ',           chapter_count: 16,  sort_order: 41 },
  { id: 42, testament_id: 2, name_ar: 'لوقا',               name_ar_short: 'لو',    name_en: 'Luke',             name_en_short: 'Luk',  name_original: 'ΚΑΤΑ ΛΟΥΚΑΝ',           chapter_count: 24,  sort_order: 42 },
  { id: 43, testament_id: 2, name_ar: 'يوحنا',              name_ar_short: 'يو',    name_en: 'John',             name_en_short: 'Joh',  name_original: 'ΚΑΤΑ ΙΩΑΝΝΗΝ',          chapter_count: 21,  sort_order: 43 },
  { id: 44, testament_id: 2, name_ar: 'أعمال الرسل',        name_ar_short: 'أع',    name_en: 'Acts',             name_en_short: 'Act',  name_original: 'ΠΡΑΞΕΙΣ ΑΠΟΣΤΟΛΩΝ',     chapter_count: 28,  sort_order: 44 },
  { id: 45, testament_id: 2, name_ar: 'رومية',              name_ar_short: 'رو',    name_en: 'Romans',           name_en_short: 'Rom',  name_original: 'ΠΡΟΣ ΡΩΜΑΙΟΥΣ',         chapter_count: 16,  sort_order: 45 },
  { id: 46, testament_id: 2, name_ar: 'كورنثوس الأولى',     name_ar_short: 'كو1',   name_en: '1 Corinthians',    name_en_short: '1Co',  name_original: 'ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Α',     chapter_count: 16,  sort_order: 46 },
  { id: 47, testament_id: 2, name_ar: 'كورنثوس الثانية',    name_ar_short: 'كو2',   name_en: '2 Corinthians',    name_en_short: '2Co',  name_original: 'ΠΡΟΣ ΚΟΡΙΝΘΙΟΥΣ Β',     chapter_count: 13,  sort_order: 47 },
  { id: 48, testament_id: 2, name_ar: 'غلاطية',             name_ar_short: 'غل',    name_en: 'Galatians',        name_en_short: 'Gal',  name_original: 'ΠΡΟΣ ΓΑΛΑΤΑΣ',          chapter_count: 6,   sort_order: 48 },
  { id: 49, testament_id: 2, name_ar: 'أفسس',               name_ar_short: 'أف',    name_en: 'Ephesians',        name_en_short: 'Eph',  name_original: 'ΠΡΟΣ ΕΦΕΣΙΟΥΣ',         chapter_count: 6,   sort_order: 49 },
  { id: 50, testament_id: 2, name_ar: 'فيلبي',              name_ar_short: 'في',    name_en: 'Philippians',      name_en_short: 'Php',  name_original: 'ΠΡΟΣ ΦΙΛΙΠΠΗΣΙΟΥΣ',     chapter_count: 4,   sort_order: 50 },
  { id: 51, testament_id: 2, name_ar: 'كولوسي',             name_ar_short: 'كو',    name_en: 'Colossians',       name_en_short: 'Col',  name_original: 'ΠΡΟΣ ΚΟΛΟΣΣΑΕΙΣ',       chapter_count: 4,   sort_order: 51 },
  { id: 52, testament_id: 2, name_ar: 'تسالونيكي الأولى',   name_ar_short: 'تس1',   name_en: '1 Thessalonians',  name_en_short: '1Th',  name_original: 'ΠΡΟΣ ΘΕΣΣΑΛΟΝΙΚΕΙΣ Α',  chapter_count: 5,   sort_order: 52 },
  { id: 53, testament_id: 2, name_ar: 'تسالونيكي الثانية',  name_ar_short: 'تس2',   name_en: '2 Thessalonians',  name_en_short: '2Th',  name_original: 'ΠΡΟΣ ΘΕΣΣΑΛΟΝΙΚΕΙΣ Β',  chapter_count: 3,   sort_order: 53 },
  { id: 54, testament_id: 2, name_ar: 'تيموثاوس الأولى',    name_ar_short: 'تي1',   name_en: '1 Timothy',        name_en_short: '1Ti',  name_original: 'ΠΡΟΣ ΤΙΜΟΘΕΟΝ Α',       chapter_count: 6,   sort_order: 54 },
  { id: 55, testament_id: 2, name_ar: 'تيموثاوس الثانية',   name_ar_short: 'تي2',   name_en: '2 Timothy',        name_en_short: '2Ti',  name_original: 'ΠΡΟΣ ΤΙΜΟΘΕΟΝ Β',       chapter_count: 4,   sort_order: 55 },
  { id: 56, testament_id: 2, name_ar: 'تيطس',               name_ar_short: 'تي',    name_en: 'Titus',            name_en_short: 'Tit',  name_original: 'ΠΡΟΣ ΤΙΤΟΝ',             chapter_count: 3,   sort_order: 56 },
  { id: 57, testament_id: 2, name_ar: 'فيلیمون',            name_ar_short: 'فيل',   name_en: 'Philemon',         name_en_short: 'Phm',  name_original: 'ΠΡΟΣ ΦΙΛΗΜΟΝΑ',         chapter_count: 1,   sort_order: 57 },
  { id: 58, testament_id: 2, name_ar: 'العبرانيين',         name_ar_short: 'عب',    name_en: 'Hebrews',          name_en_short: 'Heb',  name_original: 'ΠΡΟΣ ΕΒΡΑΙΟΥΣ',         chapter_count: 13,  sort_order: 58 },
  { id: 59, testament_id: 2, name_ar: 'يعقوب',              name_ar_short: 'يع',    name_en: 'James',            name_en_short: 'Jam',  name_original: 'ΙΑΚΩΒΟΥ',               chapter_count: 5,   sort_order: 59 },
  { id: 60, testament_id: 2, name_ar: 'بطرس الأولى',        name_ar_short: 'بط1',   name_en: '1 Peter',          name_en_short: '1Pe',  name_original: 'ΠΕΤΡΟΥ Α',              chapter_count: 5,   sort_order: 60 },
  { id: 61, testament_id: 2, name_ar: 'بطرس الثانية',       name_ar_short: 'بط2',   name_en: '2 Peter',          name_en_short: '2Pe',  name_original: 'ΠΕΤΡΟΥ Β',              chapter_count: 3,   sort_order: 61 },
  { id: 62, testament_id: 2, name_ar: 'يوحنا الأولى',       name_ar_short: 'يح1',   name_en: '1 John',           name_en_short: '1Jo',  name_original: 'ΙΩΑΝΝΟΥ Α',             chapter_count: 5,   sort_order: 62 },
  { id: 63, testament_id: 2, name_ar: 'يوحنا الثانية',      name_ar_short: 'يح2',   name_en: '2 John',           name_en_short: '2Jo',  name_original: 'ΙΩΑΝΝΟΥ Β',             chapter_count: 1,   sort_order: 63 },
  { id: 64, testament_id: 2, name_ar: 'يوحنا الثالثة',      name_ar_short: 'يح3',   name_en: '3 John',           name_en_short: '3Jo',  name_original: 'ΙΩΑΝΝΟΥ Γ',             chapter_count: 1,   sort_order: 64 },
  { id: 65, testament_id: 2, name_ar: 'يهوذا',              name_ar_short: 'يه',    name_en: 'Jude',             name_en_short: 'Jud',  name_original: 'ΙΟΥΔΑ',                 chapter_count: 1,   sort_order: 65 },
  { id: 66, testament_id: 2, name_ar: 'الرؤيا',             name_ar_short: 'رؤ',    name_en: 'Revelation',       name_en_short: 'Rev',  name_original: 'ΑΠΟΚΑΛΥΨΙΣ',            chapter_count: 22,  sort_order: 66 },
];

/**
 * Maps USFM book abbreviations (from eBible USFM files) to book IDs.
 * Used by import-avd.js to identify which book a USFM file belongs to.
 */
export const USFM_CODE_TO_BOOK_ID = {
  GEN: 1,  EXO: 2,  LEV: 3,  NUM: 4,  DEU: 5,  JOS: 6,  JDG: 7,  RUT: 8,
  '1SA': 9, '2SA': 10, '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14,
  EZR: 15, NEH: 16, EST: 17, JOB: 18, PSA: 19, PRO: 20, ECC: 21, SNG: 22,
  ISA: 23, JER: 24, LAM: 25, EZK: 26, DAN: 27, HOS: 28, JOL: 29, AMO: 30,
  OBA: 31, JON: 32, MIC: 33, NAM: 34, HAB: 35, ZEP: 36, HAG: 37, ZEC: 38,
  MAL: 39,
  MAT: 40, MRK: 41, LUK: 42, JHN: 43, ACT: 44, ROM: 45,
  '1CO': 46, '2CO': 47, GAL: 48, EPH: 49, PHP: 50, COL: 51,
  '1TH': 52, '2TH': 53, '1TI': 54, '2TI': 55, TIT: 56, PHM: 57,
  HEB: 58, JAS: 59, '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63, '3JN': 64,
  JUD: 65, REV: 66,
};

/**
 * Maps STEPBible book abbreviations to book IDs.
 * Used by import-hebrew-ot.js and import-greek-nt.js
 */
export const STEP_CODE_TO_BOOK_ID = {
  Gen: 1,  Exo: 2,  Lev: 3,  Num: 4,  Deu: 5,  Jos: 6,  Jdg: 7,  Rut: 8,
  '1Sa': 9, '2Sa': 10, '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14,
  Ezr: 15, Neh: 16, Est: 17, Job: 18, Psa: 19, Pro: 20, Ecc: 21, Sng: 22,
  Isa: 23, Jer: 24, Lam: 25, Eze: 26, Dan: 27, Hos: 28, Joe: 29, Amo: 30,
  Oba: 31, Jon: 32, Mic: 33, Nah: 34, Hab: 35, Zep: 36, Hag: 37, Zec: 38,
  Mal: 39,
  Mat: 40, Mrk: 41, Luk: 42, Jhn: 43, Act: 44, Rom: 45,
  '1Co': 46, '2Co': 47, Gal: 48, Eph: 49, Php: 50, Col: 51,
  '1Th': 52, '2Th': 53, '1Ti': 54, '2Ti': 55, Tit: 56, Phm: 57,
  Heb: 58, Jas: 59, '1Pe': 60, '2Pe': 61, '1Jn': 62, '2Jn': 63, '3Jn': 64,
  Jud: 65, Rev: 66,
};
