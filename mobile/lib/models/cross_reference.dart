// lib/models/cross_reference.dart
class CrossReference {
  final int id;
  final int bookId;
  final int chapterNum;
  final int verseNum;
  final int targetBookId;
  final String targetBookName;
  final int targetChapterNum;
  final int targetVerseNum;
  final String targetText;

  const CrossReference({
    required this.id,
    required this.bookId,
    required this.chapterNum,
    required this.verseNum,
    required this.targetBookId,
    required this.targetBookName,
    required this.targetChapterNum,
    required this.targetVerseNum,
    required this.targetText,
  });

  String get reference => '$targetBookName $targetChapterNum: $targetVerseNum';
}
