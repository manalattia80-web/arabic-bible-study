// lib/models/verse.dart
class Verse {
  final String id;
  final int    bookId;
  final int    chapterNum;
  final int    verseNum;
  final String textAvdAr;
  final String textOriginal;
  final String? textManuscript;
  final String textOriginalLang; // 'hebrew' | 'greek' | 'aramaic'
  final String? bookNameAr;

  const Verse({
    required this.id,
    required this.bookId,
    required this.chapterNum,
    required this.verseNum,
    required this.textAvdAr,
    required this.textOriginal,
    this.textManuscript,
    required this.textOriginalLang,
    this.bookNameAr,
  });

  factory Verse.fromJson(Map<String, dynamic> j) {
    String? bName;
    if (j['books'] != null && j['books'] is Map) {
      bName = j['books']['name_ar'] as String?;
    }
    bName ??= j['book_name_ar'] as String?;

    return Verse(
      id:               j['id'] as String,
      bookId:           j['book_id'] as int,
      chapterNum:       j['chapter_num'] as int,
      verseNum:         j['verse_num'] as int,
      textAvdAr:        j['text_avd_ar'] as String,
      textOriginal:     j['text_original'] as String,
      textManuscript:   j['text_manuscript'] as String?,
      textOriginalLang: j['text_original_lang'] as String,
      bookNameAr:       bName,
    );
  }

  static String toArabicDigits(int num) {
    const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const arabic  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    String s = num.toString();
    for (int i = 0; i < english.length; i++) {
      s = s.replaceAll(english[i], arabic[i]);
    }
    return s;
  }

  String get displayBookName => bookNameAr ?? _defaultBookNames[bookId] ?? 'السفر $bookId';
  String get reference => '$displayBookName ${toArabicDigits(chapterNum)}: ${toArabicDigits(verseNum)}';
  bool   get isHebrew  => textOriginalLang == 'hebrew' || textOriginalLang == 'aramaic';

  static const Map<int, String> _defaultBookNames = {
    1: 'التكوين', 2: 'الخروج', 3: 'اللاويين', 4: 'العدد', 5: 'التثنية',
    6: 'يشوع', 7: 'القضاة', 8: 'راعوث', 9: 'صموئيل الأول', 10: 'صموئيل الثاني',
    11: 'الملوك الأول', 12: 'الملوك الثاني', 13: 'أخبار الأيام الأول', 14: 'أخبار الأيام الثاني',
    15: 'عزرا', 16: 'نحميا', 17: 'أستير', 18: 'أيوب', 19: 'المزامير', 20: 'الأمثال',
    21: 'الجامعة', 22: 'نشيد الأنشاد', 23: 'إشعياء', 24: 'إرميا', 25: 'مراثي إرميا',
    26: 'حزقيال', 27: 'دانيال', 28: 'هوشع', 29: 'يوئيل', 30: 'عاموس', 31: 'عوبديا',
    32: 'يونان', 33: 'ميخا', 34: 'ناحوم', 35: 'حبقوق', 36: 'صفنيا', 37: 'حجي',
    38: 'زكريا', 39: 'ملاخي', 40: 'متى', 41: 'مرقس', 42: 'لوقا', 43: 'يوحنا',
    44: 'أعمال الرسل', 45: 'رومية', 46: 'كورنثوس الأولى', 47: 'كورنثوس الثانية',
    48: 'غلاطية', 49: 'أفسس', 50: 'فيليبي', 51: 'كولوسي', 52: 'تسالونيكي الأولى',
    53: 'تسالونيكي الثانية', 54: 'تيموثاوس الأولى', 55: 'تيموثاوس الثانية',
    56: 'طيطس', 57: 'فليمون', 58: 'العبرانيين', 59: 'يعقوب', 60: 'بطرس الأولى',
    61: 'بطرس الثانية', 62: 'يوحنا الأولى', 63: 'يوحنا الثانية', 64: 'يوحنا الثالثة',
    65: 'يهوذا', 66: 'الرؤيا'
  };
}
