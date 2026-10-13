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

  /// Analyzes Biblical Hebrew and Koine Greek words with scholarly depth.
  /// First checks Robinson / WLC code if present; if absent or partial,
  /// deeply analyzes the original Hebrew/Greek word, Strong's metadata, and Arabic context.
  static MorphologyAnalysis parse({
    String? code,
    String language = 'greek',
    String? fallbackDefinition,
    String? arWord,
    String? origWord,
    String? strongsId,
  }) {
    final cleanCode = (code ?? '').trim();
    final lang = language.toLowerCase();
    final isHebrew = lang == 'hebrew' || lang == 'aramaic' || (strongsId != null && strongsId.startsWith('H'));

    if (cleanCode.isNotEmpty && cleanCode != '-' && cleanCode != '—') {
      final parsed = (isHebrew || cleanCode.contains('/') || cleanCode.startsWith('H'))
          ? _parseHebrewCode(cleanCode, lang)
          : _parseGreekCode(cleanCode, lang);
      if (parsed.hasDetailedAnalysis) {
        return parsed;
      }
    }

    // Direct Linguistic Analysis based on Biblical Hebrew and Greek originals
    if (isHebrew) {
      return _analyzeBiblicalHebrew(
        origWord: origWord ?? '',
        arWord: arWord,
        strongsId: strongsId,
        fallbackDef: fallbackDefinition,
        lang: lang,
      );
    } else {
      return _analyzeBiblicalGreek(
        origWord: origWord ?? '',
        arWord: arWord,
        strongsId: strongsId,
        fallbackDef: fallbackDefinition,
        lang: lang,
      );
    }
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
  }) {
    // Strip Hebrew cantillation and vowel points for consonant root detection
    final cons = origWord.replaceAll(RegExp(r'[\u0591-\u05C7]'), '').trim();
    final def = (fallbackDef ?? '').toLowerCase();
    final prefixes = <String>[];
    final tags = <String>[];

    // Detect Inseparable Hebrew Prefixes (الزوائد العبرية المتصلة)
    bool isWayyiqtol = false;
    if (origWord.startsWith('וַיּ') || origWord.startsWith('וַיְ') || origWord.startsWith('וַתּ') || origWord.startsWith('וָא') || origWord.startsWith('וַנִּ')) {
      isWayyiqtol = true;
      prefixes.add('واو العطف المتتابعة للسرد (Wayyiqtol / Waw Consecutive)');
    } else if (cons.startsWith('ו') && cons.length > 2) {
      prefixes.add('واو العطف (Conjunctive Waw וְ)');
    }

    if (origWord.contains('הַ') || origWord.contains('הָ') || origWord.contains('הֶ')) {
      prefixes.add('هاء التعريف العبرية (Definite Article הַ)');
    }
    if (origWord.contains('בְּ') || origWord.contains('בַּ') || origWord.contains('בִּ')) {
      prefixes.add('باء الجر والظرفية (Inseparable Bet בְּ)');
    }
    if (origWord.contains('לְ') || origWord.contains('לַ') || origWord.contains('לִ')) {
      prefixes.add('لام الملكية والغاية والجر (Inseparable Lamed לְ)');
    }
    if (origWord.contains('כְּ') || origWord.contains('כַּ')) {
      prefixes.add('كاف التشبيه (Inseparable Kaf כְּ)');
    }
    if (origWord.contains('מִ') || origWord.contains('מֵ')) {
      prefixes.add('ميم الابتداء والتبعيض (Preposition Mem מִ)');
    }

    // Direct Object Marker (أداة المفعول به المباشر את / ואת)
    if (cons == 'את' || cons == 'ואת' || (strongsId == 'H853')) {
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

    // Tetragrammaton (اسم الجلالة الأعظم יהוה)
    if (cons == 'יהוה' || cons == 'ויהוה' || (strongsId == 'H3068')) {
      final pos = 'اسم الجلالة الأعظم (The Tetragrammaton - YHWH)';
      tags.addAll(['اسم علم إلهي', 'مذكر', 'مفرد', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H3068',
        language: 'hebrew',
        partOfSpeech: pos,
        gender: 'مذكر في الأصل العبري (Masculine)',
        number: 'مفرد (Singular)',
        prefixes: prefixes,
        summary: 'الاسم الإلهي العظيم والخاص في العهد القديم، يدل على الأزلي واجب الوجود (الكائن الدائم).',
        tags: tags,
      );
    }

    // Elohim (اسم الجلالة אֱלֹהִים)
    if (cons == 'אלהים' || cons == 'ואלהים' || (strongsId == 'H430')) {
      final pos = 'اسم الجلالة (Divine Title - Elohim)';
      tags.addAll(['اسم إلهي', 'جمع التعظيم', 'مذكر', 'عبري']);
      return MorphologyAnalysis(
        rawCode: 'H430',
        language: 'hebrew',
        partOfSpeech: pos,
        gender: 'مذكر في الأصل العبري (Masculine)',
        number: 'جمع التعظيم والفخامة (Plural of Majesty)',
        prefixes: prefixes,
        summary: 'اسم الجلالة في الأصل العبري (אֱלֹהִים)، جاء في صيغة جمع التعظيم والسيادة الإلهية، ويأخذ فعلاً مفرداً.',
        tags: tags,
      );
    }

    // Check if it's a Verb (الأفعال العبرية)
    final isDefVerb = def.contains('primitive root') || def.startsWith('to ') || def.contains('verb') || def.contains('a verb,');
    if (isWayyiqtol || isDefVerb) {
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
        } else if (cons.endsWith('ת')) {
          person = 'المخاطب المفرد (أنتَ - 2nd Person Masculine)';
          number = 'مفرد (Singular)';
          gender = 'مذكر (Masculine)';
        } else if (cons.endsWith('תי')) {
          person = 'المتكلم المفرد (أنا - 1st Person Singular)';
          number = 'مفرد (Singular)';
          gender = 'مشترك (Common)';
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
  // BIBLICAL GREEK ANALYZER (الأصل اليوناني للعهد الجديد)
  // ───────────────────────────────────────────────────────────────────────────
  static MorphologyAnalysis _analyzeBiblicalGreek({
    required String origWord,
    required String? arWord,
    required String? strongsId,
    required String? fallbackDef,
    required String lang,
  }) {
    final clean = origWord.toLowerCase().replaceAll(RegExp(r'[\u0300-\u036F\u1DC0-\u1DFF\u1AB0-\u1AFF\u1F00-\u1FFF]'), '').trim();
    final def = (fallbackDef ?? '').toLowerCase();
    final tags = <String>[];

    // Greek Definite Article (أداة التعريف اليونانية)
    const articles = {
      'ο':  ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'مفرد (Singular)', 'مذكر في الأصل اليوناني (Masculine)'],
      'η':  ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'το': ['أداة تعريف (Definite Article)', 'حالة الرفع أو النصب (Nom/Acc)', 'مفرد (Singular)', 'محايد في الأصل اليوناني (Neuter)'],
      'του':['أداة تعريف (Definite Article)', 'حالة الجر والإضافة (Genitive)', 'مفرد (Singular)', 'مذكر أو محايد (Masc/Neut)'],
      'της':['أداة تعريف (Definite Article)', 'حالة الجر والإضافة (Genitive)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'τω': ['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'مفرد (Singular)', 'مذكر أو محايد (Masc/Neut)'],
      'τη': ['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'τον':['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'مفرد (Singular)', 'مذكر في الأصل اليوناني (Masculine)'],
      'την':['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'مفرد (Singular)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'οι': ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'جمع (Plural)', 'مذكر في الأصل اليوناني (Masculine)'],
      'αι': ['أداة تعريف (Definite Article)', 'حالة الرفع (Nominative)', 'جمع (Plural)', 'مؤنث في الأصل اليوناني (Feminine)'],
      'τα': ['أداة تعريف (Definite Article)', 'حالة الرفع أو النصب (Nom/Acc)', 'جمع (Plural)', 'محايد في الأصل اليوناني (Neuter)'],
      'των':['أداة تعريف (Definite Article)', 'حالة الجر والإضافة (Genitive)', 'جمع (Plural)', 'مشترك لجميع الأجناس'],
      'τοις':['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'جمع (Plural)', 'مذكر أو محايد'],
      'ταις':['أداة تعريف (Definite Article)', 'حالة القابل (Dative)', 'جمع (Plural)', 'مؤنث'],
      'τους':['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'جمع (Plural)', 'مذكر في الأصل اليوناني (Masculine)'],
      'τας':['أداة تعريف (Definite Article)', 'حالة النصب (Accusative)', 'جمع (Plural)', 'مؤنث في الأصل اليوناني (Feminine)'],
    };

    if (articles.containsKey(clean) || (strongsId == 'G3588')) {
      final info = articles[clean] ?? ['أداة تعريف (Definite Article)', 'حالة الرفع', 'مفرد', 'مذكر'];
      tags.addAll(['أداة تعريف', info[1], info[2], info[3], 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'T-${clean.toUpperCase()}',
        language: 'greek',
        partOfSpeech: info[0],
        grammaticalCase: info[1],
        number: info[2],
        gender: info[3],
        summary: 'أداة تعريف أصلية في اليونانية، في ${info[1]}، بصيغة الـ${info[2]} الـ${info[3]}.',
        tags: tags,
      );
    }

    // Greek Prepositions (حروف الجر الأصلية في اليونانية)
    const greekPreps = {
      'εν':   ['حرف جر أصلي (Preposition)', 'يلازمه حالة القابل (Dative)', 'يفيد الاستقرار والظرفية الثابتة'],
      'εις':  ['حرف جر أصلي (Preposition)', 'يلازمه حالة النصب (Accusative)', 'يفيد الحركة نحو والغاية والبلوغ'],
      'εκ':   ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الانبثاق والخروج من الأصل'],
      'εξ':   ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الانبثاق والخروج من الأصل'],
      'προς': ['حرف جر أصلي (Preposition)', 'يلازمه حالة النصب (Accusative)', 'يفيد التوجه نحو والمعية الحميمة والمواجهة'],
      'δια':  ['حرف جر أصلي (Preposition)', 'مع النصب (لأجل) أو الجر (بواسطة)', 'يفيد الواسطة أو التعليل'],
      'μετα': ['حرف جر أصلي (Preposition)', 'مع النصب (بعد) أو الجر (مع)', 'يفيد المعية والمصاحبة أو البعدية'],
      'περι': ['حرف جر أصلي (Preposition)', 'مع الجر (عن) أو النصب (حول)', 'يفيد الإحاطة والموضوع'],
      'κατα': ['حرف جر أصلي (Preposition)', 'مع النصب (بحسب) أو الجر (ضد)', 'يفيد المطابقة والموافقة'],
      'υπο':  ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الواسطة والعلية (بواسطة)'],
      'επι':  ['حرف جر أصلي (Preposition)', 'مع القابل أو النصب أو الجر', 'يفيد العلو والتمكين والاستناد'],
      'απο':  ['حرف جر أصلي (Preposition)', 'يلازمه حالة الجر (Genitive)', 'يفيد الانفصال والمصدر (من وعن)'],
      'συν':  ['حرف جر أصلي (Preposition)', 'يلازمه حالة القابل (Dative)', 'يفيد الاشتراك والاتحاد في الفعل'],
    };

    if (greekPreps.containsKey(clean) || def.contains('preposition')) {
      final info = greekPreps[clean] ?? ['حرف جر أصلي (Preposition)', 'ملازم لحالات الإعراب', 'يفيد الربط والدلالة'];
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

    // Greek Conjunctions (حروف العطف والربط)
    const greekConjs = {
      'και':  ['حرف عطف وتوكيد (Conjunction)', 'يفيد الربط والجمع والتوكيد المعنوي (و / أيضاً)'],
      'δε':   ['حرف عطف استدراكي / انتقالي', 'يفيد الانتقال أو الاستدراك اللطيف (وأما / ولكن)'],
      'αλλα': ['حرف عطف استدراكي قوي', 'يفيد إبطال ما قبله وإثبات ما بعده (بل / ولكن بالحري)'],
      'οτι':  ['أداة ربط وتعليل وتفسير', 'تفيد التعليل أو تقديم الكلام المنقول (أن / لأن)'],
      'ινα':  ['أداة ربط غائية ومصدرية', 'تفيد القصد والغاية الحتمية (لكي / حتى)'],
      'γαρ':  ['أداة تعليل وتوضيح برهانية', 'تفيد تقديم العلة والبرهان (لأنه / إذ)'],
      'ουν':  ['أداة استنتاج ونتيجة منطقية', 'تفيد ترتيب النتيجة على المقدمة (فإذاً / بناءً عليه)'],
    };

    if (greekConjs.containsKey(clean) || def.contains('conjunction')) {
      final info = greekConjs[clean] ?? ['حرف عطف وربط (Conjunction)', 'يربط المفردات والجمل'];
      tags.addAll(['حرف عطف', 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'CONJ',
        language: 'greek',
        partOfSpeech: info[0],
        summary: '${info[0]} في النص اليوناني الأصلي، ${info[1]}.',
        tags: tags,
      );
    }

    // Greek Verbs (الأفعال اليونانية)
    // Famous Greek Verbs: e.g. ἦν (was), ἐγένετο (became), ἔλεγεν, εἶπεν
    if (clean == 'ην' || clean == 'ειμι' || clean == 'ησαν' || strongsId == 'G1510' || strongsId == 'G2258') {
      final pos = 'فعل كينونة يوناني (Verb to be - εἰμί)';
      final tense = 'الماضي المستمر / الناقص (Imperfect - παρατατικός)';
      final voice = 'مبني للمعلوم (Active Voice)';
      final mood = 'صيغة إخبارية واقعية (Indicative Mood)';
      final person = (clean == 'ησαν') ? 'الغائبون (هم - 3P)' : 'الغائب المفرد (هو - 3S)';
      final number = (clean == 'ησαν') ? 'جمع (Plural)' : 'مفرد (Singular)';
      tags.addAll(['فعل كينونة', tense, voice, mood, person, number, 'يوناني']);
      return MorphologyAnalysis(
        rawCode: 'V-IAI-3S',
        language: 'greek',
        partOfSpeech: pos,
        tense: tense,
        voice: voice,
        mood: mood,
        person: person,
        number: number,
        gender: 'مشترك (Common)',
        summary: 'فعل كينونة يوناني في زمن الماضي المستمر (Imperfect)، مبني للمعلوم، يدل لاهوتياً على الوجود الأزلي المستمر دون بداية.',
        tags: tags,
      );
    }

    final isDefVerb = def.contains('to ') || def.contains('verb') || def.contains('a verb,');
    if (isDefVerb || clean.endsWith('ω') || clean.endsWith('ει') || clean.endsWith('εν') || clean.endsWith('ον') || clean.endsWith('το')) {
      final pos = 'فعل يوناني (Greek Verb)';
      String tense = 'المضارع / الحاضر (Present - ἐνεστώς)';
      String voice = 'مبني للمعلوم (Active Voice)';
      String mood = 'صيغة إخبارية واقعية (Indicative)';
      String person = 'الغائب المفرد (هو - 3rd Person Singular)';
      String number = 'مفرد (Singular)';
      String gender = 'مذكر أو مشترك';

      if (clean.contains('σα') || clean.contains('σε') || clean.contains('σεν') || clean.contains('εγενετο') || clean.contains('ειπ')) {
        tense = 'الماضي البسيط / غير المحدد (Aorist - ἀόριστος)';
      } else if (clean.endsWith('ον') || clean.endsWith('ες') || clean.endsWith('εν')) {
        tense = 'الماضي المستمر الناقص (Imperfect) أو الماضي البسيط (2nd Aorist)';
      } else if (clean.endsWith('σω') || clean.endsWith('σει')) {
        tense = 'المستقبل (Future - μέλλων)';
      }

      if (clean.endsWith('ται') || clean.endsWith('το') || clean.endsWith('μαι') || clean.endsWith('μεθα')) {
        voice = 'مبني للمجهول أو صيغة ديبوننت (Passive / Deponent)';
      }

      if (clean.endsWith('ουσι') || clean.endsWith('ουσιν') || clean.endsWith('αν') || clean.endsWith('ον')) {
        person = 'الغائبون (هم - 3rd Person Plural)';
        number = 'جمع (Plural)';
      }

      tags.addAll(['فعل يوناني', tense, voice, mood, person, number]);
      return MorphologyAnalysis(
        rawCode: 'V',
        language: 'greek',
        partOfSpeech: pos,
        tense: tense,
        voice: voice,
        mood: mood,
        person: person,
        number: number,
        gender: gender,
        summary: 'فعل يوناني في $tense، $voice ($mood)، للـ$person، في صيغة $number.',
        tags: tags,
      );
    }

    // Greek Nouns, Adjectives, Proper Names (الأسماء والصفات اليونانية وحالات الإعراب)
    String pos = 'اسم يوناني (Greek Noun)';
    String gCase = 'حالة الرفع - فاعل أو مبتدأ (Nominative)';
    String number = 'مفرد (Singular)';
    String gender = 'مذكر في الأصل اليوناني (Masculine)';

    if (def.contains('proper name')) {
      pos = 'اسم علم كتابي (Proper Name)';
      gender = def.contains('woman') ? 'مؤنث في الأصل اليوناني (Feminine)' : 'مذكر في الأصل اليوناني (Masculine)';
    } else if (def.contains('adjective')) {
      pos = 'صفة / نعت (Adjective)';
    }

    // Greek Cases and Endings
    if (clean.endsWith('ος') || clean.endsWith('ης') || clean.endsWith('ας')) {
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
      if (def.contains('neuter') || clean.endsWith('ιον')) {
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
    } else if (clean.endsWith('ης') || clean.endsWith('ας')) {
      gCase = 'حالة الجر والإضافة (Genitive)';
      gender = 'مؤنث في الأصل اليوناني (Feminine)';
      number = 'مفرد (Singular)';
    } else if (clean.endsWith('ῃ') || clean.endsWith('α')) {
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
    } else if (def.contains('neuter') || clean.endsWith('μα')) {
      gender = 'محايد في الأصل اليوناني (Neuter)';
      number = 'مفرد (Singular)';
    }

    tags.addAll([pos, gCase, number, gender, 'يوناني']);

    return MorphologyAnalysis(
      rawCode: strongsId ?? '',
      language: 'greek',
      partOfSpeech: pos,
      grammaticalCase: gCase,
      number: number,
      gender: gender,
      summary: '$pos، في $gCase، بصيغة الـ$number الـ$gender في لغة العهد الجديد الأصلية.',
      tags: tags,
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
