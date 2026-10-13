// lib/core/services/morphology_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive Biblical Greek and Hebrew Morphology & Syntax Analyzer.
// Translates standard Robinson/MorphGNT and Groves-Wheeler/WLC codes
// into clear, elegant, scholarly Arabic grammatical analysis.
// ─────────────────────────────────────────────────────────────────────────────

class MorphologyAnalysis {
  final String rawCode;
  final String language; // 'greek' | 'hebrew' | 'aramaic'
  final String partOfSpeech; // نوع الكلمة (فعل، اسم، صفة، ...)
  final String? tense; // الزمن (مضارع، ماضٍ بسيط، تام، ...)
  final String? voice; // البناء (مبني للمعلوم، للمجهول، متوسط، ...)
  final String? mood; // الصيغة (إخبارية، أمر، شرطية، مصدري، ...)
  final String? grammaticalCase; // الحالة الإعرابية (رفع، نصب، جر، قابل، منادى)
  final String? gender; // الجنس (مذكر، مؤنث، محايد)
  final String? number; // العدد (مفرد، جمع، مثنى)
  final String? person; // الضمير (متكلم، مخاطب، غائب)
  final String? stem; // الوزن في العبرية (قال، نيفعل، بيعل، ...)
  final List<String> prefixes; // زوائد وحروف متصلة (واو العطف، أداة التعريف، ...)
  final String summary; // جملة إعرابية وتحليلية موجزة بالفصحى
  final List<String> tags; // كلمات دلالية للبطاقات السريعة (Badges)

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
  });

  bool get isVerb => partOfSpeech.contains('فعل');
  bool get isNoun => partOfSpeech.contains('اسم') && !partOfSpeech.contains('إشارة') && !partOfSpeech.contains('استفهام');
  bool get hasDetailedAnalysis =>
      tense != null || mood != null || grammaticalCase != null || stem != null;
}

class MorphologyService {
  MorphologyService._();

  /// Analyzes a morphology code (Greek Robinson/MorphGNT or Hebrew Groves-Wheeler).
  /// If the code is missing or incomplete, can use language and definition as heuristics.
  static MorphologyAnalysis parse({
    String? code,
    String language = 'greek',
    String? fallbackDefinition,
  }) {
    final cleanCode = (code ?? '').trim();
    final lang = language.toLowerCase();
    final isHebrew = lang == 'hebrew' || lang == 'aramaic';

    if (cleanCode.isNotEmpty && cleanCode != '-' && cleanCode != '—') {
      if (isHebrew || cleanCode.contains('/') || cleanCode.startsWith('H')) {
        return _parseHebrew(cleanCode, lang);
      } else {
        return _parseGreek(cleanCode, lang);
      }
    }

    // Fallback heuristic based on definition
    return _parseFallback(fallbackDefinition, lang);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GREEK MORPHOLOGY PARSER (Robinson / MorphGNT standard)
  // Format examples: V-PAI-3S, N-NSM, A-APF, T-GSM, PREP, CONJ, ADV
  // ───────────────────────────────────────────────────────────────────────────
  static MorphologyAnalysis _parseGreek(String raw, String lang) {
    final parts = raw.toUpperCase().split('-');
    final posCode = parts[0];
    final detail1 = parts.length > 1 ? parts[1] : '';
    final detail2 = parts.length > 2 ? parts[2] : '';

    String pos = _greekPosMap[posCode] ?? 'كلمة';
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
      // Verb parsing: V-[Tense][Voice][Mood]-[Person][Number] or -[Case][Number][Gender]
      if (detail1.length >= 3) {
        final tChar = detail1[0];
        final vChar = detail1[1];
        final mChar = detail1[2];

        tense = _greekTenseMap[tChar];
        voice = _greekVoiceMap[vChar];
        mood  = _greekMoodMap[mChar];

        if (tense != null) tags.add(tense);
        if (voice != null) tags.add(voice);
        if (mood != null) tags.add(mood);
      }

      // Check second chunk
      if (detail2.isNotEmpty) {
        if (detail2.length == 2 && RegExp(r'^[123][SP]$').hasMatch(detail2)) {
          // Finite verb: 3S, 1P, etc.
          person = _greekPersonMap[detail2[0]];
          number = _greekNumberMap[detail2[1]];
          if (person != null && number != null) tags.add('$person $number');
        } else if (detail2.length >= 3) {
          // Participle inflection: NSM, APF, etc.
          gCase  = _greekCaseMap[detail2[0]];
          number = _greekNumberMap[detail2[1]];
          gender = _greekGenderMap[detail2[2]];
          if (gCase != null) tags.add(gCase);
          if (number != null && gender != null) tags.add('$gender $number');
        }
      } else if (detail1.length >= 6) {
        // e.g. V-PAPNSM format
        gCase  = _greekCaseMap[detail1[3]];
        number = _greekNumberMap[detail1[4]];
        gender = _greekGenderMap[detail1[5]];
        if (gCase != null) tags.add(gCase);
        if (number != null && gender != null) tags.add('$gender $number');
      }
    } else if (['N', 'A', 'T', 'P', 'R', 'C', 'D', 'I', 'X', 'Q', 'F', 'S'].contains(posCode)) {
      // Nominal parsing: [Case][Number][Gender] (e.g. NSM, ASF, GPN)
      final chunk = detail1.isNotEmpty ? detail1 : '';
      if (chunk.length >= 3) {
        gCase  = _greekCaseMap[chunk[0]];
        number = _greekNumberMap[chunk[1]];
        gender = _greekGenderMap[chunk[2]];
        if (gCase != null) tags.add(gCase);
        if (gender != null && number != null) tags.add('$gender $number');
      }
    }

    // Build synthesized Arabic summary
    final summaryBuffer = StringBuffer(pos);
    if (tense != null) summaryBuffer.write(' في زمن $tense');
    if (voice != null) summaryBuffer.write('، $voice');
    if (mood != null) summaryBuffer.write(' ($mood)');
    if (gCase != null) summaryBuffer.write('، في $gCase');
    if (person != null) summaryBuffer.write(' للـ$person');
    if (gender != null && number != null) {
      summaryBuffer.write(' ($gender $number)');
    } else if (number != null) {
      summaryBuffer.write(' ($number)');
    }

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
  // HEBREW MORPHOLOGY PARSER (Groves-Wheeler / WLC standard)
  // Handles prefixes like C/ (Conjunction), H/ (Article), HR/ (Preposition)
  // and stems (Qal, Niphal, Piel, Hiphil...) + suffixes
  // ───────────────────────────────────────────────────────────────────────────
  static MorphologyAnalysis _parseHebrew(String raw, String lang) {
    final prefixes = <String>[];
    final tags = <String>[];
    String core = raw;

    // Handle slash prefixes (e.g. C/Vqp3ms or HR/Ncmpa)
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
      // e.g. Vqp3ms or V-q-p3ms
      final clean = core.replaceAll('-', '');
      if (clean.length >= 3) {
        final stemChar = clean[1];
        final conjChar = clean[2];
        stem = _hebrewStemMap[stemChar];
        tense = _hebrewConjMap[conjChar];

        if (stem != null) tags.add(stem);
        if (tense != null) tags.add(tense);
      }

      // Check person, gender, number (e.g. 3ms, 1cp, 2fs)
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
  // FALLBACK HEURISTIC PARSER
  // Derives basic grammatical category from Strong's dictionary definition
  // ───────────────────────────────────────────────────────────────────────────
  static MorphologyAnalysis _parseFallback(String? def, String lang) {
    final text = (def ?? '').toLowerCase();
    String pos = 'لفظ كتابي أصلي';
    final tags = <String>[];

    if (text.contains('primitive root') || text.startsWith('to ') || text.contains('a verb') || text.contains('verb,')) {
      pos = 'فعل (Verb)';
      tags.add('فعل');
      if (text.contains('primitive root')) tags.add('جذر أصلي مجرد');
    } else if (text.contains('proper name') || text.contains('an israelite') || text.contains('a place in') || text.contains('son of')) {
      pos = 'اسم علم (Proper Name)';
      tags.add('اسم علم');
    } else if (text.contains('preposition')) {
      pos = 'حرف جر (Preposition)';
      tags.add('حرف جر');
    } else if (text.contains('conjunction')) {
      pos = 'حرف عطف (Conjunction)';
      tags.add('حرف عطف');
    } else if (text.contains('adjective')) {
      pos = 'صفة (Adjective)';
      tags.add('صفة');
    } else if (text.contains('adverb')) {
      pos = 'ظرف / حال (Adverb)';
      tags.add('ظرف');
    } else if (text.contains('noun') || text.contains('feminine of') || text.contains('masculine of')) {
      pos = 'اسم (Noun)';
      tags.add('اسم');
      if (text.contains('feminine')) tags.add('مؤنث');
      if (text.contains('masculine')) tags.add('مذكر');
    } else {
      tags.add(lang == 'hebrew' ? 'عبري' : 'يوناني');
    }

    return MorphologyAnalysis(
      rawCode: '',
      language: lang,
      partOfSpeech: pos,
      summary: '$pos في لغة النص الأصلي للكتاب المقدس',
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
    'N': 'محايد (Neuter)',
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
    '1': 'المتكلم',
    '2': 'المخاطب',
    '3': 'الغائب',
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
