// lib/models/book.dart
import '../core/services/database_service.dart';
import 'verse.dart';

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

  factory Book.fromJson(Map<String, dynamic> j) {
    final bId = (j['id'] as num).toInt();
    final rawCount = ((j['chapter_count'] ?? j['total_chapters']) as num?)?.toInt() ?? 0;
    final count = rawCount > 0 ? rawCount : (DatabaseService.defaultChapterCounts[bId] ?? 1);
    final nameAr = (j['name_ar'] as String? ?? '').trim();
    final nameEn = (j['name_en'] as String? ?? '').trim();

    return Book(
      id:           bId,
      testamentId:  (j['testament_id'] as num?)?.toInt() ?? (bId >= 40 ? 2 : 1),
      nameAr:       nameAr.isNotEmpty ? nameAr : (Verse.defaultBookNames[bId] ?? 'سفر $bId'),
      nameArShort:  (j['name_ar_short'] as String?) ?? (nameAr.isNotEmpty ? nameAr : (Verse.defaultBookNames[bId] ?? '')),
      nameEn:       nameEn.isNotEmpty ? nameEn : (DatabaseService.defaultBookNamesEn[bId] ?? 'Book $bId'),
      nameEnShort:  (j['name_en_short'] as String?) ?? (nameEn.isNotEmpty ? nameEn : (DatabaseService.defaultBookNamesEn[bId] ?? '')),
      nameOriginal: j['name_original'] as String?,
      chapterCount: count,
      sortOrder:    ((j['order_num'] ?? j['sort_order']) as num?)?.toInt() ?? bId,
    );
  }
}
