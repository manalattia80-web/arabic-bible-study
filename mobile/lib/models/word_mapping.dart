// lib/models/word_mapping.dart
class WordMapping {
  final String  id;
  final String  verseId;
  final int     arWordPosition;
  final int     origWordPosition;
  final String  arWord;
  final String? arWordNormalized;
  final String  origWord;
  final String? origSurface;
  final String  origWordLang;    // 'hebrew' | 'greek'
  final String? origMorphology;
  final String? morphPos;
  final String? morphStem;
  final String? morphTense;
  final String? morphVoice;
  final String? morphMood;
  final String? morphPerson;
  final String? morphNumber;
  final String? morphGender;
  final String? morphCase;
  final String? transliterationAr;
  final String? transliterationLat;
  final String? strongsId;
  final List<String> strongsIds;
  final String? audioUrl;
  final int?    audioDurationMs;
  final bool    isVerified;
  final String? verifiedSource;
  final String? verifiedAt;
  final String? verifiedLocator;
  final String? morphSource;
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
    this.origSurface,
    required this.origWordLang,
    this.origMorphology,
    this.morphPos,
    this.morphStem,
    this.morphTense,
    this.morphVoice,
    this.morphMood,
    this.morphPerson,
    this.morphNumber,
    this.morphGender,
    this.morphCase,
    this.transliterationAr,
    this.transliterationLat,
    this.strongsId,
    this.strongsIds = const [],
    this.audioUrl,
    this.audioDurationMs,
    required this.isVerified,
    this.verifiedSource,
    this.verifiedAt,
    this.verifiedLocator,
    this.morphSource,
    this.grammarNotes,
    this.relationType,
  });

  factory WordMapping.fromJson(Map<String, dynamic> j) {
    final orig = j['orig_word']?.toString() ?? '-';
    final surf = j['orig_surface']?.toString();
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
    final vSource = j['verified_source']?.toString().trim();
    final sId = j['strongs_id']?.toString().trim();
    final hasValidStrongs = sId != null && sId.isNotEmpty && sId != '---' && sId != '-';
    // Strict provenance rule: only mark verified when explicitly reviewed with a recorded source.
    final bool isVerified = (rawIsVerified == true || rawIsVerified == 1 || rawIsVerified == '1') &&
        vSource != null &&
        vSource.isNotEmpty;

    final List<String> allStrongs = [];
    final rawAllStrongs = j['all_strongs_ids']?.toString();
    if (rawAllStrongs != null && rawAllStrongs.isNotEmpty) {
      for (final part in rawAllStrongs.split(',')) {
        final pt = part.trim();
        if (pt.isNotEmpty && pt != '-' && pt != '---' && !allStrongs.contains(pt)) {
          allStrongs.add(pt);
        }
      }
    }
    if (allStrongs.isEmpty && hasValidStrongs) {
      allStrongs.add(sId);
    }

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
      origSurface:        (surf != null && surf.trim().isNotEmpty) ? surf.trim() : null,
      origWordLang:       lang,
      origMorphology:     j['orig_morphology']?.toString(),
      morphPos:           j['morph_pos']?.toString(),
      morphStem:          j['morph_stem']?.toString(),
      morphTense:         j['morph_tense']?.toString(),
      morphVoice:         j['morph_voice']?.toString(),
      morphMood:          j['morph_mood']?.toString(),
      morphPerson:        j['morph_person']?.toString(),
      morphNumber:        j['morph_number']?.toString(),
      morphGender:        j['morph_gender']?.toString(),
      morphCase:          j['morph_case']?.toString(),
      transliterationAr:  j['transliteration_ar']?.toString(),
      transliterationLat: j['transliteration_lat']?.toString(),
      strongsId:          hasValidStrongs ? sId : null,
      strongsIds:         allStrongs,
      audioUrl:           audio,
      audioDurationMs:    (j['audio_duration_ms'] is int)
          ? j['audio_duration_ms'] as int
          : int.tryParse(j['audio_duration_ms']?.toString() ?? ''),
      isVerified:         isVerified,
      verifiedSource:     (vSource != null && vSource.isNotEmpty) ? vSource : null,
      verifiedAt:         j['verified_at']?.toString(),
      verifiedLocator:    j['verified_locator']?.toString(),
      morphSource:        j['morph_source']?.toString(),
      grammarNotes:       j['grammar_notes']?.toString(),
      relationType:       j['relation_type']?.toString(),
    );
  }

  bool get hasAudio    => audioUrl != null && audioUrl!.isNotEmpty;
  bool get hasStrongs  => strongsId != null && strongsId!.isNotEmpty && strongsId != '---' && strongsId != '-';
  bool get isHebrew    => origWordLang == 'hebrew';
  bool get isAramaic   => origWordLang.toLowerCase() == 'aramaic';
}
