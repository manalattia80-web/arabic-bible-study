class WordOccurrence {
  final String arWord;
  final List<int> arWordPositions;
  final String verseId;
  final int bookId;
  final String bookNameAr;
  final int chapterNum;
  final int verseNum;
  final String textAvdAr;

  WordOccurrence({
    required this.arWord,
    required this.arWordPositions,
    required this.verseId,
    required this.bookId,
    required this.bookNameAr,
    required this.chapterNum,
    required this.verseNum,
    required this.textAvdAr,
  });

  factory WordOccurrence.fromJson(Map<String, dynamic> json) {
    return WordOccurrence(
      arWord: json['ar_word'] as String? ?? '',
      arWordPositions: (json['ar_word_positions'] as List?)?.map((e) => e as int).toList() ?? [],
      verseId: json['verse_id'] as String? ?? '',
      bookId: json['book_id'] as int? ?? 0,
      bookNameAr: json['book_name_ar'] as String? ?? '',
      chapterNum: json['chapter_num'] as int? ?? 0,
      verseNum: json['verse_num'] as int? ?? 0,
      textAvdAr: json['text_avd_ar'] as String? ?? '',
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

  String get reference => '$bookNameAr ${toArabicDigits(chapterNum)}: ${toArabicDigits(verseNum)}';
}
