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

    // ── Priority 3: Direct Original-Script Fallback (No Arabic-prose inspection) ──
    if (isHebrew) {
      return _analyzeBiblicalHebrew(
        origWord: effectiveOrig,
        arWord: arWord,
        strongsId: strongsId,
        fallbackDef: fallbackDefinition,
        lang: lang,
        lemmaWord: lemmaWord,
      );
    } else {
      return _analyzeBiblicalGreek(
        origWord: effectiveOrig,
        arWord: arWord,
        strongsId: strongsId,
        fallbackDef: fallbackDefinition,
        lang: lang,
        lemmaWord: lemmaWord,
      );
    }
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
  // BIBLICAL HEBREW ANALYZER (الأصل العبري للعهد القديم)
  // ───────────────────────────────────────────────────────────────────────────
  static MorphologyAnalysis _analyzeBiblicalHebrew({
    required String origWord,
    required String? arWord,
    required String? strongsId,
    required String? fallbackDef,
    required String lang,
    String? lemmaWord,
  }) {
    // Strip Hebrew cantillation and vowel points for consonant root detection
    final cons = origWord.replaceAll(RegExp(r'[\u0591-\u05C7]'), '').trim();
    final def = (fallbackDef ?? '').toLowerCase();
    final prefixes = <String>[];
    final tags = <String>[];

    int? sNum;
    if (strongsId != null && strongsId.startsWith('H')) {
      sNum = int.tryParse(strongsId.substring(1));
    }

    final isBetRoot = (sNum != null && sNum >= 872 && sNum <= 1369) ||
        cons == 'בהמה' || cons == 'בקר' || cons == 'ברית' || cons == 'ברא' ||
        cons == 'בית' || cons == 'בשר' || cons == 'בן' || cons == 'בכור' || cons == 'ברכה';
    final isLamedRoot = (sNum != null && sNum >= 3734 && sNum <= 4003) ||
        cons == 'לב' || cons == 'לבב' || cons == 'לילה' || cons == 'לקח' || cons == 'לשון';
    final isKafRoot = (sNum != null && sNum >= 3427 && sNum <= 3733) ||
        cons == 'כבוד' || cons == 'כלב' || cons == 'כי' || cons == 'כל' || cons == 'כסף';
    final isMemRoot = (sNum != null && sNum >= 4004 && sNum <= 4880) ||
        cons == 'מים' || cons == 'מלך' || cons == 'מצרים' || cons == 'מקום';

    // Detect Inseparable Hebrew Prefixes (الزوائد العبرية المتصلة)
    bool isWayyiqtol = false;
    if (origWord.startsWith('וַיּ') || origWord.startsWith('וַיְ') || origWord.startsWith('וַתּ') || origWord.startsWith('וָא') || origWord.startsWith('וַנִּ')) {
      isWayyiqtol = true;
      prefixes.add('واو العطف المتتابعة للسرد (Wayyiqtol / Waw Consecutive)');
    } else if (cons.startsWith('ו') && cons.length > 2) {
      prefixes.add('واو العطف (Conjunctive Waw וְ)');
    }

    if (origWord.startsWith('הַ') || origWord.startsWith('הָ') || origWord.startsWith('הֶ')) {
      prefixes.add('هاء التعريف العبرية (Definite Article הַ)');
    }
    if (!isBetRoot && (origWord.startsWith('בְּ') || origWord.startsWith('בַּ') || origWord.startsWith('בִּ'))) {
      prefixes.add('باء الجر والظرفية (Inseparable Bet בְּ)');
    }
    if (!isLamedRoot && (origWord.startsWith('לְ') || origWord.startsWith('לַ') || origWord.startsWith('לִ'))) {
      prefixes.add('لام الملكية والغاية والجر (Inseparable Lamed לְ)');
    }
    if (!isKafRoot && (origWord.startsWith('כְּ') || origWord.startsWith('כַּ'))) {
      prefixes.add('كاف التشبيه (Inseparable Kaf כְּ)');
    }
    if (!isMemRoot && (origWord.startsWith('מִ') || origWord.startsWith('מֵ'))) {
      prefixes.add('ميم الابتداء والتبعيض (Preposition Mem מִ)');
    }

    final arClean = (arWord ?? '').replaceAll(RegExp(r'[\u064B-\u065F\u0670\.,;:!?«»()\[\]]'), '').trim();
    final isArVerb = _isArabicVerb(arClean);

    // Hebrew Prepositions (حروف الجر العبرية)
    if (cons == 'ב' || (arClean == 'في' && cons.length <= 1)) {
      final pos = 'حرف جر وظرفية عبري أصيل (Inseparable Bet בְּ)';
      tags.addAll(['حرف جر', 'ظرفية', 'عبري']);
      if (prefixes.isNotEmpty) tags.addAll(prefixes);
      return MorphologyAnalysis(
        rawCode: 'PREP-HEB',
        language: 'hebrew',
        partOfSpeech: pos,
        prefixes: prefixes,
        summary: 'حرف جر وظرفية عبري أصيل (باء الجر בְּ)، يلحق صدراً بالكلمات ليفيد الظرفية والحلول والمكانية.',
        tags: tags,
      );
    }

    if (arClean == 'و' || cons == 'ו' || (cons.length == 1 && cons.startsWith('ו'))) {
      final pos = 'واو العطف والاستئناف (Conjunctive Waw וְ)';
      tags.addAll(['حرف عطف', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'CONJ-HEB',
        language: 'hebrew',
        partOfSpeech: pos,
        prefixes: prefixes,
        summary: 'واو العطف والاستئناف والربط في العبرية، تفيد تتابع السرد وربط الجمل والمفردات.',
        tags: tags,
      );
    }

    // Negative Particle (أداة نفي לֹא / אַל)
    final isNegative = strongsId == 'H3808' || strongsId == 'H408' ||
        (cons == 'לא' && (arClean == 'لا' || arClean == 'ما' || arClean == 'كلا' || arClean == 'غير' || arClean == 'ليس')) ||
        (cons == 'אל' && strongsId == 'H408') ||
        (cons == 'אל' && (arClean == 'لا' || arClean == 'ما' || arClean == 'كلا') && strongsId != 'H410' && strongsId != 'H413');
    if (isNegative) {
      final pos = 'أداة نفي جازمة (Negative Particle - לֹא / אַל)';
      tags.addAll(['أداة نفي', 'عبري']);
      return MorphologyAnalysis(
        rawCode: strongsId ?? 'PRT-NEG',
        language: 'hebrew',
        partOfSpeech: pos,
        summary: 'أداة نفي عبرية أصيلة، تفيد نفي الفعل أو النهي القاطع في مقاصد الوحي الإلهي.',
        tags: tags,
      );
    }

    // El - Divine Title (اسم الجلالة إيل אֵל)
    if (strongsId == 'H410' || (cons == 'אל' && (arClean == 'الله' || arClean == 'إله' || arClean == 'الاه' || def.contains('god')))) {
      final pos = 'اسم إلهي / لقب الجلالة (Divine Title - El אֵל)';
      tags.addAll(['اسم إلهي', 'مذكر', 'مفرد', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H410',
        language: 'hebrew',
        partOfSpeech: pos,
        gender: 'مذكر في الأصل العبري (Masculine)',
        number: 'مفرد (Singular)',
        prefixes: prefixes,
        summary: 'لقب الجلالة في الأصل العبري (إيل אֵל) الدال على القوة المطلقة والسيادة الإلهية.',
        tags: tags,
      );
    }

    // El - Preposition (إلى / نحو אֶל)
    if (strongsId == 'H413' || (cons == 'אל' && (arClean == 'الى' || arClean == 'إلى' || arClean == 'نحو' || def.contains('unto') || def.contains('towards')))) {
      final pos = 'حرف جر وتوجه وغائية (Preposition El אֶל)';
      tags.addAll(['حرف جر', 'توجه', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H413',
        language: 'hebrew',
        partOfSpeech: pos,
        prefixes: prefixes,
        summary: 'حرف جر عبري أصيل (إِل אֶל)، يفيد التوجه وحركة الغاية نحو الهدف والمقصد.',
        tags: tags,
      );
    }

    if (arClean == 'ان' || arClean == 'إن' || arClean == 'أن' || cons == 'כי' || strongsId == 'H3588') {
      final pos = 'أداة ربط وتعليل وتوكيد (Conjunction - כִּי)';
      tags.addAll(['أداة ربط', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H3588',
        language: 'hebrew',
        partOfSpeech: pos,
        summary: 'أداة ربط وتعليل وتوكيد عبرية أصيلة (كِي כִּי)، تفتتح الجمل التقريرية والتفسيرية لإعلان الحقائق والعلل.',
        tags: tags,
      );
    }

    // Direct Object Marker (أداة المفعول به المباشر את / ואת)
    if (strongsId == 'H853' || ((cons == 'את' || cons == 'ואת') && strongsId != 'H854' && strongsId != 'H859' && strongsId != 'H226' && arClean != 'انت' && arClean != 'أنت' && arClean != 'مع')) {
      final pos = 'أداة المفعول به المباشر (Direct Object Marker)';
      tags.addAll(['أداة نحوية', 'مفعول به', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H853',
        language: 'hebrew',
        partOfSpeech: pos,
        prefixes: prefixes,
        summary: 'أداة نحوية عبرية أصيلة (אֵת) تشير إلى المفعول به المباشر المحدد في الجملة.',
        tags: tags,
      );
    }

    // Tetragrammaton (الاسم الإلهي يهوه יהוה)
    if (cons == 'יהוה' || cons == 'وיהוה' || (strongsId == 'H3068')) {
      final pos = 'الاسم الإلهي (The Tetragrammaton - YHWH)';
      tags.addAll(['اسم علم إلهي', 'مذكر', 'مفرد', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H3068',
        language: 'hebrew',
        partOfSpeech: pos,
        gender: 'مذكر في الأصل العبري (Masculine)',
        number: 'مفرد (Singular)',
        prefixes: prefixes,
        summary: 'الاسم الإلهي الخاص في العهد القديم، مشتق من جذر الكينونة (הָיָה) الدال على الوجود الدائم ("أَهْيَه").',
        tags: tags,
      );
    }

    // Elohim (اسم الجلالة אֱלֹהִים)
    if (cons == 'אלהים' || cons == 'ואלהים' || (strongsId == 'H430')) {
      final pos = 'اسم الجلالة (Divine Title - Elohim)';
      tags.addAll(['اسم إلهي', 'جمع', 'مذكر', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H430',
        language: 'hebrew',
        partOfSpeech: pos,
        gender: 'مذكر في الأصل العبري (Masculine)',
        number: 'جمع (Plural)',
        prefixes: prefixes,
        summary: 'اسم في الأصل العبري، جاء بصيغة جمع (Plural)، ويأخذ فعلاً مفرداً.',
        tags: tags,
      );
    }

    // Check if it's a Verb (الأفعال العبرية)
    final isExplicitVerbDef = def.startsWith('a primitive root') || def.startsWith('to ') || def.contains('; to ') || def.contains('a verb,') || def.contains('(verb)');
    final isDerivedNoun = def.contains('from ') && (def.contains('root') || def.contains('primitive'));
    final isDefVerb = isExplicitVerbDef && !isDerivedNoun;
    final isKnownHebVerb = cons == 'ברא' || cons == 'אמר' || cons == 'עשה' || cons == 'נתן' || cons == 'היה' || cons == 'ידע' || cons == 'ראה' || cons == 'שמע';
    if (isWayyiqtol || (isDefVerb && isArVerb) || (isArVerb && isKnownHebVerb) || (isExplicitVerbDef && !def.contains('noun') && !isDerivedNoun)) {
      final lemmaCons = lemmaWord != null ? lemmaWord.replaceAll(RegExp(r'[\u0591-\u05C7]'), '').trim() : '';
      if (!isWayyiqtol && lemmaCons.isNotEmpty && cons == lemmaCons) {
        return MorphologyAnalysis(
          rawCode: strongsId ?? 'V-LEMMA',
          language: lang,
          partOfSpeech: 'فعل عبري (المدخل المعجمي)',
          summary: 'المدخل المعجمي للفعل العبري ($origWord)؛ وتُراجع صيغته الصرفية السياقية في النص العبري للآية.',
          tags: const ['فعل عبري', 'مدخل معجمي'],
        );
      }
      final pos = 'فعل عبري (Hebrew Verb)';
      String stem = 'وزن قال البسيط المجرد (Qal Stem)';
      String voice = 'مبني للمعلوم (Active Voice)';
      String tense;
      String mood = 'صيغة إخبارية واقعية (Indicative)';
      String person;
      String number;
      String gender;

      // Stem detection (الأوزان الصرفية العبرية)
      if (cons.startsWith('נת') || cons.startsWith('הת') || def.contains('hithpael')) {
        stem = 'وزن هيثباعل الانعكاسي (Hithpael Stem)';
        voice = 'انعكاسي مطاوع مشدد (Reflexive)';
      } else if (cons.startsWith('ה') && (origWord.contains('ִ') || origWord.contains('י')) || def.contains('hiphil')) {
        stem = 'وزن هفعيل السببي المتعدي (Hiphil Stem)';
        voice = 'مبني للمعلوم السببي (Causative Active)';
      } else if (cons.startsWith('נ') && cons.length >= 4 || def.contains('niphal')) {
        stem = 'وزن نيفعل المطاوع / المجهول (Niphal Stem)';
        voice = 'مبني للمجهول أو مطاوع (Passive / Middle)';
      } else if (def.contains('piel')) {
        stem = 'وزن بيعل المزيد المشدد (Piel Stem)';
        voice = 'مبني للمعلوم المكثف (Intensive Active)';
      } else if (def.contains('pual')) {
        stem = 'وزن بوعل المجهول المشدد (Pual Stem)';
        voice = 'مبني للمجهول المكثف (Intensive Passive)';
      }

      // Conjugation / Tense detection
      if (isWayyiqtol) {
        tense = 'الماضي المتتابع بالسرد (Wayyiqtol / Past Consecutive)';
        person = 'الغائب المفرد (هو - 3rd Person Singular)';
        number = 'مفرد (Singular)';
        gender = 'مذكر (Masculine)';
      } else if (cons.startsWith('י') && cons.length >= 3) {
        tense = 'الزمن الناقص / المضارع والمستقبل (Imperfect / Yiqtol)';
        if (cons.endsWith('ו')) {
          person = 'الغائبون الجمع (هم - 3rd Person Plural)';
          number = 'جمع (Plural)';
          gender = 'مذكر (Masculine)';
        } else {
          person = 'الغائب المفرد (هو - 3rd Person Singular)';
          number = 'مفرد (Singular)';
          gender = 'مذكر (Masculine)';
        }
      } else if (cons.startsWith('ת') && cons.length >= 3) {
        tense = 'الزمن الناقص / المضارع والمستقبل (Imperfect / Yiqtol)';
        person = 'الغائبة (هي) أو المخاطب (أنتَ)';
        number = 'مفرد (Singular)';
        gender = 'مؤنث أو مذكر';
      } else {
        tense = 'الزمن التام / الماضي المكتمل (Perfect / Qatal)';
        if (cons.endsWith('ו')) {
          person = 'الغائبون الجمع (هم - 3rd Person Plural)';
          number = 'جمع (Plural)';
          gender = 'مشترك (Common)';
        } else if (cons.endsWith('ה')) {
          person = 'الغائبة المفردة (هي - 3rd Person Feminine)';
          number = 'مفرد (Singular)';
          gender = 'مؤنث (Feminine)';
        } else if (cons.endsWith('תי')) {
          person = 'المتكلم المفرد (أنا - 1st Person Singular)';
          number = 'مفرد (Singular)';
          gender = 'مشترك (Common)';
        } else if (cons.endsWith('ת')) {
          person = 'المخاطب المفرد (أنتَ - 2nd Person Masculine)';
          number = 'مفرد (Singular)';
          gender = 'مذكر (Masculine)';
        } else {
          person = 'الغائب المفرد (هو - 3rd Person Singular)';
          number = 'مفرد (Singular)';
          gender = 'مذكر (Masculine)';
        }
      }

      tags.addAll(['فعل عبري', stem, tense, number, gender, voice]);

      final sumBuf = StringBuffer();
      sumBuf.write('فعل عبري على $stem، في $tense، $voice، للـ$person، في صيغة الـ$number الـ$gender');
      if (prefixes.isNotEmpty) {
        sumBuf.write('، مقترن بـ: ${prefixes.join(' و ')}');
      }
      sumBuf.write('.');

      return MorphologyAnalysis(
        rawCode: strongsId ?? '',
        language: 'hebrew',
        partOfSpeech: pos,
        tense: tense,
        voice: voice,
        mood: mood,
        person: person,
        number: number,
        gender: gender,
        stem: stem,
        prefixes: prefixes,
        summary: sumBuf.toString(),
        tags: tags,
      );
    }

    // Nouns, Adjectives, Prepositions in Hebrew
    String pos = 'اسم عبري (Hebrew Noun)';
    String number = 'مفرد (Singular)';
    String gender = 'مذكر في الأصل العبري (Masculine)';

    if (def.contains('preposition')) {
      pos = 'حرف جر عبري (Preposition)';
      tags.addAll(['حرف جر', 'عبري']);
      return MorphologyAnalysis(
        rawCode: strongsId ?? '',
        language: 'hebrew',
        partOfSpeech: pos,
        prefixes: prefixes,
        summary: 'حرف جر عبري أصيل، يفيد الربط والظرفية والدلالة في النص.',
        tags: tags,
      );
    } else if (def.contains('conjunction')) {
      pos = 'حرف عطف وربط (Conjunction)';
      tags.addAll(['حرف عطف', 'عبري']);
      return MorphologyAnalysis(
        rawCode: strongsId ?? '',
        language: 'hebrew',
        partOfSpeech: pos,
        prefixes: prefixes,
        summary: 'حرف عطف وربط عبري مبني في سياق الآية.',
        tags: tags,
      );
    } else if (def.contains('proper name')) {
      pos = 'اسم علم كتابي (Proper Name)';
      gender = def.contains('woman') ? 'مؤنث في الأصل العبري (Feminine)' : 'مذكر في الأصل العبري (Masculine)';
    } else if (def.contains('adjective')) {
      pos = 'صفة / نعت (Adjective)';
    }

    // Hebrew Noun Number & Gender
    if (cons.endsWith('ים')) {
      number = (cons == 'שמים' || cons == 'השמים' || cons == 'מים' || cons == 'המים' || cons == 'עינים' || cons == 'ידים')
          ? 'مثنى / جمع (Dual / Plural)'
          : 'جمع (Plural)';
      gender = 'مذكر في الأصل العبري (Masculine)';
    } else if (cons.endsWith('ות')) {
      number = 'جمع (Plural)';
      gender = 'مؤنث في الأصل العبري (Feminine)';
    } else if (cons.endsWith('ה') || cons.endsWith('ת') || def.contains('feminine') ||
        ['ארץ', 'נפש', 'אש', 'עיר', 'יד', 'עין', 'רגל', 'שמש', 'חרב', 'אבן'].contains(cons)) {
      gender = 'مؤنث في الأصل العبري (Feminine)';
    }

    tags.addAll([pos, number, gender, 'عبري']);
    if (prefixes.isNotEmpty) tags.addAll(prefixes);

    final sumBuf = StringBuffer();
    sumBuf.write('$pos، في صيغة $number $gender في الأصل العبري');
    if (prefixes.isNotEmpty) {
      sumBuf.write('، مقترن بـ: ${prefixes.join(' و ')}');
    }
    sumBuf.write('.');

    return MorphologyAnalysis(
      rawCode: strongsId ?? '',
      language: 'hebrew',
      partOfSpeech: pos,
      number: number,
      gender: gender,
      prefixes: prefixes,
      summary: sumBuf.toString(),
      tags: tags,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────────────────────
  // BIBLICAL GREEK ANALYZER (الأصل اليوناني للعهد الجديد)
  // ───────────────────────────────────────────────────────────────────────────
  static String _normalizeGreek(String input) {
    if (input.isEmpty) return '';
    final buffer = StringBuffer();
    for (final rune in input.toLowerCase().runes) {
      final ch = String.fromCharCode(rune);
      if ('ἀἁἂἃἄἅἆἇὰάᾰᾱᾲᾳᾴᾶᾷά'.contains(ch)) {
        buffer.write('α');
      } else if ('ἐἑἒἓἔἕὲέέ'.contains(ch)) {
        buffer.write('ε');
      } else if ('ἠἡἢἣἤἥἦἧὴήᾐᾑᾒᾓᾔᾕᾖᾗῂῃῄῆῇή'.contains(ch)) {
        buffer.write('η');
      } else if ('ἰἱἲἳἴἵἶἷὶίῐῑῒΐῖῗϊΐί'.contains(ch)) {
        buffer.write('ι');
      } else if ('ὀὁὂὃὄὅὸόό'.contains(ch)) {
        buffer.write('ο');
      } else if ('ὐὑὒὓὔὕὖὗὺύῠῡῒΐῦῗϋΰύ'.contains(ch)) {
        buffer.write('υ');
      } else if ('ὠὡὢὣὤὥὦὧὼώᾠᾡᾢᾣᾤᾥᾦᾧῲῳῴῶῷώ'.contains(ch)) {
        buffer.write('ω');
      } else if ('ῤῥ'.contains(ch)) {
        buffer.write('ρ');
      } else if (RegExp(r'[\u0300-\u036F\u1DC0-\u1DFF\u1AB0-\u1AFF\.,;:!?׃־—–\[\]\(\)\{\}\x22\x27״׳·]').hasMatch(ch)) {
        continue;
      } else {
        buffer.write(ch);
      }
    }
    return buffer.toString().trim();
  }

  static MorphologyAnalysis _analyzeBiblicalGreek({
    required String origWord,
    required String? arWord,
    required String? strongsId,
    required String? fallbackDef,
    required String lang,
    String? lemmaWord,
  }) {
    final clean = _normalizeGreek(origWord);
    final arClean = (arWord ?? '').replaceAll(RegExp(r'[\u064B-\u065F\u0670\.,;:!?«»()\[\]]'), '').trim();
    final def = (fallbackDef ?? '').toLowerCase();
    final sId = (strongsId ?? '').trim().toUpperCase();
    final tags = <String>[];

    // 1. Greek Definite Article (أداة التعريف اليونانية)
    const articles = {
      'ο':    ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'مفرد (Singular)', 'مذكر في الأصل اليوناني (Masculine)'],
      'η':    ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'το':   ['أداة تعريف (Definite Article)', 'حالة الرفع أو النصب (Nom/Acc)', 'مفرد (Singular)', 'محايد في الأصل اليوناني (Neuter)'],
      'του':  ['أداة تعريف (Definite Article)', 'حالة الجر والإضافة (Genitive)', 'مفرد (Singular)', 'مذكر أو محايد (Masc/Neut)'],
      'της':  ['أداة تعريف (Definite Article)', 'حالة الجر والإضافة (Genitive)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'τω':   ['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'مفرد (Singular)', 'مذكر أو محايد (Masc/Neut)'],
      'τη':   ['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'τον':  ['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'مفرد (Singular)', 'مذكر في الأصل اليوناني (Masculine)'],
      'την':  ['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'οι':   ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'جمع (Plural)', 'مذكر في الأصل اليوناني (Masculine)'],
      'αι':   ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'جمع (Plural)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'τα':   ['أداة تعريف (Definite Article)', 'حالة الرفع أو النصب (Nom/Acc)', 'جمع (Plural)', 'محايد في الأصل اليوناني (Neuter)'],
      'των':  ['أداة تعريف (Definite Article)', 'حالة الجر والإضافة (Genitive)', 'جمع (Plural)', 'مشترك لجميع الأجناس'],
      'τοις': ['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'جمع (Plural)', 'مذكر أو محايد'],
      'ταις': ['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'جمع (Plural)', 'مؤنث'],
      'τους': ['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'جمع (Plural)', 'مذكر في الأصل اليوناني (Masculine)'],
      'τας':  ['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'جمع (Plural)', 'مؤنث في الأصل اليوناني (Feminine)'],
    };

    if ((articles.containsKey(clean) && sId != 'G2228') || (sId == 'G3588') || (arClean == 'ال' && sId != 'G2228')) {
      final info = articles[clean] ?? ['أداة تعريف (Definite Article)', 'حالة الرفع', 'مفرد', 'مذكر'];
      tags.addAll(['أداة تعريف', info[1], info[2], info[3], 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'T-${clean.toUpperCase()}',
        language: 'greek',
        partOfSpeech: info[0],
        grammaticalCase: info[1],
        number: info[2],
        gender: info[3],
        summary: 'أداة تعريف أصلية في لغة العهد الجديد اليونانية، في ${info[1]}، بصيغة الـ${info[2]} الـ${info[3]}.',
        tags: tags,
      );
    }

    // 2. Greek Prepositions (حروف الجر الأصلية في اليونانية)
    const greekPreps = {
      'εν':       ['حرف جر أصلي (Preposition)', 'يلازمه حالة القابل (Dative)', 'يفيد الاستقرار والظرفية والحلول الثابت'],
      'εις':      ['حرف جر أصلي (Preposition)', 'يلازمه حالة النصب (Accusative)', 'يفيد الحركة نحو والغاية والبلوغ'],
      'εκ':       ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الانبثاق والخروج من الأصل'],
      'εξ':       ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الانبثاق والخروج من الأصل'],
      'προς':     ['حرف جر أصلي (Preposition)', 'يلازمه حالة النصب (Accusative)', 'يفيد التوجه نحو والمعية الحميمة والمواجهة'],
      'δια':      ['حرف جر أصلي (Preposition)', 'مع النصب (لأجل) أو الجر (بواسطة)', 'يفيد الواسطة والعلية والسبب'],
      'μετα':     ['حرف جر أصلي (Preposition)', 'مع النصب (بعد) أو الجر (مع)', 'يفيد المعية والمصاحبة أو البعدية'],
      'περι':     ['حرف جر أصلي (Preposition)', 'مع الجر (عن) أو النصب (حول)', 'يفيد الإحاطة والموضوع المعني'],
      'κατα':     ['حرف جر أصلي (Preposition)', 'مع النصب (بحسب) أو الجر (ضد)', 'يفيد المطابقة والموافقة أو النزول'],
      'υπο':      ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الفاعلية والواسطة (بواسطة) أو التبعية'],
      'επι':      ['حرف جر أصلي (Preposition)', 'مع القابل أو النصب أو الجر', 'يفيد العلو والتمكين والاستناد على'],
      'απο':      ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الانفصال والابتعاد والمصدر (من وعن)'],
      'συν':      ['حرف جر أصلي (Preposition)', 'يلازمه حالة القابل (Dative)', 'يفيد الاشتراك والاتحاد والرفقة في الفعل'],
      'παρα':     ['حرف جر أصلي (Preposition)', 'مع القابل أو النصب أو الجر', 'يفيد القرب وبجانب ومن عند'],
      'υπερ':     ['حرف جر أصلي (Preposition)', 'مع الجر (لأجل/نيابة عن) أو النصب (فوق)', 'يفيد النيابة والشفاعة والعلو'],
      'αντι':     ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد البدل والتعويض (عوضاً عن / كفارة بدل)'],
      'προ':      ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الأسبقية الزمانية أو المكانية (قبل / أمام)'],
      'ανα':      ['حرف جر أصلي (Preposition)', 'يلازمه حالة النصب (Accusative)', 'يفيد التوزيع والصعود (في وسط / كذا كذا)'],
      'αχρι':     ['حرف جر وظرف غاية', 'يلازمه حالة الجر (Genitive)', 'يفيد بلوغ الغاية والمدى (إلى أن / حتى)'],
      'αχρις':    ['حرف جر وظرف غاية', 'يلازمه حالة الجر (Genitive)', 'يفيد بلوغ الغاية والمدى (إلى أن / حتى)'],
      'μεχρι':    ['حرف جر وظرف غاية', 'يلازمه حالة الجر (Genitive)', 'يفيد بلوغ الغاية والمدى (إلى أن / حتى)'],
      'μεχρις':   ['حرف جر وظرف غاية', 'يلازمه حالة الجر (Genitive)', 'يفيد بلوغ الغاية والمدى (إلى أن / حتى)'],
      'ενωπιον':  ['حرف جر شبه ظرفي (Improper Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الوقوف في حضرة / أمام عينيه'],
      'εμπροσθεν':['حرف جر شبه ظرفي', 'يلازمه حالة الجر (Genitive)', 'يفيد التقدم المكاني (قدام / أمام)'],
      'οπισω':    ['حرف جر شبه ظرفي', 'يلازمه حالة الجر (Genitive)', 'يفيد التبعية المكانية (وراء / خلف)'],
      'χωρις':    ['حرف جر شبه ظرفي', 'يلازمه حالة الجر (Genitive)', 'يفيد الانفصال التام (بدون / بمعزل عن)'],
      'ανευ':     ['حرف جر شبه ظرفي', 'يلازمه حالة الجر (Genitive)', 'يفيد النفي والمعزل (بغير / بدون)'],
      'εγγυς':    ['ظرف وحرف جر شبه ظرفي', 'يلازمه حالة الجر', 'يفيد القرب المكاني أو الزماني (قريب من)'],
    };

    const arPrepositions = {
      'في', 'من', 'الى', 'إلى', 'على', 'عن', 'مع', 'نحو', 'لدى', 'عند',
      'بين', 'تحت', 'فوق', 'أمام', 'امام', 'قدام', 'خلف', 'وراء', 'بدون',
      'بغير', 'حتى', 'لاجل', 'لأجل'
    };

    final isGreekPrepMatch = greekPreps.containsKey(clean) || def.startsWith('preposition') || def.contains('a preposition') ||
        (arPrepositions.contains(arClean) && clean.length <= 4 && !def.contains('pronoun') && !def.contains('verb') && !def.contains('noun') && sId != 'G3739' && sId != 'G5101');

    if (isGreekPrepMatch) {
      final info = greekPreps[clean] ?? ['حرف جر أصلي (Preposition)', 'ملازم لحالات الإعراب', 'يفيد الربط والدلالة والنسبة السياقية'];
      tags.addAll(['حرف جر', info[1], 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'PREP',
        language: 'greek',
        partOfSpeech: info[0],
        grammaticalCase: info[1],
        summary: '${info[0]} في لغة العهد الجديد الأصلية، ${info[1]}، ${info[2]}.',
        tags: tags,
      );
    }

    // 3. Greek Conjunctions (حروف العطف والربط)
    const greekConjs = {
      'και':    ['حرف عطف وتوكيد (Conjunction)', 'يفيد الربط والجمع والتوكيد المعنوي (و / أيضاً)'],
      'δε':     ['حرف عطف استدراكي / انتقالي', 'يفيد الانتقال أو الاستدراك اللطيف (وأما / ولكن)'],
      'αλλα':   ['حرف عطف استدراكي قوي', 'يفيد إبطال ما قبله وإثبات ما بعده (بل / ولكن بالحري)'],
      'οτι':    ['أداة ربط وتعليل وتفسير', 'تفيد التعليل أو تقديم الكلام المنقول (أن / لأن)'],
      'ινα':    ['أداة ربط غائية ومصدرية', 'تفيد القصد والغاية الحتمية (لكي / حتى)'],
      'γαρ':    ['أداة تعليل وتوضيح برهانية', 'تفيد تقديم العلة والبرهان (لأنه / إذ)'],
      'ουν':    ['أداة استنتاج ونتيجة منطقية', 'تفيد ترتيب النتيجة على المقدمة (فإذاً / بناءً عليه)'],
      'τε':     ['حرف عطف ملازم وتوكيدي', 'يفيد الربط الوثيق بين المتلازمات (و / كذا)'],
      'ειτε':   ['أداة تخيير وتفصيل', 'تفيد الترديد والتفصيل (إما / سواء كان)'],
      'εαν':    ['أداة شرط احتمالية وتوقع', 'تفيد تعليق الجواب على شرط محتمل الوقوع (إن / إذا)'],
      'ει':     ['أداة شرط حقيقية', 'تفيد الشرط الواقعي أو المفترض (إن / لو)'],
      'ειπερ':  ['أداة شرط توكيدية', 'تفيد تأكيد صحة الشرط (إن كان حقاً)'],
      'καθως':  ['أداة مطابقة ومقارنة', 'تفيد القياس والمطابقة (كما / نظير ما)'],
      'ωσπερ':  ['أداة تشبيه ومطابقة تامة', 'تفيد التشبيه المباشر (تماماً كما)'],
      'ως':     ['أداة مقارنة وحال وزمان', 'تفيد التشبيه أو الظرفية (كـ / كما / مثلما / حينما)'],
      'διο':    ['أداة استنتاج وسببية', 'تفيد السببية والنتيجة (لذلك / لهذا السبب)'],
      'διοτι':  ['أداة تعليل وسببية موكّدة', 'تفيد ذكر السبب المباشر (لأن / بما أن)'],
      'επαν':   ['أداة توقيت وشرط', 'تفيد التوقيت المستقبلي (متى / بعدما)'],
      'επει':   ['أداة تعليل وزمان', 'تفيد التعليل أو الظرفية (إذ / لما كان)'],
      'επειδη': ['أداة تعليل توكيدية', 'تفيد بيان الدافع والسبب (إذ أن / بما أن)'],
      'μεν':    ['أداة تمهيد وتوكيد', 'تفيد التمهيد لمقابلة قادمة (أما / من جهة)'],
      'μεντοι': ['أداة استدراك وتوكيد', 'تفيد الاستدراك مع التوكيد (مع ذلك / بيد أن)'],
      'ωστε':   ['أداة نتيجة وغاية', 'تفيد ترتيب الأثر والنتيجة (حتى أن / بحيث)'],
      'οπως':   ['أداة قصد ونصب وغائية', 'تفيد بلوغ الغاية والقصد (لكي / كيما)'],
      'πλην':   ['أداة استثناء واستدراك', 'تفيد الاستدراك والاستثناء (غير أن / إلا أن)'],
    };

    const arConjunctions = {
      'و', 'ثم', 'لكن', 'بل', 'فاذا', 'فإذا', 'فان', 'فإن', 'لذلك', 'اذن',
      'إذن', 'لانه', 'لأنه', 'اذ', 'إذ', 'كي', 'لكي', 'ام', 'أم', 'او', 'أو',
      'اما', 'إما', 'لو', 'ان', 'إن', 'بينما', 'غير أن'
    };

    final isGreekConjMatch = greekConjs.containsKey(clean) || def.startsWith('conjunction') || def.contains('a conjunction') ||
        (arConjunctions.contains(arClean) && clean.length <= 5 && !def.contains('pronoun') && !def.contains('verb') && !def.contains('noun') && sId != 'G3739' && sId != 'G5101');

    if (isGreekConjMatch) {
      final info = greekConjs[clean] ?? ['حرف عطف وربط (Conjunction)', 'يربط المفردات والجمل بالسياق'];
      tags.addAll(['حرف عطف', 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'CONJ',
        language: 'greek',
        partOfSpeech: info[0],
        summary: '${info[0]} في النص اليوناني الأصلي، ${info[1]}.',
        tags: tags,
      );
    }

    // 4. Greek Particles, Negatives & Interjections (أدوات النفي والتنبيه والتوكيد)
    const greekParticles = {
      'ου':     ['أداة نفي قطعية للواقع (Negative Particle)', 'تفيد نفي الواقعة يقيناً في الصيغة الإخبارية (لا / لم / ليس)'],
      'ουκ':    ['أداة نفي قطعية تسبق حرف علة غير منفوخ', 'تفيد النفي القاطع لواقع الحدث'],
      'ουχ':    ['أداة نفي قطعية تسبق تنفساً خشناً', 'تفيد النفي القاطع المباشر'],
      'ουχι':   ['أداة نفي توكيدية مشددة', 'تفيد النفي المطلق القاطع (كلا البتة / أليس كذلك؟)'],
      'μη':     ['أداة نفي احتمالية ونهي (Subjunctive/Imperative Negative)', 'تفيد النهي أو نفي الإمكانية والمشاعر'],
      'μηδε':   ['أداة نفي عاطفة للمفردات', 'تفيد نفي الملحق (ولا حتى / ولا أيضاً)'],
      'μητε':   ['أداة نفي مزدوجة متقابلة', 'تفيد النفي المزدوج المتسلسل (لا... ولا)'],
      'μηποτε': ['أداة تحذير ونفي احتمالي', 'تفيد التحوط والخشية (لئلا في أي وقت)'],
      'αν':     ['أداة شرط احتمالية ومطاوعة (Modal Particle)', 'تقترن بالشرط والفرض لتفيد الاحتمال الإمكاني'],
      'ιδου':   ['أداة لفت انتباه وتنبيه إعجازي (Demonstrative Particle - Behold)', 'تفيد استدعاء الانتباه البصري والذهني الفوري (هُوذا / انظر)'],
      'ιδε':    ['أداة تنبيه ومعاينة حية', 'تفيد لفت النظر المباشر للعيان (ها هو / انظر)'],
      'αμην':   ['أداة تصديق وتوكيد لاهوتي (Amen)', 'لفظ عبري أصيل أُقر في اليونانية يفيد الحق والثبات المطلق (آمين / حقاً)'],
      'ναι':    ['أداة إيجاب وتصديق (Yes / Verily)', 'تفيد الإقرار والموافقة التامة (نعم / أجل)'],
      'ω':      ['أداة نداء واستعطاف (Vocative Interjection)', 'تفيد النداء والتعجب والاستغاثة (يا)'],
    };

    const arParticles = {'لا', 'ما', 'لم', 'لن', 'ليس', 'هوذا', 'ها', 'كلا', 'نعم', 'امين', 'آمين', 'يا'};

    final isGreekParticleMatch = greekParticles.containsKey(clean) || def.contains('particle') || def.contains('interjection') ||
        (arParticles.contains(arClean) && !def.contains('pronoun') && !def.contains('verb') && sId != 'G3739' && sId != 'G5101');

    if (isGreekParticleMatch) {
      final info = greekParticles[clean] ?? ['أداة ونفي / توكيد وتنبيه (Particle)', 'تحدد نمط الدلالة ونبرة المعنى في الجملة'];
      tags.addAll(['أداة نحوية', 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'PRT',
        language: 'greek',
        partOfSpeech: info[0],
        summary: '${info[0]} في لغة العهد الجديد الأصلية، ${info[1]}.',
        tags: tags,
      );
    }

    // 5. Greek Pronouns & Demonstratives (الضمائر وأسماء الإشارة والموصول)
    const personalPronouns = {
      'εγω':  ['ضمير متكلم مفرد (أنا - 1S)', 'حالة الرفع (Nominative)'],
      'μου':  ['ضمير متكلم مفرد مضاف (لي / ي)', 'حالة الجر والإضافة (Genitive)'],
      'μοι':  ['ضمير متكلم مفرد مجرور (لي)', 'حالة القابل (Dative)'],
      'με':   ['ضمير متكلم مفرد منصوب (إياي / ني)', 'حالة النصب (Accusative)'],
      'συ':   ['ضمير مخاطب مفرد (أنتَ - 2S)', 'حالة الرفع (Nominative)'],
      'σου':  ['ضمير مخاطب مفرد مضاف (لكَ / كَ)', 'حالة الجر والإضافة (Genitive)'],
      'σοι':  ['ضمير مخاطب مفرد مجرور (لكَ)', 'حالة القابل (Dative)'],
      'σε':   ['ضمير مخاطب مفرد منصوب (إياكَ)', 'حالة النصب (Accusative)'],
      'ημεις':['ضمير متكلم جمع (نحن - 1P)', 'حالة الرفع (Nominative)'],
      'ημων': ['ضمير متكلم جمع مضاف (لنا / نا)', 'حالة الجر والإضافة (Genitive)'],
      'ημιν': ['ضمير متكلم جمع مجرور (لنا)', 'حالة القابل (Dative)'],
      'ημας': ['ضمير متكلم جمع منصوب (إيانا)', 'حالة النصب (Accusative)'],
      'υμεις':['ضمير مخاطب جمع (أنتم - 2P)', 'حالة الرفع (Nominative)'],
      'υμων': ['ضمير مخاطب جمع مضاف (لكم / كم)', 'حالة الجر والإضافة (Genitive)'],
      'υμιν': ['ضمير مخاطب جمع مجرور (لكم)', 'حالة القابل (Dative)'],
      'υμας': ['ضمير مخاطب جمع منصوب (إياكم)', 'حالة النصب (Accusative)'],
      'αυτος':['ضمير غائب مفرد مذكر (هو - 3S)', 'حالة الرفع (Nominative)'],
      'αυτη': ['ضمير غائب مفرد مؤنث (هي - 3S)', 'حالة الرفع (Nominative)'],
      'αυτο': ['ضمير غائب مفرد محايد (هو/هي)', 'حالة الرفع أو النصب (Nom/Acc)'],
      'αυτου':['ضمير غائب مفرد مضاف (له / ه)', 'حالة الجر والإضافة (Genitive)'],
      'αυτης':['ضمير غائب مفرد مؤنث مضاف (لها)', 'حالة الجر والإضافة (Genitive)'],
      'αυτω': ['ضمير غائب مفرد مجرور (له)', 'حالة القابل (Dative)'],
      'αυτον':['ضمير غائب مفرد منصوب (إياه)', 'حالة النصب (Accusative)'],
      'αυτην':['ضمير غائب مفرد مؤنث منصوب (إياها)', 'حالة النصب (Accusative)'],
      'αυτοι':['ضمير غائب جمع مذكر (هم - 3P)', 'حالة الرفع (Nominative)'],
      'αυται':['ضمير غائب جمع مؤنث (هن - 3P)', 'حالة الرفع (Nominative)'],
      'αυτα': ['ضمير غائب جمع محايد (هم/هن)', 'حالة الرفع أو النصب (Nom/Acc)'],
      'αυτων':['ضمير غائب جمع مضاف (لهم / هم)', 'حالة الجر والإضافة (Genitive)'],
      'αυτοις':['ضمير غائب جمع مجرور (لهم)', 'حالة القابل (Dative)'],
      'αυτους':['ضمير غائب جمع منصوب (إياهم)', 'حالة النصب (Accusative)'],
      'αυτας':['ضمير غائب جمع مؤنث منصوب (إياهن)', 'حالة النصب (Accusative)'],
    };

    const demonstrativePronouns = {
      'ουτος':  ['اسم إشارة للقريب (هذا)', 'مذكر مفرد في حالة الرفع'],
      'τουτο':  ['اسم إشارة للقريب (هذا الشيء)', 'محايد مفرد في حالة الرفع أو النصب'],
      'τουτου': ['اسم إشارة للقريب (من هذا / لهذا)', 'مذكر/محايد مفرد في حالة الجر'],
      'τουτω':  ['اسم إشارة للقريب (بهذا / لهذا)', 'مذكر/محايد مفرد في حالة القابل'],
      'τουτον': ['اسم إشارة للقريب (هذا الشخص)', 'مذكر مفرد في حالة النصب'],
      'ταυτη':  ['اسم إشارة للقريب (هذه)', 'مؤنث مفرد في حالة الرفع أو القابل'],
      'ταυτην': ['اسم إشارة للقريب (هذه)', 'مؤنث مفرد في حالة النصب'],
      'ουτοι':  ['اسم إشارة للقريب (هؤلاء)', 'مذكر جمع في حالة الرفع'],
      'ταυτα':  ['اسم إشارة للقريب (هذه الأمور)', 'محايد جمع في حالة الرفع أو النصب'],
      'τουτων': ['اسم إشارة للقريب (لهؤلاء)', 'جمع في حالة الجر والإضافة'],
      'τουτοις':['اسم إشارة للقريب (لهؤلاء)', 'مذكر/محايد جمع في حالة القابل'],
      'τουτους':['اسم إشارة للقريب (هؤلاء)', 'مذكر جمع في حالة النصب'],
      'εκεινος':['اسم إشارة للبعيد (ذلك)', 'مذكر مفرد في حالة الرفع'],
      'εκεινη': ['اسم إشارة للبعيد (تلك)', 'مؤنث مفرد في حالة الرفع'],
      'εκεινο': ['اسم إشارة للبعيد (ذلك الشيء)', 'محايد مفرد في حالة الرفع أو النصب'],
      'εκεινου':['اسم إشارة للبعيد (لذلك)', 'مذكر/محايد مفرد في حالة الجر'],
      'εκεινω': ['اسم إشارة للبعيد (لذلك)', 'مذكر/محايد مفرد في حالة القابل'],
      'εκεινον':['اسم إشارة للبعيد (ذلك)', 'مذكر مفرد في حالة النصب'],
      'εκεινοι':['اسم إشارة للبعيد (أولئك)', 'مذكر جمع في حالة الرفع'],
      'εκεινων':['اسم إشارة للبعيد (لأولئك)', 'جمع في حالة الجر والإضافة'],
      'εκεινοις':['اسم إشارة للبعيد (لأولئك)', 'مذكر/محايد جمع في حالة القابل'],
      'εκεινους':['اسم إشارة للبعيد (أولئك)', 'مذكر جمع في حالة النصب'],
    };

    const relativePronouns = {
      'ος':   ['اسم موصول (الذي - Who/Which)', 'مذكر مفرد في حالة الرفع'],
      'η':    ['اسم موصول (التي)', 'مؤنث مفرد في حالة الرفع'],
      'ο':    ['اسم موصول (الذي/التي)', 'محايد مفرد في حالة الرفع أو النصب'],
      'ου':   ['اسم موصول (الذي له)', 'مذكر/محايد مفرد في حالة الجر'],
      'ης':   ['اسم موصول (التي لها)', 'مؤنث مفرد في حالة الجر'],
      'ω':    ['اسم موصول (للذي)', 'مذكر/محايد مفرد في حالة القابل'],
      'ον':   ['اسم موصول (الذي إياه)', 'مذكر مفرد في حالة النصب'],
      'ην':   ['اسم موصول (التي إياها)', 'مؤنث مفرد في حالة النصب'],
      'οι':   ['اسم موصول (الذين)', 'مذكر جمع في حالة الرفع'],
      'αι':   ['اسم موصول (اللواتي)', 'مؤنث جمع في حالة الرفع'],
      'α':    ['اسم موصول (التي للأشياء)', 'محايد جمع في حالة الرفع أو النصب'],
      'ων':   ['اسم موصول (الذين لهم)', 'جمع لجميع الأجناس في حالة الجر'],
      'οις':  ['اسم موصول (للذين)', 'مذكر/محايد جمع في حالة القابل'],
      'ους':  ['اسم موصول (الذين إياهم)', 'مذكر جمع في حالة النصب'],
      'ας':   ['اسم موصول (اللواتي إياهن)', 'مؤنث جمع في حالة النصب'],
    };

    const arPronouns = {
      'هو', 'هي', 'هما', 'هم', 'هن', 'انت', 'أنت', 'انتم', 'أنتم', 'انا',
      'أنا', 'نحن', 'الذي', 'التي', 'الذين', 'اللواتي', 'هذا', 'هذه', 'هؤلاء',
      'ذلك', 'تلك', 'اولئك', 'أولئك', 'من', 'مَن', 'ماذا'
    };

    if (personalPronouns.containsKey(clean) || demonstrativePronouns.containsKey(clean) || relativePronouns.containsKey(clean) ||
        def.contains('pronoun') || def.contains('demonstrative') || arPronouns.contains(arClean)) {
      final info = personalPronouns[clean] ?? demonstrativePronouns[clean] ?? relativePronouns[clean] ??
          ['ضمير / اسم إشارة أو موصول', 'مبني في سياق الآية'];
      tags.addAll(['ضمير', info[1], 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'PRON',
        language: 'greek',
        partOfSpeech: info[0],
        grammaticalCase: info[1],
        summary: '${info[0]} في الأصل اليوناني، ${info[1]}.',
        tags: tags,
      );
    }

    // 6. Greek Verbs (الأفعال اليونانية بكافة صيغها وأزمنتها وتصريفاتها)
    // Check Verb to be (εἰμί)
    if (clean == 'ην' || clean == 'ειμι' || clean == 'ησαν' || clean == 'εστι' || clean == 'εστιν' || clean == 'εισι' || clean == 'εισιν' ||
        sId == 'G1510' || sId == 'G2258') {
      final isImperfect = clean == 'ην' || clean == 'ησαν';
      final tense = isImperfect ? 'الماضي المستمر / الناقص (Imperfect - παρατατικός)' : 'المضارع / الحاضر (Present - ἐνεστώς)';
      final person = (clean == 'ησαν' || clean == 'εισι' || clean == 'εισιν') ? 'الغائبون (هم - 3P Plural)' : 'الغائب المفرد (هو - 3S Singular)';
      final number = (clean == 'ησαν' || clean == 'εισι' || clean == 'εισιν') ? 'جمع (Plural)' : 'مفرد (Singular)';
      tags.addAll(['فعل كينونة', tense, 'مبني للمعلوم', 'صيغة إخبارية', person, number, 'يوناني']);
      return MorphologyAnalysis(
        rawCode: isImperfect ? 'V-IAI-3S' : 'V-PAI-3S',
        language: 'greek',
        partOfSpeech: 'فعل كينونة يوناني (Verb to be - εἰμί)',
        tense: tense,
        voice: 'مبني للمعلوم (Active Voice)',
        mood: 'صيغة إخبارية واقعية (Indicative Mood)',
        person: person,
        number: number,
        gender: 'مشترك (Common)',
        summary: 'فعل كينونة يوناني أصيل في $tense، $person، يدل على الوجود والكينونة الثابتة في النص.',
        tags: tags,
      );
    }

    // Comprehensive Verb Detection
    final isDefVerb = def.contains('verb') || def.contains('to ') || def.contains('middle voice of a primary') || def.contains('prolongation of a primary verb');
    final isArVerb = _isArabicVerb(arClean);
    final isKnownVerbStrongs = {
      'G1080', 'G1096', 'G2064', 'G3004', 'G4100', 'G25', 'G4160', 'G1325', 'G1492', 'G3708',
      'G191', 'G2980', 'G2192', 'G1166', 'G5342', 'G907', 'G1453', 'G4982', 'G599', 'G649',
      'G1209', 'G863', 'G1525', 'G1831', 'G1107', 'G3360', 'G1438', 'G2476', 'G5087', 'G5463'
    }.contains(sId);

    final hasPastAugment = (clean.startsWith('ε') || clean.startsWith('η') || clean.startsWith('ω')) && clean.length >= 4;
    final hasVerbSuffix = clean.endsWith('ω') || clean.endsWith('εις') || clean.endsWith('ει') || clean.endsWith('ομεν') || clean.endsWith('ετε') ||
        clean.endsWith('ουσι') || clean.endsWith('ουσιν') || clean.endsWith('μι') || clean.endsWith('ασι') || clean.endsWith('ασιν') ||
        clean.endsWith('σε') || clean.endsWith('σεν') || clean.endsWith('σα') || clean.endsWith('σαν') || clean.endsWith('σαμεν') || clean.endsWith('σατε') ||
        clean.endsWith('ξε') || clean.endsWith('ξεν') || clean.endsWith('ξαν') || clean.endsWith('ψε') || clean.endsWith('ψεν') || clean.endsWith('ψαν') ||
        clean.endsWith('θη') || clean.endsWith('θην') || clean.endsWith('θης') || clean.endsWith('θημεν') || clean.endsWith('θητε') || clean.endsWith('θησαν') ||
        clean.endsWith('κα') || clean.endsWith('κας') || clean.endsWith('κε') || clean.endsWith('κεν') || clean.endsWith('καμεν') || clean.endsWith('κασι') ||
        clean.endsWith('ειν') || clean.endsWith('σαι') || clean.endsWith('ναι') || clean.endsWith('εσθαι') || clean.endsWith('θηναι') ||
        clean.endsWith('ομαι') || clean.endsWith('εται') || clean.endsWith('ονται') || clean.endsWith('ομεθα') || clean.endsWith('εσθε') ||
        clean.endsWith('ατο') || clean.endsWith('αντο') || clean.endsWith('σον') || clean.endsWith('σατε') ||
        (hasPastAugment && (clean.endsWith('εν') || clean.endsWith('ες') || clean.endsWith('ε') || clean.endsWith('ον') || clean.endsWith('το')));

    final isVerb = isDefVerb || isArVerb || isKnownVerbStrongs || hasVerbSuffix;

    if (isVerb) {
      final lemmaClean = lemmaWord != null ? _normalizeGreek(lemmaWord) : '';
      final isCitationLemmaOnly = lemmaClean.isNotEmpty && clean == lemmaClean;

      // Do not mistake dictionary citation ending (-ω / -ομαι / -μι) for 1st-person singular present in the verse
      if (isCitationLemmaOnly) {
        final vVoice = (clean.endsWith('ομαι') || clean.endsWith('μαι'))
            ? 'صيغة متوسطة أو مجهولة في المدخل المعجمي'
            : null;
        return MorphologyAnalysis(
          rawCode: sId.isNotEmpty ? sId : 'V-LEMMA',
          language: 'greek',
          partOfSpeech: 'فعل يوناني (المدخل المعجمي)',
          voice: vVoice,
          summary: 'المدخل المعجمي للفعل اليوناني ($origWord)؛ ويُرجع إلى النص اليوناني للآية لتحديد زمن التصريف وصيغته السياقية.',
          tags: const ['فعل يوناني', 'مدخل معجمي'],
        );
      }

      final pos = 'فعل يوناني (Greek Verb)';
      String tense = 'الأوريست (Aorist - ἀόριστος)';
      String voice = 'مبني للمعلوم (Active Voice)';
      String mood = 'صيغة إخبارية واقعية (Indicative)';
      String person = 'الغائب المفرد (هو / هي - 3rd Person Singular)';
      String number = 'مفرد (Singular)';
      String gender = 'مذكر أو مشترك';
      final hasIotaSubscript = RegExp(r'[ᾳᾴᾶᾷῃῄῆῇῳῴῶῷ\u0345]').hasMatch(origWord);
      final isSecondAoristPass = hasPastAugment &&
          (clean.endsWith('φανη') || clean.endsWith('χαρη') || clean.endsWith('κρυβη') ||
           clean.endsWith('σταλη') || clean.endsWith('γραφη') || clean.endsWith('σπαρη') ||
           clean.endsWith('στραφη') || clean.endsWith('ηνοιγη'));

      // ── Tense (الزمن) ──────────────────────────────────────────────────────
      if (isSecondAoristPass ||
          clean.contains('σα') || clean.contains('σε') || clean.contains('σεν') || clean.contains('σαν') ||
          clean.contains('ξε') || clean.contains('ξεν') || clean.contains('ψε') || clean.contains('ψεν') ||
          clean.contains('θη') || clean.contains('θην') || clean.contains('θησαν') ||
          clean.startsWith('ειπ') || clean.startsWith('ελθ') || clean.startsWith('ελαβ') ||
          clean.startsWith('ευρ') || clean.startsWith('ειδ') || clean.startsWith('εγεν') ||
          clean.startsWith('εγνω') || clean.startsWith('εφαγ') || clean.startsWith('εβαλ')) {
        tense = 'الأوريست (Aorist - ἀόριστος)';
      } else if (clean.endsWith('σω') || clean.endsWith('σεις') || clean.endsWith('σει') || clean.endsWith('σομεν') || clean.endsWith('σετε') || clean.endsWith('σουσι') || clean.endsWith('θησεται')) {
        tense = 'المستقبل (Future - μέλλων)';
      } else if (clean.contains('κα') || clean.contains('κας') || clean.contains('κε') || clean.contains('κεν') || clean.contains('κασι') ||
                 clean.startsWith('γεγ') || clean.startsWith('πεπ') || clean.startsWith('τετ') || clean.startsWith('λελ')) {
        tense = 'التام اليوناني (Perfect - παρακείμενος)';
      } else if (hasPastAugment && (clean.endsWith('ον') || clean.endsWith('ες') || clean.endsWith('ε') || clean.endsWith('εν') || clean.endsWith('ετο') || clean.endsWith('οντο'))) {
        tense = 'الماضي المستمر / الناقص (Imperfect - παρατατικός)';
      } else {
        tense = 'المضارع / الحاضر المستمر (Present - ἐνεστώς)';
      }

      // ── Voice (البناء للمعلوم أو المجهول) ───────────────────────────────────
      if (isSecondAoristPass || clean.contains('θη') || clean.contains('θην') || clean.contains('θης') || clean.contains('θημεν') || clean.contains('θησαν') || clean.contains('θησεται') || clean.endsWith('θεν')) {
        voice = 'مبني للمجهول في الصيغة (Passive Voice)';
      } else if (clean.endsWith('μαι') || clean.endsWith('ομαι') || clean.endsWith('εται') || clean.endsWith('ονται') ||
                 clean.endsWith('ατο') || clean.endsWith('αντο') || clean.endsWith('εσθαι') || clean.endsWith('μενος') ||
                 def.contains('middle voice') || clean.startsWith('ερχ') || clean.startsWith('γινομ') || clean.startsWith('αποκριν')) {
        voice = 'صيغة متوسطة / ديبوننت (Middle / Deponent)';
      } else {
        voice = 'مبني للمعلوم (Active Voice)';
      }

      // ── Mood (الصيغة النحوية والتعبيرية) ────────────────────────────────────
      if (clean.endsWith('ειν') || clean.endsWith('σαι') || clean.endsWith('ναι') || clean.endsWith('εσθαι') || clean.endsWith('θηναι')) {
        mood = 'صيغة مصدرية (Infinitive)';
      } else if (clean.endsWith('ων') || clean.endsWith('ουσα') || clean.endsWith('μενος') || clean.endsWith('μενη') || clean.endsWith('μενον') || clean.endsWith('θεν') || clean.endsWith('θεντες')) {
        mood = 'اسم فاعل أو مفعول (Participle)';
      } else if (clean.endsWith('σον') || clean.endsWith('σατε') || clean.endsWith('θητι')) {
        mood = 'صيغة أمر (Imperative)';
      } else if (hasIotaSubscript || clean.endsWith('ωμεν') || clean.endsWith('ητε') || clean.endsWith('ωσι') || clean.endsWith('ωσιν')) {
        mood = 'صيغة الاحتمال (Subjunctive)';
      } else {
        mood = 'صيغة خبرية (Indicative)';
      }

      // ── Person & Number (الضمير والعدد) ────────────────────────────────────
      if (clean.endsWith('ομεν') || clean.endsWith('ωμεν') || clean.endsWith('αμεν') || clean.endsWith('σαμεν') || clean.endsWith('ομεθα')) {
        person = 'المتكلمون الجمع (نحن - 1st Person Plural)';
        number = 'جمع (Plural)';
      } else if (clean.endsWith('ετε') || clean.endsWith('ητε') || clean.endsWith('ατε') || clean.endsWith('σατε') || clean.endsWith('εσθε')) {
        person = 'المخاطبون الجمع (أنتم - 2nd Person Plural)';
        number = 'جمع (Plural)';
      } else if (clean.endsWith('ουσι') || clean.endsWith('ουσιν') || clean.endsWith('ωσι') || clean.endsWith('ωσιν') || clean.endsWith('αν') || clean.endsWith('σαν') || clean.endsWith('οσαν') || clean.endsWith('θησαν') || clean.endsWith('ονται') || clean.endsWith('οντο')) {
        person = 'الغائبون الجمع (هم - 3rd Person Plural)';
        number = 'جمع (Plural)';
      } else if (clean.endsWith('ον') && hasPastAugment) {
        person = 'الغائبون الجمع (هم) أو المتكلم المفرد (أنا)';
        number = 'جمع أو مفرد';
      } else if (clean.endsWith('εις') || clean.endsWith('ης') || clean.endsWith('ας') || clean.endsWith('κας')) {
        person = 'المخاطب المفرد (أنتَ - 2nd Person Singular)';
        number = 'مفرد (Singular)';
      } else if (clean.endsWith('ω') || clean.endsWith('μαι') || clean.endsWith('μην') || clean.endsWith('σα') || clean.endsWith('κα')) {
        person = 'المتكلم المفرد (أنا - 1st Person Singular)';
        number = 'مفرد (Singular)';
      } else {
        person = 'الغائب المفرد (هو / هي - 3rd Person Singular)';
        number = 'مفرد (Singular)';
      }

      tags.addAll(['فعل يوناني', tense, voice, mood, person, number]);

      final sumBuf = StringBuffer();
      sumBuf.write('فعل يوناني في $tense، $voice، في $mood، للـ$person، بصيغة $number في النص الأصلي.');

      return MorphologyAnalysis(
        rawCode: sId.isNotEmpty ? sId : 'V',
        language: 'greek',
        partOfSpeech: pos,
        tense: tense,
        voice: voice,
        mood: mood,
        person: person,
        number: number,
        gender: gender,
        summary: sumBuf.toString(),
        tags: tags,
      );
    }

    // 7. Greek Nouns, Adjectives, Proper Names (الأسماء والصفات اليونانية وحالات الإعراب)
    String pos = 'اسم يوناني (Greek Noun)';
    String gCase = 'حالة الرفع - فاعل أو مبتدأ (Nominative)';
    String number = 'مفرد (Singular)';
    String gender = 'مذكر في الأصل اليوناني (Masculine)';

    if (def.contains('proper name') || const {'ιησους', 'χριστος', 'δαυιδ', 'αβρααμ', 'μωυσης', 'πετρος', 'παυλος', 'ιωαννης', 'ιακωβ', 'ιουδας', 'ισαακ', 'ιερουσαλημ'}.contains(clean)) {
      pos = 'اسم علم كتابي (Proper Name)';
      gender = def.contains('woman') ? 'مؤنث في الأصل اليوناني (Feminine)' : 'مذكر في الأصل اليوناني (Masculine)';
    } else if (def.contains('adjective') || clean.endsWith('ικος') || clean.endsWith('ιμος') || const {'αγιος', 'αγαθος', 'δικαιος', 'αιωνιος', 'μεγας', 'πολυς', 'πιστος'}.contains(clean)) {
      pos = 'صفة / نعت (Adjective)';
    }

    // Greek Cases and Endings
    if (clean.endsWith('εως') || clean.endsWith('ως')) {
      gCase = 'حالة الجر والإضافة - مضاف إليه أو ملكية (Genitive)';
      gender = 'مؤنث أو مذكر في الأصل اليوناني';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ατος') || clean.endsWith('ματος')) {
      gCase = 'حالة الجر والإضافة (Genitive)';
      gender = 'محايد في الأصل اليوناني (Neuter)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ος')) {
      gCase = 'حالة الرفع - فاعل أو مبتدأ (Nominative)';
      gender = 'مذكر في الأصل اليوناني (Masculine)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ου')) {
      gCase = 'حالة الجر والإضافة - مضاف إليه أو ملكية (Genitive)';
      gender = def.contains('neuter') ? 'محايد في الأصل اليوناني (Neuter)' : 'مذكر في الأصل اليوناني (Masculine)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ῳ') || clean.endsWith('ω')) {
      gCase = 'حالة القابل - مفعول غير مباشر أو مجرور (Dative)';
      gender = 'مذكر أو محايد';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ον')) {
      if (def.contains('neuter') || clean.endsWith('ιον') || const {'ευαγγελιον', 'βιβλιον', 'σημειον', 'εργον', 'τεκνον', 'πλοιον', 'δαιμονιον'}.contains(clean)) {
        gCase = 'حالة الرفع أو النصب (Nom/Acc)';
        gender = 'محايد في الأصل اليوناني (Neuter)';
      } else {
        gCase = 'حالة النصب - مفعول به مباشر (Accusative)';
        gender = 'مذكر في الأصل اليوناني (Masculine)';
      }
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('η') || clean.endsWith('α')) {
      gCase = 'حالة الرفع - فاعل أو مبتدأ (Nominative)';
      gender = 'مؤنث في الأصل اليوناني (Feminine)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ης')) {
      gCase = 'حالة الرفع أو الجر (Nom/Gen)';
      gender = 'مؤنث في الأصل اليوناني (Feminine)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ας')) {
      gCase = 'حالة الرفع أو النصب (Nom/Acc)';
      gender = 'مذكر أو مؤنث في الأصل اليوناني';
      number = 'مفرد أو جمع';
    } else if (clean.endsWith('ῃ')) {
      gCase = 'حالة القابل (Dative)';
      gender = 'مؤنث في الأصل اليوناني (Feminine)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ην') || clean.endsWith('αν')) {
      gCase = 'حالة النصب - مفعول به مباشر (Accusative)';
      gender = 'مؤنث في الأصل اليوناني (Feminine)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('οι')) {
      gCase = 'حالة الرفع (Nominative)';
      gender = 'مذكر في الأصل اليوناني (Masculine)';
      number = 'جمع (Plural)';
    } else if (clean.endsWith('αι')) {
      gCase = 'حالة الرفع (Nominative)';
      gender = 'مؤنث في الأصل اليوناني (Feminine)';
      number = 'جمع (Plural)';
    } else if (clean.endsWith('ους')) {
      gCase = 'حالة النصب (Accusative)';
      gender = 'مذكر في الأصل اليوناني (Masculine)';
      number = 'جمع (Plural)';
    } else if (clean.endsWith('ων')) {
      gCase = 'حالة الجر والإضافة (Genitive)';
      number = 'جمع (Plural)';
    } else if (clean.endsWith('οις') || clean.endsWith('αις')) {
      gCase = 'حالة القابل (Dative)';
      number = 'جمع (Plural)';
    } else if (clean.endsWith('ε')) {
      gCase = 'حالة النداء (Vocative)';
      gender = 'مذكر في الأصل اليوناني (Masculine)';
      number = 'مفرد (Singular)';
    } else if (def.contains('neuter') || clean.endsWith('μα')) {
      gCase = 'حالة الرفع أو النصب (Nom/Acc)';
      gender = 'محايد في الأصل اليوناني (Neuter)';
      number = 'مفرد (Singular)';
    }

    tags.addAll([pos, gCase, number, gender, 'يوناني']);

    return MorphologyAnalysis(
      rawCode: sId.isNotEmpty ? sId : 'N',
      language: 'greek',
      partOfSpeech: pos,
      grammaticalCase: gCase,
      number: number,
      gender: gender,
      summary: '$pos، في $gCase، بصيغة الـ$number الـ$gender في لغة العهد الجديد الأصلية.',
      tags: tags,
    );
  }

  /// Helper to detect if the Arabic translation word represents a verb
  static bool _isArabicVerb(String word) {
    if (word.isEmpty) return false;
    String base = word;
    if ((base.startsWith('و') || base.startsWith('ف')) && base.length > 3) {
      base = base.substring(1);
    }
    const arabicVerbs = {
      'ولد', 'قال', 'يقول', 'جاء', 'يجيء', 'اتي', 'اتى', 'أتى', 'يأتي', 'ذهب',
      'يذهب', 'مضى', 'يمضي', 'رأى', 'يرى', 'نظر', 'ينظر', 'سمع', 'يسمع', 'تكلم',
      'يتكلم', 'نطق', 'ينطق', 'آمن', 'امن', 'يؤمن', 'كتب', 'يكتب', 'أجاب', 'اجاب',
      'يجيب', 'أحب', 'احب', 'يحب', 'صعد', 'يصعد', 'نزل', 'ينزل', 'قام', 'يقوم',
      'أقام', 'اقام', 'يقيم', 'مات', 'يموت', 'أرسل', 'ارسل', 'يرسل', 'صنع', 'يصنع',
      'عمل', 'يعمل', 'فعل', 'يفعل', 'أخذ', 'اخذ', 'يأخذ', 'دخل', 'يدخل', 'خرج',
      'يخرج', 'كان', 'يكون', 'صار', 'يصير', 'أعطى', 'اعطى', 'يعطي', 'دعا', 'يدعو',
      'عرف', 'يعرف', 'علم', 'يعلم', 'وجد', 'يوجد', 'طلب', 'يطلب', 'سأل', 'سال',
      'يسأل', 'خلص', 'يخلص', 'غفر', 'يغفر', 'شفى', 'يشفي', 'بشر', 'يبشر', 'عاش',
      'يعيش', 'مكث', 'يمكث', 'بدأ', 'يبدأ', 'أكمل', 'يكمل', 'بارك', 'يبارك', 'صلى',
      'يصلي', 'صام', 'يصوم', 'اعتمد', 'يعتمد', 'عمد', 'يعمد', 'تابع', 'يتبع', 'تبع',
      'أطاع', 'يطيع', 'خاف', 'يخاف', 'فرح', 'يفرح', 'بكى', 'يبكي', 'لمس', 'يلمس',
      'شهد', 'يشهد', 'حكم', 'يحكم', 'دان', 'يدين', 'ملك', 'يملك', 'ثبت', 'يثبت',
      'حفظ', 'يحفظ', 'بنى', 'يبني', 'زرع', 'يزرع', 'حصد', 'يحصد', 'أمر', 'امر',
      'يأمر', 'أوصى', 'يوصي', 'صاح', 'يصيح', 'صرخ', 'يصرخ', 'سجد', 'يسجد', 'عبد',
      'يعبد', 'سبح', 'يسبح', 'حمد', 'يحمد', 'شكر', 'يشكر', 'خدم', 'يخدم', 'أكل',
      'اكل', 'يأكل', 'شرب', 'يشرب', 'نام', 'ينام', 'مشى', 'يمشي', 'سار', 'يسير',
      'هرب', 'يهرب', 'تاب', 'يتوب', 'رجع', 'يرجع', 'رد', 'يرد', 'أمسك', 'يمسك',
      'صلب', 'يصلب', 'جلد', 'يجلد', 'دفن', 'يدفن'
    };
    return arabicVerbs.contains(base);
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
