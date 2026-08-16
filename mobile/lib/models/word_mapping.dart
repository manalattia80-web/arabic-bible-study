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

  factory WordMapping.fromJson(Map<String, dynamic> j) => WordMapping(
    id:                 j['id'] as String,
    verseId:            j['verse_id'] as String,
    arWordPosition:     j['ar_word_position'] as int,
    origWordPosition:   j['orig_word_position'] as int,
    arWord:             j['ar_word'] as String,
    arWordNormalized:   j['ar_word_normalized'] as String?,
    origWord:           j['orig_word'] as String,
    origWordLang:       j['orig_word_lang'] as String,
    origMorphology:     j['orig_morphology'] as String?,
    transliterationAr:  j['transliteration_ar'] as String?,
    transliterationLat: j['transliteration_lat'] as String?,
    strongsId:          j['strongs_id'] as String?,
    audioUrl:           j['audio_url'] as String?,
    audioDurationMs:    j['audio_duration_ms'] as int?,
    isVerified:         (j['is_verified'] as bool?) ?? false,
  );

  bool get hasAudio    => audioUrl != null && audioUrl!.isNotEmpty;
  bool get hasStrongs  => strongsId != null && strongsId!.isNotEmpty;
  bool get isHebrew    => origWordLang == 'hebrew' || origWordLang == 'aramaic';
}
