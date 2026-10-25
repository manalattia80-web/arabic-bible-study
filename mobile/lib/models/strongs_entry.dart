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
  // Arabic translation & 3-layer separation
  final String? definitionAr;
  final String? notesAr;
  final String? lexicalDefAr;
  final String? contextualUsageAr;
  final String? editorialCommentaryAr;
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
    this.lexicalDefAr,
    this.contextualUsageAr,
    this.editorialCommentaryAr,
    this.pronunciationAr,
    required this.arIsVerified,
  });

  factory StrongsEntry.fromJson(Map<String, dynamic> j) {
    final orig = j['original_word']?.toString() ?? '';
    final lang = j['language']?.toString() ?? 'hebrew';
    final isHeb = lang == 'hebrew' || lang == 'aramaic';

    String? audio;
    final rawAudio = j['audio_url']?.toString();
    if (rawAudio != null && rawAudio.trim().isNotEmpty) {
      final replaced = rawAudio
          .replaceAll('translate.google.com', 'translate.googleapis.com')
          .replaceAll('client=tw-ob', 'client=gtx');
      audio = 'https://arabic-bible-study.vercel.app/api/v1/audio?url=${Uri.encodeComponent(replaced)}';
    } else if (orig.trim().isNotEmpty) {
      final langCode = isHeb ? 'iw' : 'el';
      final ttsUrl =
          'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(orig.trim())}&tl=$langCode&client=gtx';
      audio = 'https://arabic-bible-study.vercel.app/api/v1/audio?url=${Uri.encodeComponent(ttsUrl)}';
    }

    final rawIsVerified = j['ar_is_verified'];
    final bool arIsVerified = rawIsVerified == true || rawIsVerified == 1 || rawIsVerified == '1';

    return StrongsEntry(
      strongsId:       j['strongs_id']?.toString() ?? '',
      language:        lang,
      originalWord:    orig,
      transliteration: j['transliteration']?.toString() ?? '',
      rootWord:        j['root_word']?.toString(),
      pronunciation:   j['pronunciation']?.toString(),
      audioUrl:        audio,
      definitionEn:          j['definition_en']?.toString() ?? '',
      kjvUsage:              j['kjv_usage']?.toString(),
      definitionAr:          j['definition_ar']?.toString(),
      notesAr:               j['notes_ar']?.toString(),
      lexicalDefAr:          j['lexical_def_ar']?.toString(),
      contextualUsageAr:     j['contextual_usage_ar']?.toString(),
      editorialCommentaryAr: j['editorial_commentary_ar']?.toString(),
      pronunciationAr:       j['pronunciation_ar']?.toString(),
      arIsVerified:          arIsVerified,
    );
  }

  bool get isHebrew       => language == 'hebrew';
  bool get isAramaic      => language == 'aramaic' || definitionEn.contains('(Aramaic)');
  bool get hasArabicDef   =>
      (lexicalDefAr != null && lexicalDefAr!.trim().isNotEmpty) ||
      (definitionAr != null && definitionAr!.trim().isNotEmpty) ||
      (contextualUsageAr != null && contextualUsageAr!.trim().isNotEmpty) ||
      (notesAr != null && notesAr!.trim().isNotEmpty) ||
      (editorialCommentaryAr != null && editorialCommentaryAr!.trim().isNotEmpty);
}
