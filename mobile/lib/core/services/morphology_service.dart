// lib/core/services/morphology_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive Biblical Hebrew (WLC) and Koine Greek (Robinson / MorphGNT)
// Morphology & Syntax Analyzer.
// Translates and analyzes grammatical structures into clear, scholarly Arabic.
// ─────────────────────────────────────────────────────────────────────────────

class MorphologyAnalysis {
  final String rawCode;
  final String language; // 'greek' | 'hebrew' | 'aramaic'
  final String partOfSpeech; // نوع الكلمة (فعل، اسم، صفة، ...)
  final String? tense; // الزمن (مضارع، ماضٍ تام، ماضٍ بسيط أورست، أمر...)
  final String? voice; // البناء (مبني للمعلوم، للمجهول، متوسط ديبوننت...)
  final String? mood; // الصيغة (إخبارية، أمر، شرطية، مصدرية...)
  final String? grammaticalCase; // الحالة الإعرابية (رفع، نصب، جر، قابل، منادى)
  final String? gender; // الجنس (مذكر، مؤنث، محايد في اليونانية، مشترك)
  final String? number; // العدد (مفرد، جمع، مثنى، جمع التعظيم)
  final String? person; // الضمير والفاعل (متكلم، مخاطب، غائب)
  final String? stem; // الوزن في العبرية (قال، نيفعل، بيعل، هفعيل...)
  final List<String> prefixes; // زوائد وحروف متصلة (واو العطف، هاء التعريف...)
  final String summary; // جملة إعرابية وتحليلية موجزة بالفصحى
  final List<String> tags; // كلمات دلالية للبطاقات السريعة (Badges)
  final String? morphSource; // 'manual_review' | 'oshb_wlc' | 'morphgnt_sblgnt' | 'syntactic_ar'
  final String? verifiedLocator;

  const MorphologyAnalysis({
    required this.rawCode,
    required this.language,
    required this.partOfSpeech,
    this.tense,
    this.voice,
    this.mood,
    this.grammaticalCase,
    this.gender,
    this.number,
    this.person,
    this.stem,
    this.prefixes = const [],
    required this.summary,
    required this.tags,
    this.morphSource,
    this.verifiedLocator,
  });

  bool get isVerb => partOfSpeech.contains('فعل');
  bool get isNoun => partOfSpeech.contains('اسم') && !partOfSpeech.contains('إشارة') && !partOfSpeech.contains('استفهام');
  bool get hasDetailedAnalysis =>
      tense != null || mood != null || grammaticalCase != null || stem != null;
}

class MorphologyService {
  MorphologyService._();

  /// Analyzes Biblical Hebrew and Koine Greek words deterministically.
  /// Priority 1: Structured morphological columns (`morph_pos`, `morph_stem`,
  /// `morph_tense`, `morph_voice`, `morph_mood`, `morph_person`, `morph_number`,
  /// `morph_gender`, `morph_case`, `orig_surface`) stored in SQLite, from which
  /// the Arabic labels and prose summary are generated without inspecting Arabic notes.
  /// Priority 2: Standard Robinson / WLC morphological codes (`orig_morphology`).
  /// Priority 3: Surface/lemma fallback for unseeded dynamic tokens.
  static MorphologyAnalysis parse({
    String? code,
    String language = 'greek',
    String? fallbackDefinition,
    String? arWord,
    String? origWord,
    String? origSurface,
    String? strongsId,
    String? lemmaWord,
    String? grammarNotes,
    String? morphPos,
    String? morphStem,
    String? morphTense,
    String? morphVoice,
    String? morphMood,
    String? morphPerson,
    String? morphNumber,
    String? morphGender,
    String? morphCase,
    String? morphSource,
    String? verifiedLocator,
  }) {
    final cleanCode = (code ?? '').trim();
    final lang = language.toLowerCase();
    final sTrim = (strongsId ?? '').trim();
    final hasValidStrongs = RegExp(r'^[HG]\d+$', caseSensitive: false).hasMatch(sTrim);
    final surfaceTrim = (origSurface ?? '').trim();
    final effectiveOrig = (surfaceTrim.isNotEmpty && surfaceTrim != '-' && surfaceTrim != '—' && surfaceTrim != '---')
        ? surfaceTrim
        : (origWord ?? '').trim();
    final isSuppliedOrArabicOnly = effectiveOrig.isEmpty ||
        effectiveOrig == '-' ||
        effectiveOrig == '—' ||
        effectiveOrig == '---' ||
        RegExp(r'^[\u0600-\u06FF\s\.,;:!?«»()\[\]]+$').hasMatch(effectiveOrig);

    final isHebrew = lang == 'hebrew' || lang == 'aramaic' || (hasValidStrongs && sTrim.toUpperCase().startsWith('H'));

    // ── Priority 1: Structured Morphological Columns (Zero prose parsing) ──
    final posClean = (morphPos ?? '').trim().toLowerCase();
    if (posClean.isNotEmpty) {
      return _fromStructuredColumns(
        posKey: posClean,
        stemKey: morphStem?.trim().toLowerCase(),
        tenseKey: morphTense?.trim().toLowerCase(),
        voiceKey: morphVoice?.trim().toLowerCase(),
        moodKey: morphMood?.trim().toLowerCase(),
        personKey: morphPerson?.trim().toLowerCase(),
        numberKey: morphNumber?.trim().toLowerCase(),
        genderKey: morphGender?.trim().toLowerCase(),
        caseKey: morphCase?.trim().toLowerCase(),
        code: cleanCode,
        lang: lang,
        isHebrew: isHebrew,
        origSurface: (surfaceTrim.isNotEmpty && surfaceTrim != '-' && surfaceTrim != '—' && surfaceTrim != '---')
            ? surfaceTrim
            : null,
        origWord: effectiveOrig,
        lemmaWord: lemmaWord,
        strongsId: hasValidStrongs ? sTrim.toUpperCase() : null,
        arWord: arWord,
        fallbackDef: fallbackDefinition,
        syntacticNote: (posClean == 'syntactic_ar') ? grammarNotes : null,
        morphSource: morphSource,
        verifiedLocator: verifiedLocator,
      );
    }

    // Never invent Hebrew/Greek Strong's or root analyses for Arabic-only syntactic tokens
    if (!hasValidStrongs && isSuppliedOrArabicOnly) {
      final noteSummary = (grammarNotes != null && grammarNotes.trim().isNotEmpty)
          ? grammarNotes.trim()
          : 'عنصر نحوي في الصياغة العربية لاستقامة التركيب وأداء معنى الجملة، ولا تقابله كلمة معجمية مستقلة في النص الأصلي.';
      return MorphologyAnalysis(
        rawCode: 'SYNTAX-AR',
        language: lang,
        partOfSpeech: 'أداة / لفظ في التركيب العربي',
        summary: noteSummary,
        tags: const ['تركيب عربي', 'دون مقابل معجمي مستقل'],
      );
    }

    // ── Priority 2: Standard Robinson / WLC Morphological Codes ──
    if (cleanCode.isNotEmpty && cleanCode != '-' && cleanCode != '—') {
      final parsed = (isHebrew || cleanCode.contains('/') || cleanCode.startsWith('H'))
          ? _parseHebrewCode(cleanCode, lang)
          : _parseGreekCode(cleanCode, lang);
      if (parsed.hasDetailedAnalysis) {
        return parsed;
      }
    }

    // ── Priority 3: Non-speculative fallback for unreviewed tokens ──
    final formText = (effectiveOrig.isNotEmpty && effectiveOrig != '-' && effectiveOrig != '—')
        ? ' للصيغة الأصلية ($effectiveOrig)'
        : '';
    final sText = hasValidStrongs ? ' للمدخل المعجمي ($sTrim)' : '';
    return MorphologyAnalysis(
      rawCode: cleanCode.isNotEmpty ? cleanCode : (sTrim.isNotEmpty ? sTrim : 'UNVERIFIED'),
      language: lang,
      partOfSpeech: 'قيد المراجعة السياقية',
      summary: 'التحليل الصرفي السياقي الدقيق$formText$sText قيد المراجعة والتحقيق مقابل المدونات النصية المعتمدة، ولا يُعرض له تصنيف تخميني غير موثق.',
      tags: const ['قيد المراجعة السياقية', 'دون تخمين آلي'],
      morphSource: null,
      verifiedLocator: verifiedLocator,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STRUCTURED MORPHOLOGY GENERATOR (توليد التحليل والشرح من الحقول المنظمة)
  // ───────────────────────────────────────────────────────────────────────────
  static const Map<String, String> _structuredStemLabels = {
    'qal':       'وزن قال المجرد (Qal)',
    'niphal':    'وزن نيفعل المطاوع / المجهول (Niphal)',
    'piel':      'وزن بيعل المشدد (Piel)',
    'pual':      'وزن بوعل المجهول المشدد (Pual)',
    'hiphil':    'وزن هفعيل السببي (Hiphil)',
    'hophal':    'وزن هوفعل السببي المجهول (Hophal)',
    'hithpael':  'وزن هيثباعل الانعكاسي (Hithpael)',
    'peal':      'وزن بعل الآرامي المجرد (Peal)',
    'pael':      'وزن باعل الآرامي المشدد (Pael)',
    'haphel':    'وزن هفعل الآرامي السببي (Haphel)',
    'aphel':     'وزن أفعل الآرامي السببي (Aphel)',
    'hithpeel':  'وزن هيثبعل الآرامي المطاوع (Hithpeel)',
    'hithpaal':  'وزن هيثباعل الآرامي المطاوع (Hithpaal)',
  };

  static const Map<String, String> _structuredTenseLabels = {
    'present':    'المضارع / الحاضر (Present)',
    'imperfect':  'الماضي المستمر / الناقص (Imperfect)',
    'aorist':     'الأوريست (Aorist)',
    'future':     'المستقبل (Future)',
    'perfect':    'الماضي التام (Perfect)',
    'pluperfect': 'الماضي الأتم (Pluperfect)',
    'qatal':      'الماضي التام العبري (Qatal / Perfect)',
    'yiqtol':     'المضارع / المستقبل العبري (Yiqtol / Imperfect)',
    'wayyiqtol':  'الماضي السردي المتتابع (Wayyiqtol)',
    'weqatal':    'التام المقترن بالواو المتتابعة (Weqatal)',
  };

  static const Map<String, String> _structuredVoiceLabels = {
    'active':           'مبني للمعلوم (Active)',
    'causative_active': 'مبني للمعلوم السببي (Causative Active)',
    'passive':          'مبني للمجهول (Passive)',
    'middle':           'البناء المتوسط (Middle)',
    'middle_passive':   'متوسط أو مجهول الصيغة (Middle / Passive)',
    'middle_deponent':  'متوسط الصيغة فاعلي المعنى (Middle Deponent)',
    'passive_deponent': 'مجهول الصيغة فاعلي المعنى (Passive Deponent)',
  };

  static const Map<String, String> _structuredMoodLabels = {
    'indicative':           'الصيغة الإخبارية (Indicative)',
    'subjunctive':          'صيغة الاحتمال / الغاية (Subjunctive)',
    'optative':             'صيغة التمني (Optative)',
    'imperative':           'صيغة الأمر (Imperative)',
    'infinitive':           'صيغة المصدر (Infinitive)',
    'infinitive_construct': 'المصدر المضاف العبري (Infinitive Construct)',
    'infinitive_absolute':  'المصدر المطلق العبري (Infinitive Absolute)',
    'participle':           'اسم فاعل / مفعول (Participle)',
    'jussive':              'صيغة الجزم والطلب (Jussive)',
    'cohortative':          'صيغة الحث والطلب الذاتي (Cohortative)',
  };

  static const Map<String, String> _structuredPersonLabels = {
    '1': 'المتكلم (1st Person)',
    '2': 'المخاطب (2nd Person)',
    '3': 'الغائب (3rd Person)',
  };

  static const Map<String, String> _structuredNumberLabels = {
    'singular': 'مفرد (Singular)',
    'plural':   'جمع (Plural)',
    'dual':     'مثنى (Dual)',
  };

  static const Map<String, String> _structuredGenderLabels = {
    'masculine': 'مذكر (Masculine)',
    'feminine':  'مؤنث (Feminine)',
    'neuter':    'محايد (Neuter)',
    'common':    'مشترك (Common)',
  };

  static const Map<String, String> _structuredCaseLabels = {
    'nominative':  'حالة الرفع (Nominative)',
    'accusative':  'حالة النصب (Accusative)',
    'genitive':    'حالة الجر والإضافة (Genitive)',
    'dative':      'حالة القابل (Dative)',
    'vocative':    'حالة النداء (Vocative)',
    'construct':   'حالة الإضافة العبرية (Construct)',
    'absolute':    'الحالة المطلقة (Absolute)',
    'directional': 'مقترن بهاء الاتجاه (Directional He)',
  };

  static List<String> _detectHebrewSurfacePrefixes(String surfaceWord, String? strongsId) {
    final cons = surfaceWord.replaceAll(RegExp(r'[\u0591-\u05C7]'), '').trim();
    if (cons.length <= 1) return const [];
    int? sNum;
    if (strongsId != null && strongsId.startsWith('H')) {
      sNum = int.tryParse(strongsId.substring(1));
    }
    final isBetRoot = (sNum != null && sNum >= 872 && sNum <= 1369);
    final isLamedRoot = (sNum != null && sNum >= 3734 && sNum <= 4003);
    final isKafRoot = (sNum != null && sNum >= 3427 && sNum <= 3733);
    final isMemRoot = (sNum != null && sNum >= 4004 && sNum <= 4880);

    final prefixes = <String>[];
    if (surfaceWord.startsWith('וַיּ') || surfaceWord.startsWith('וַיְ') || surfaceWord.startsWith('וַתּ') || surfaceWord.startsWith('וָא') || surfaceWord.startsWith('וַנִּ')) {
      prefixes.add('واو السرد المتتابعة (Wayyiqtol)');
    } else if (cons.startsWith('ו') && cons.length > 2) {
      prefixes.add('واو العطف (וְ)');
    }
    if (surfaceWord.startsWith('הַ') || surfaceWord.startsWith('הָ') || surfaceWord.startsWith('הֶ')) {
      prefixes.add('هاء التعريف (הַ)');
    }
    if (!isBetRoot && (surfaceWord.startsWith('בְּ') || surfaceWord.startsWith('בַּ') || surfaceWord.startsWith('בִּ'))) {
      prefixes.add('باء الجر والظرفية (בְּ)');
    }
    if (!isLamedRoot && (surfaceWord.startsWith('לְ') || surfaceWord.startsWith('לַ') || surfaceWord.startsWith('לִ'))) {
      prefixes.add('لام الجر والملكية (לְ)');
    }
    if (!isKafRoot && (surfaceWord.startsWith('כְּ') || surfaceWord.startsWith('כַּ'))) {
      prefixes.add('كاف التشبيه (כְּ)');
    }
    if (!isMemRoot && (surfaceWord.startsWith('מִ') || surfaceWord.startsWith('מֵ'))) {
      prefixes.add('ميم الابتداء (מִן)');
    }
    return prefixes;
  }

  static MorphologyAnalysis _fromStructuredColumns({
    required String posKey,
    required String? stemKey,
    required String? tenseKey,
    required String? voiceKey,
    required String? moodKey,
    required String? personKey,
    required String? numberKey,
    required String? genderKey,
    required String? caseKey,
    required String code,
    required String lang,
    required bool isHebrew,
    required String? origSurface,
    required String origWord,
    required String? lemmaWord,
    required String? strongsId,
    required String? arWord,
    required String? fallbackDef,
    required String? syntacticNote,
    String? morphSource,
    String? verifiedLocator,
  }) {
    if (posKey == 'syntactic_ar') {
      final noteSummary = (syntacticNote != null && syntacticNote.trim().isNotEmpty)
          ? syntacticNote.trim()
          : 'عنصر نحوي في الصياغة العربية لاستقامة التركيب وأداء معنى الجملة، ولا تقابله كلمة معجمية مستقلة في النص الأصلي.';
      return MorphologyAnalysis(
        rawCode: 'SYNTAX-AR',
        language: lang,
        partOfSpeech: 'أداة / لفظ في التركيب العربي',
        summary: noteSummary,
        tags: const ['تركيب عربي', 'دون مقابل معجمي مستقل'],
        morphSource: 'syntactic_ar',
        verifiedLocator: verifiedLocator,
      );
    }

    final langAdj = lang == 'aramaic'
        ? 'آرامي'
        : (isHebrew ? 'عبري' : 'يوناني');
    final langFemAdj = lang == 'aramaic'
        ? 'آرامية'
        : (isHebrew ? 'عبرية' : 'يونانية');

    final stemLabel   = (stemKey != null && stemKey.isNotEmpty)     ? _structuredStemLabels[stemKey]     : null;
    final tenseLabel  = (tenseKey != null && tenseKey.isNotEmpty)   ? _structuredTenseLabels[tenseKey]   : null;
    final voiceLabel  = (voiceKey != null && voiceKey.isNotEmpty)   ? _structuredVoiceLabels[voiceKey]   : null;
    final moodLabel   = (moodKey != null && moodKey.isNotEmpty)     ? _structuredMoodLabels[moodKey]     : null;
    final personLabel = (personKey != null && personKey.isNotEmpty) ? _structuredPersonLabels[personKey] : null;
    final numberLabel = (numberKey != null && numberKey.isNotEmpty) ? _structuredNumberLabels[numberKey] : null;
    final genderLabel = (genderKey != null && genderKey.isNotEmpty) ? _structuredGenderLabels[genderKey] : null;
    final caseLabel   = (caseKey != null && caseKey.isNotEmpty)     ? _structuredCaseLabels[caseKey]     : null;

    final hasStructuredInflection = stemLabel != null ||
        tenseLabel != null ||
        voiceLabel != null ||
        moodLabel != null ||
        personLabel != null ||
        numberLabel != null ||
        genderLabel != null ||
        caseLabel != null;

    // If a Robinson/WLC code is stored and structured inflection fields were not yet populated, parse the code
    if (!hasStructuredInflection && code.isNotEmpty && code != '-' && code != '—') {
      final parsed = (isHebrew || code.contains('/') || code.startsWith('H'))
          ? _parseHebrewCode(code, lang)
          : _parseGreekCode(code, lang);
      if (parsed.hasDetailedAnalysis) return parsed;
    }

    final prefixes = (isHebrew && origSurface != null)
        ? _detectHebrewSurfacePrefixes(origSurface, strongsId)
        : const <String>[];

    // Map structured part-of-speech key to scholarly Arabic label
    String posLabel;
    switch (posKey) {
      case 'verb':
        if (!hasStructuredInflection && origSurface == null) {
          posLabel = 'فعل $langAdj (المدخل المعجمي)';
        } else {
          posLabel = 'فعل $langAdj';
        }
        break;
      case 'noun':
        posLabel = 'اسم $langAdj';
        break;
      case 'proper_noun':
        posLabel = 'اسم علم';
        break;
      case 'adjective':
        posLabel = 'صفة $langFemAdj';
        break;
      case 'pronoun':
        posLabel = 'ضمير $langAdj';
        break;
      case 'relative_pronoun':
        posLabel = 'اسم موصول $langAdj';
        break;
      case 'demonstrative':
        posLabel = 'اسم إشارة $langAdj';
        break;
      case 'article':
        posLabel = 'أداة تعريف $langFemAdj';
        break;
      case 'preposition':
        posLabel = 'حرف جر $langAdj';
        break;
      case 'conjunction':
        posLabel = 'حرف عطف / أداة ربط';
        break;
      case 'particle':
        posLabel = 'أداة نحوية $langFemAdj';
        break;
      case 'adverb':
        posLabel = 'ظرف $langAdj';
        break;
      case 'numeral':
        posLabel = 'اسم عدد $langAdj';
        break;
      default:
        posLabel = 'مفردة $langFemAdj';
    }

    // Build tags deterministically from structured columns
    final tags = <String>[
      posLabel,
      if (stemLabel != null) stemLabel,
      if (tenseLabel != null) tenseLabel,
      if (voiceLabel != null) voiceLabel,
      if (moodLabel != null) moodLabel,
      if (caseLabel != null) caseLabel,
      if (personLabel != null) personLabel,
      if (numberLabel != null) numberLabel,
      if (genderLabel != null) genderLabel,
    ];

    // Generate clean Arabic grammatical summary strictly from structured columns
    final formShown = (origSurface != null && origSurface.isNotEmpty)
        ? origSurface
        : ((origWord.isNotEmpty && origWord != '-' && origWord != '—' && origWord != '---') ? origWord : '');

    final details = <String>[
      if (stemLabel != null) 'على $stemLabel',
      if (tenseLabel != null) 'في $tenseLabel',
      if (voiceLabel != null) voiceLabel,
      if (moodLabel != null) moodLabel,
      if (caseLabel != null) 'في $caseLabel',
      if (personLabel != null) 'لـ$personLabel',
      if (numberLabel != null) numberLabel,
      if (genderLabel != null) genderLabel,
    ];

    final sumBuf = StringBuffer();
    if (!hasStructuredInflection && posKey == 'verb' && origSurface == null) {
      sumBuf.write('المدخل المعجمي للفعل${formShown.isNotEmpty ? " ($formShown)" : ""}؛ وتُراجع صيغته الصرفية السياقية في النص الأصلي للآية.');
    } else {
      sumBuf.write(posLabel);
      if (formShown.isNotEmpty) {
        sumBuf.write(' ($formShown)');
      }
      if (details.isNotEmpty) {
        sumBuf.write(': ${details.join('، ')}');
      }
      if (prefixes.isNotEmpty) {
        sumBuf.write('، مقترن بـ: ${prefixes.join(' و ')}');
      }
      sumBuf.write('.');
    }

    return MorphologyAnalysis(
      rawCode: code.isNotEmpty ? code : (strongsId ?? posKey.toUpperCase()),
      language: lang,
      partOfSpeech: posLabel,
      stem: stemLabel,
      tense: tenseLabel,
      voice: voiceLabel,
      mood: moodLabel,
      grammaticalCase: caseLabel,
      person: personLabel,
      number: numberLabel,
      gender: genderLabel,
      prefixes: prefixes,
      summary: sumBuf.toString(),
      tags: tags,
      morphSource: morphSource,
      verifiedLocator: verifiedLocator,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GREEK MORPHOLOGY CODE PARSER (Robinson / MorphGNT standard)
  // Format examples: V-PAI-3S, N-NSM, A-APF, T-GSM, PREP, CONJ, ADV
  // ───────────────────────────────────────────────────────────────────────────
  static MorphologyAnalysis _parseGreekCode(String raw, String lang) {
    final parts = raw.toUpperCase().split('-');
    final posCode = parts[0];
    final detail1 = parts.length > 1 ? parts[1] : '';
    final detail2 = parts.length > 2 ? parts[2] : '';

    String pos = _greekPosMap[posCode] ?? 'كلمة يونانية';
    String? tense;
    String? voice;
    String? mood;
    String? gCase;
    String? number;
    String? gender;
    String? person;
    final tags = <String>[];

    tags.add(pos);

    if (posCode == 'V') {
      if (detail1.length >= 3) {
        tense = _greekTenseMap[detail1[0]];
        voice = _greekVoiceMap[detail1[1]];
        mood  = _greekMoodMap[detail1[2]];
        if (tense != null) tags.add(tense);
        if (voice != null) tags.add(voice);
        if (mood != null) tags.add(mood);
      }

      if (detail2.isNotEmpty) {
        if (detail2.length == 2 && RegExp(r'^[123][SP]$').hasMatch(detail2)) {
          person = _greekPersonMap[detail2[0]];
          number = _greekNumberMap[detail2[1]];
          if (person != null && number != null) tags.add('$person $number');
        } else if (detail2.length >= 3) {
          gCase  = _greekCaseMap[detail2[0]];
          number = _greekNumberMap[detail2[1]];
          gender = _greekGenderMap[detail2[2]];
          if (gCase != null) tags.add(gCase);
          if (number != null && gender != null) tags.add('$gender $number');
        }
      } else if (detail1.length >= 6) {
        gCase  = _greekCaseMap[detail1[3]];
        number = _greekNumberMap[detail1[4]];
        gender = _greekGenderMap[detail1[5]];
        if (gCase != null) tags.add(gCase);
        if (number != null && gender != null) tags.add('$gender $number');
      }
    } else if (['N', 'A', 'T', 'P', 'R', 'C', 'D', 'I', 'X', 'Q', 'F', 'S'].contains(posCode)) {
      final chunk = detail1.isNotEmpty ? detail1 : '';
      if (chunk.length >= 3) {
        gCase  = _greekCaseMap[chunk[0]];
        number = _greekNumberMap[chunk[1]];
        gender = _greekGenderMap[chunk[2]];
        if (gCase != null) tags.add(gCase);
        if (gender != null && number != null) tags.add('$gender $number');
      }
    }

    final summaryBuffer = StringBuffer(pos);
    if (tense != null) summaryBuffer.write(' في زمن $tense');
    if (voice != null) summaryBuffer.write('، $voice');
    if (mood != null) summaryBuffer.write(' ($mood)');
    if (gCase != null) summaryBuffer.write(' في $gCase');
    if (gender != null && number != null) {
      summaryBuffer.write(' ($gender $number)');
    } else if (number != null) {
      summaryBuffer.write(' ($number)');
    }
    if (person != null) summaryBuffer.write(' للـ$person');

    return MorphologyAnalysis(
      rawCode: raw,
      language: 'greek',
      partOfSpeech: pos,
      tense: tense,
      voice: voice,
      mood: mood,
      grammaticalCase: gCase,
      gender: gender,
      number: number,
      person: person,
      summary: summaryBuffer.toString(),
      tags: tags,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HEBREW MORPHOLOGY CODE PARSER (Groves-Wheeler / WLC standard)
  // Handles prefixes like C/ (Conjunction), H/ (Article), HR/ (Preposition)
  // ───────────────────────────────────────────────────────────────────────────
  static MorphologyAnalysis _parseHebrewCode(String raw, String lang) {
    final prefixes = <String>[];
    final tags = <String>[];
    String core = raw;

    while (core.contains('/')) {
      final slashIdx = core.indexOf('/');
      final pre = core.substring(0, slashIdx);
      core = core.substring(slashIdx + 1);

      if (pre == 'C') {
        prefixes.add('واو العطف (Conjunction)');
        tags.add('واو عطف');
      } else if (pre == 'H' || pre == 'HT') {
        prefixes.add('هاء التعريف (Definite Article)');
        tags.add('أداة تعريف');
      } else if (pre == 'R' || pre == 'HR') {
        prefixes.add('حرف جر متصل (Preposition)');
        tags.add('حرف جر');
      } else if (pre == 'd') {
        prefixes.add('ظرف / أداة (Adverbial)');
      }
    }

    String pos = 'كلمة عبرية';
    String? stem;
    String? tense;
    String? gender;
    String? number;
    String? person;

    if (core.startsWith('V')) {
      pos = 'فعل (Verb)';
      tags.add('فعل');
      final clean = core.replaceAll('-', '');
      if (clean.length >= 3) {
        stem = _hebrewStemMap[clean[1]];
        tense = _hebrewConjMap[clean[2]];
        if (stem != null) tags.add(stem);
        if (tense != null) tags.add(tense);
      }
      if (clean.length >= 6) {
        person = _hebrewPersonMap[clean[3]];
        gender = _hebrewGenderMap[clean[4]];
        number = _hebrewNumberMap[clean[5]];
        if (person != null && gender != null && number != null) {
          tags.add('$person $gender $number');
        }
      }
    } else if (core.startsWith('N')) {
      pos = 'اسم (Noun)';
      tags.add('اسم');
      final clean = core.replaceAll('-', '');
      if (clean.length >= 3) {
        gender = _hebrewGenderMap[clean[1]] ?? _hebrewGenderMap[clean[2]];
        number = _hebrewNumberMap[clean[2]] ?? _hebrewNumberMap[clean[3]];
        if (gender != null && number != null) tags.add('$gender $number');
      }
    } else if (core.startsWith('A')) {
      pos = 'صفة (Adjective)';
      tags.add('صفة');
    } else if (core.startsWith('P')) {
      pos = 'ضمير (Pronoun)';
      tags.add('ضمير');
    } else if (core.startsWith('R')) {
      pos = 'حرف جر (Preposition)';
      tags.add('حرف جر');
    } else if (core.startsWith('C')) {
      pos = 'حرف عطف (Conjunction)';
      tags.add('حرف عطف');
    } else if (core.startsWith('D')) {
      pos = 'ظرف (Adverb)';
      tags.add('ظرف');
    }

    final summaryBuffer = StringBuffer(pos);
    if (stem != null) summaryBuffer.write(' على $stem');
    if (tense != null) summaryBuffer.write(' في صيغة $tense');
    if (person != null) summaryBuffer.write(' للـ$person');
    if (gender != null && number != null) {
      summaryBuffer.write(' ($gender $number)');
    }
    if (prefixes.isNotEmpty) {
      summaryBuffer.write(' متصل به: ${prefixes.join(' و ')}');
    }

    return MorphologyAnalysis(
      rawCode: raw,
      language: lang == 'aramaic' ? 'aramaic' : 'hebrew',
      partOfSpeech: pos,
      tense: tense,
      stem: stem,
      gender: gender,
      number: number,
      person: person,
      prefixes: prefixes,
      summary: summaryBuffer.toString(),
      tags: tags,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DICTIONARY MAPS (Scholarly Arabic translations)
  // ───────────────────────────────────────────────────────────────────────────
  static const _greekPosMap = {
    'V':    'فعل (Verb)',
    'N':    'اسم (Noun)',
    'A':    'صفة (Adjective)',
    'T':    'أداة تعريف (Definite Article)',
    'P':    'ضمير شخصي (Personal Pronoun)',
    'R':    'ضمير وصل (Relative Pronoun)',
    'C':    'ضمير تبادلي (Reciprocal Pronoun)',
    'D':    'اسم إشارة (Demonstrative Pronoun)',
    'I':    'اسم استفهام (Interrogative Pronoun)',
    'X':    'اسم نكرة غير محدد (Indefinite Pronoun)',
    'Q':    'ضمير مترابط (Correlative Pronoun)',
    'F':    'ضمير انعكاسي (Reflexive Pronoun)',
    'S':    'ضمير ملكية (Possessive Pronoun)',
    'ADV':  'ظرف / حال (Adverb)',
    'CONJ': 'حرف عطف وربط (Conjunction)',
    'PREP': 'حرف جر (Preposition)',
    'PRT':  'أداة تأكيد ونفي (Particle)',
    'INJ':  'أداة تعجب ونداء (Interjection)',
    'ARAM': 'لفظ آرامي في الأصل',
    'HEB':  'لفظ عبري في الأصل',
  };

  static const _greekTenseMap = {
    'P': 'المضارع / الحاضر المستمر (Present)',
    'I': 'الماضي المستمر / الناقص (Imperfect)',
    'F': 'المستقبل (Future)',
    'A': 'الماضي البسيط / الأورست (Aorist)',
    'X': 'التام / الحاضر التام (Perfect)',
    'R': 'التام / الحاضر التام (Perfect)',
    'Y': 'الماضي التام / الأسبق (Pluperfect)',
    'L': 'الماضي التام / الأسبق (Pluperfect)',
  };

  static const _greekVoiceMap = {
    'A': 'مبني للمعلوم (Active Voice)',
    'M': 'صيغة متوسطة (Middle Voice)',
    'P': 'مبني للمجهول (Passive Voice)',
    'D': 'متوسط ديبوننت معناه معلوم (Middle Deponent)',
    'O': 'مجهول ديبوننت معناه معلوم (Passive Deponent)',
    'N': 'صيغة ديبوننت (Middle/Passive Deponent)',
  };

  static const _greekMoodMap = {
    'I': 'صيغة إخبارية واقعية (Indicative)',
    'S': 'صيغة شرطية احتمالية (Subjunctive)',
    'O': 'صيغة تمنٍ ورجاء (Optative)',
    'M': 'صيغة أمر (Imperative)',
    'D': 'صيغة أمر (Imperative)',
    'N': 'صيغة مصدرية (Infinitive)',
    'P': 'اسم فاعل أو مفعول (Participle)',
  };

  static const _greekCaseMap = {
    'N': 'حالة الرفع - فاعل أو مبتدأ (Nominative)',
    'G': 'حالة الجر والإضافة - مضاف إليه أو ملكية (Genitive)',
    'D': 'حالة القابل - مفعول غير مباشر أو مجرور (Dative)',
    'A': 'حالة النصب - مفعول به مباشر (Accusative)',
    'V': 'حالة النداء (Vocative)',
  };

  static const _greekNumberMap = {
    'S': 'مفرد (Singular)',
    'P': 'جمع (Plural)',
    'D': 'مثنى (Dual)',
  };

  static const _greekGenderMap = {
    'M': 'مذكر (Masculine)',
    'F': 'مؤنث (Feminine)',
    'N': 'محايد في الأصل اليوناني (Neuter)',
  };

  static const _greekPersonMap = {
    '1': 'المتكلم (أنا / نحن)',
    '2': 'المخاطب (أنتَ / أنتم)',
    '3': 'الغائب (هو / هي / هم)',
  };

  // Hebrew Binyanim (الأوزان الصرفية)
  static const _hebrewStemMap = {
    'q': 'وزن قال البسيط المجرد (Qal Stem)',
    'n': 'وزن نيفعل المطاوع المجرد (Niphal Stem)',
    'p': 'وزن بيعل المزيد المشدد المكثف (Piel Stem)',
    'P': 'وزن بوعل مبني للمجهول المشدد (Pual Stem)',
    'h': 'وزن هفعيل السببي المتعدي (Hiphil Stem)',
    'H': 'وزن هوفعل المجهول السببي (Hophal Stem)',
    't': 'وزن هيثباعل الانعكاسي المطاوع (Hithpael Stem)',
  };

  // Hebrew Conjugations (الأزمنة والتصريف)
  static const _hebrewConjMap = {
    'p': 'الزمن التام / الماضي المكتمل (Perfect / Qatal)',
    'i': 'الزمن الناقص / المضارع والمستقبل (Imperfect / Yiqtol)',
    'w': 'الماضي المتتابع بواو العطف (Wayyiqtol)',
    'v': 'صيغة الأمر (Imperative)',
    'r': 'اسم فاعل نشط (Active Participle)',
    's': 'اسم مفعول (Passive Participle)',
    'a': 'المصدر المطلق التوكيدي (Infinitive Absolute)',
    'c': 'المصدر المضاف المقيد (Infinitive Construct)',
  };

  static const _hebrewPersonMap = {
    '1': 'المتكلم (أنا / نحن)',
    '2': 'المخاطب (أنتَ / أنتم)',
    '3': 'الغائب (هو / هي / هم)',
  };

  static const _hebrewGenderMap = {
    'm': 'مذكر',
    'f': 'مؤنث',
    'c': 'مشترك',
  };

  static const _hebrewNumberMap = {
    's': 'مفرد',
    'p': 'جمع',
    'd': 'مثنى',
  };
}
