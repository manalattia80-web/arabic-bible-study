// lib/models/testament.dart
class Testament {
  final int    id;
  final String nameAr;
  final String nameEn;
  final String originalLang; // 'hebrew' | 'greek'

  const Testament({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    required this.originalLang,
  });

  factory Testament.fromJson(Map<String, dynamic> j) => Testament(
    id:           j['id'] as int,
    nameAr:       j['name_ar'] as String,
    nameEn:       j['name_en'] as String,
    originalLang: j['original_lang'] as String,
  );

  bool get isOldTestament => id == 1;
}
