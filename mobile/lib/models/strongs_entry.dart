// lib/models/strongs_entry.dart
class StrongsEntry {
  final String  strongsId;
  final String  language;       // 'hebrew' | 'greek'
  final String  originalWord;
  final String  transliteration;
  final String? rootWord;
  final String? pronunciation;
  final String? audioUrl;
  final String  definitionEn;
  final String? kjvUsage;
  // Arabic translation (from admin panel)
  final String? definitionAr;
  final String? notesAr;
  final String? pronunciationAr;
  final bool    arIsVerified;

  const StrongsEntry({
    required this.strongsId,
    required this.language,
    required this.originalWord,
    required this.transliteration,
    this.rootWord,
    this.pronunciation,
    this.audioUrl,
    required this.definitionEn,
    this.kjvUsage,
    this.definitionAr,
    this.notesAr,
    this.pronunciationAr,
    required this.arIsVerified,
  });

  factory StrongsEntry.fromJson(Map<String, dynamic> j) {
    final orig = j['original_word'] as String? ?? '';
    final lang = j['language'] as String? ?? 'hebrew';
    final isHeb = lang == 'hebrew' || lang == 'aramaic';

    String? audio;
    final rawAudio = j['audio_url'] as String?;
    if (rawAudio != null && rawAudio.trim().isNotEmpty) {
      audio = 'https://arabic-bible-study.vercel.app/api/v1/audio?url=' +
          Uri.encodeComponent(rawAudio
              .replaceAll('translate.google.com', 'translate.googleapis.com')
              .replaceAll('client=tw-ob', 'client=gtx'));
    } else if (orig.trim().isNotEmpty) {
      final langCode = isHeb ? 'iw' : 'el';
      final ttsUrl =
          'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(orig.trim())}&tl=$langCode&client=gtx';
      audio = 'https://arabic-bible-study.vercel.app/api/v1/audio?url=' +
          Uri.encodeComponent(ttsUrl);
    }

    return StrongsEntry(
      strongsId:       j['strongs_id'] as String? ?? '',
      language:        lang,
      originalWord:    orig,
      transliteration: j['transliteration'] as String? ?? '',
      rootWord:        j['root_word'] as String?,
      pronunciation:   j['pronunciation'] as String?,
      audioUrl:        audio,
      definitionEn:    j['definition_en'] as String? ?? '',
      kjvUsage:        j['kjv_usage'] as String?,
      definitionAr:    j['definition_ar'] as String?,
      notesAr:         j['notes_ar'] as String?,
      pronunciationAr: j['pronunciation_ar'] as String?,
      arIsVerified:    (j['ar_is_verified'] as bool?) ?? false,
    );
  }

  bool get isHebrew       => language == 'hebrew';
  bool get hasArabicDef   => (definitionAr != null && definitionAr!.isNotEmpty) || (notesAr != null && notesAr!.isNotEmpty);
}
