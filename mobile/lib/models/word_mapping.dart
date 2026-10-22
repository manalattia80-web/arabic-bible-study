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
  final String? grammarNotes;
  final String? relationType;

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
    this.grammarNotes,
    this.relationType,
  });

  factory WordMapping.fromJson(Map<String, dynamic> j) {
    final orig = j['orig_word']?.toString() ?? '-';
    final lang = j['orig_word_lang']?.toString() ?? 'hebrew';
    final isHeb = lang == 'hebrew' || lang == 'aramaic';

    String? audio;
    final rawAudio = j['audio_url']?.toString();
    if (rawAudio != null && rawAudio.trim().isNotEmpty && !rawAudio.contains('arabic-bible-study.vercel.app')) {
      audio = rawAudio;
    } else if (orig.trim().isNotEmpty && orig != '-' && orig != '—' && !orig.contains('---')) {
      final cleanOrig = orig.replaceAll(RegExp(r'[\.,;:!?׃־—–\[\]\(\)\{\}\x22\x27״׳·]'), '').trim();
      final langCode = isHeb ? 'iw' : 'el';
      audio = 'https://translate.google.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(cleanOrig)}&tl=$langCode&client=tw-ob';
    }

    final rawIsVerified = j['is_verified'];
    final sId = j['strongs_id']?.toString().trim();
    final hasValidStrongs = sId != null && sId.isNotEmpty && sId != '---' && sId != '-';
    final bool isVerified = rawIsVerified == true || rawIsVerified == 1 || rawIsVerified == '1' ||
        hasValidStrongs ||
        (orig.trim().isNotEmpty && orig != '-' && orig != '—' && !orig.contains('---'));

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
      strongsId:          hasValidStrongs ? sId : null,
      audioUrl:           audio,
      audioDurationMs:    (j['audio_duration_ms'] is int)
          ? j['audio_duration_ms'] as int
          : int.tryParse(j['audio_duration_ms']?.toString() ?? ''),
      isVerified:         isVerified,
      grammarNotes:       j['grammar_notes']?.toString(),
      relationType:       j['relation_type']?.toString(),
    );
  }

  bool get hasAudio    => audioUrl != null && audioUrl!.isNotEmpty;
  bool get hasStrongs  => strongsId != null && strongsId!.isNotEmpty && strongsId != '---' && strongsId != '-';
  bool get isHebrew    => origWordLang == 'hebrew';
  bool get isAramaic   => origWordLang.toLowerCase() == 'aramaic';
}
