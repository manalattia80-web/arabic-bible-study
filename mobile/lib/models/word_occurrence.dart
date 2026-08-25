class WordOccurrence {
  final String arWord;
  final String verseId;
  final int bookId;
  final String bookNameAr;
  final int chapterNum;
  final int verseNum;
  final String textAvdAr;

  WordOccurrence({
    required this.arWord,
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
      verseId: json['verse_id'] as String? ?? '',
      bookId: json['book_id'] as int? ?? 0,
      bookNameAr: json['book_name_ar'] as String? ?? '',
      chapterNum: json['chapter_num'] as int? ?? 0,
      verseNum: json['verse_num'] as int? ?? 0,
      textAvdAr: json['text_avd_ar'] as String? ?? '',
    );
  }
}
