// lib/models/word_mapping.dart
class WordMapping {
  final String  id;
  final String  verseId;
  final int     arWordPosition;
  final int     origWordPosition;
  final String  arWord;
  final String? arWordNormalized;
  final String  origWord;
  final String  origWordLang;    // 'hebrew' | 'greek'
  final String? origMorphology;
  final String? transliterationAr;
  final String? transliterationLat;
  final String? strongsId;
  final String? audioUrl;
  final int?    audioDurationMs;
  final bool    isVerified;

  const WordMapping({
    required this.id,
    required this.verseId,
    required this.arWordPosition,
    required this.origWordPosition,
    required this.arWord,
    this.arWordNormalized,
    required this.origWord,
    required this.origWordLang,
    this.origMorphology,
    this.transliterationAr,
    this.transliterationLat,
    this.strongsId,
    this.audioUrl,
    this.audioDurationMs,
    required this.isVerified,
  });

  factory WordMapping.fromJson(Map<String, dynamic> j) {
    final orig = j['orig_word']?.toString() ?? '-';
    final lang = j['orig_word_lang']?.toString() ?? 'hebrew';
    final isHeb = lang == 'hebrew' || lang == 'aramaic';

    String? audio;
    final rawAudio = j['audio_url']?.toString();
    if (rawAudio != null && rawAudio.trim().isNotEmpty) {
      audio = 'https://arabic-bible-study.vercel.app/api/v1/audio?url=' +
          Uri.encodeComponent(rawAudio
              .replaceAll('translate.google.com', 'translate.googleapis.com')
              .replaceAll('client=tw-ob', 'client=gtx'));
    } else if (orig.trim().isNotEmpty && orig != '-' && orig != '—' && !orig.contains('---')) {
      final langCode = isHeb ? 'iw' : 'el';
      final ttsUrl =
          'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(orig.trim())}&tl=$langCode&client=gtx';
      audio = 'https://arabic-bible-study.vercel.app/api/v1/audio?url=' +
          Uri.encodeComponent(ttsUrl);
    }

    final rawIsVerified = j['is_verified'];
    final bool isVerified = rawIsVerified == true || rawIsVerified == 1 || rawIsVerified == '1';

    return WordMapping(
      id:                 j['id']?.toString() ?? '',
      verseId:            j['verse_id']?.toString() ?? '',
      arWordPosition:     (j['ar_word_position'] is int)
          ? j['ar_word_position'] as int
          : (int.tryParse(j['ar_word_position']?.toString() ?? '') ?? 0),
      origWordPosition:   (j['orig_word_position'] is int)
          ? j['orig_word_position'] as int
          : (int.tryParse(j['orig_word_position']?.toString() ?? '') ?? 0),
      arWord:             j['ar_word']?.toString() ?? '-',
      arWordNormalized:   j['ar_word_normalized']?.toString(),
      origWord:           orig,
      origWordLang:       lang,
      origMorphology:     j['orig_morphology']?.toString(),
      transliterationAr:  j['transliteration_ar']?.toString(),
      transliterationLat: j['transliteration_lat']?.toString(),
      strongsId:          j['strongs_id']?.toString(),
      audioUrl:           audio,
      audioDurationMs:    (j['audio_duration_ms'] is int)
          ? j['audio_duration_ms'] as int
          : int.tryParse(j['audio_duration_ms']?.toString() ?? ''),
      isVerified:         isVerified,
    );
  }

  bool get hasAudio    => audioUrl != null && audioUrl!.isNotEmpty;
  bool get hasStrongs  => strongsId != null && strongsId!.isNotEmpty;
  bool get isHebrew    => origWordLang == 'hebrew' || origWordLang == 'aramaic';
}
