// lib/models/verse.dart
class Verse {
  final String id;
  final int    bookId;
  final int    chapterNum;
  final int    verseNum;
  final String textAvdAr;
  final String textOriginal;
  final String textOriginalLang; // 'hebrew' | 'greek' | 'aramaic'

  const Verse({
    required this.id,
    required this.bookId,
    required this.chapterNum,
    required this.verseNum,
    required this.textAvdAr,
    required this.textOriginal,
    required this.textOriginalLang,
  });

  factory Verse.fromJson(Map<String, dynamic> j) => Verse(
    id:               j['id'] as String,
    bookId:           j['book_id'] as int,
    chapterNum:       j['chapter_num'] as int,
    verseNum:         j['verse_num'] as int,
    textAvdAr:        j['text_avd_ar'] as String,
    textOriginal:     j['text_original'] as String,
    textOriginalLang: j['text_original_lang'] as String,
  );

  String get reference => '$chapterNum:$verseNum';
  bool   get isHebrew  => textOriginalLang == 'hebrew' || textOriginalLang == 'aramaic';
}
