// lib/models/strongs_entry.dart
class StrongsEntry {
  final String  strongsId;
  final String  language;       // 'hebrew' | 'greek'
  final String  originalWord;
  final String  transliteration;
  final String? rootWord;
  final String? pronunciation;
  final String  definitionEn;
  final String? kjvUsage;
  // Arabic translation (from admin panel)
  final String? definitionAr;
  final String? notesAr;
  final bool    arIsVerified;

  const StrongsEntry({
    required this.strongsId,
    required this.language,
    required this.originalWord,
    required this.transliteration,
    this.rootWord,
    this.pronunciation,
    required this.definitionEn,
    this.kjvUsage,
    this.definitionAr,
    this.notesAr,
    required this.arIsVerified,
  });

  factory StrongsEntry.fromJson(Map<String, dynamic> j) => StrongsEntry(
    strongsId:       j['strongs_id'] as String,
    language:        j['language'] as String,
    originalWord:    j['original_word'] as String,
    transliteration: j['transliteration'] as String,
    rootWord:        j['root_word'] as String?,
    pronunciation:   j['pronunciation'] as String?,
    definitionEn:    j['definition_en'] as String,
    kjvUsage:        j['kjv_usage'] as String?,
    definitionAr:    j['definition_ar'] as String?,
    notesAr:         j['notes_ar'] as String?,
    arIsVerified:    (j['ar_is_verified'] as bool?) ?? false,
  );

  bool get isHebrew       => language == 'hebrew';
  bool get hasArabicDef   => definitionAr != null && definitionAr!.isNotEmpty;
}
