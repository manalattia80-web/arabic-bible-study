// lib/models/book.dart
class Book {
  final int    id;
  final int    testamentId;
  final String nameAr;
  final String nameArShort;
  final String nameEn;
  final String nameEnShort;
  final String? nameOriginal;
  final int    chapterCount;
  final int    sortOrder;

  const Book({
    required this.id,
    required this.testamentId,
    required this.nameAr,
    required this.nameArShort,
    required this.nameEn,
    required this.nameEnShort,
    this.nameOriginal,
    required this.chapterCount,
    required this.sortOrder,
  });

  factory Book.fromJson(Map<String, dynamic> j) => Book(
    id:           j['id'] as int,
    testamentId:  j['testament_id'] as int,
    nameAr:       j['name_ar'] as String,
    nameArShort:  j['name_ar_short'] as String,
    nameEn:       j['name_en'] as String,
    nameEnShort:  (j['name_en_short'] ?? j['name_en']) as String,
    nameOriginal: j['name_original'] as String?,
    chapterCount: j['chapter_count'] as int,
    sortOrder:    (j['sort_order'] ?? 0) as int,
  );
}
