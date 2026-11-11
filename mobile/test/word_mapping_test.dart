import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:arabic_bible_study/models/word_mapping.dart';
import 'package:arabic_bible_study/models/strongs_entry.dart';
import 'package:arabic_bible_study/core/services/morphology_service.dart';
import 'package:arabic_bible_study/providers/word_study_provider.dart';
import 'package:arabic_bible_study/providers/theme_provider.dart';
import 'package:arabic_bible_study/features/word_study/widgets/strongs_modal.dart';
import 'package:arabic_bible_study/features/word_study/widgets/morphology_modal.dart';

void main() {
  group('WordMapping.fromJson Multi-Strongs Invariant Tests', () {
    test('Preserves repeated Strongs IDs in exact sequential order (Genesis 22:16)', () {
      final json = {
        'id': 'wm_gen_22_16_12',
        'verse_id': 'gen_22_16',
        'ar_word_position': 12,
        'orig_word_position': 12,
        'ar_word': 'الأَمْرَ',
        'orig_word': 'הַדָּבָר',
        'orig_word_lang': 'hebrew',
        'strongs_id': 'H1697',
        'all_strongs_ids': 'H1697,H853,H1697',
        'is_verified': 1,
        'verified_source': 'academic_review',
      };

      final mapping = WordMapping.fromJson(json);

      expect(mapping.strongsIds, equals(['H1697', 'H853', 'H1697']));
      expect(mapping.strongsIds.length, equals(3));
      expect(mapping.strongsIds[0], equals('H1697'));
      expect(mapping.strongsIds[1], equals('H853'));
      expect(mapping.strongsIds[2], equals('H1697'));
    });

    test('Preserves distinct multi-strongs sequence (Genesis 16:14)', () {
      final json = {
        'id': 'wm_gen_16_14_1',
        'verse_id': 'gen_16_14',
        'ar_word_position': 1,
        'orig_word_position': 1,
        'ar_word': 'لِذلِكَ',
        'orig_word': 'עַל־כֵּן',
        'orig_word_lang': 'hebrew',
        'strongs_id': 'H5921',
        'all_strongs_ids': 'H5921,H3651',
        'is_verified': 1,
        'verified_source': 'academic_review',
      };

      final mapping = WordMapping.fromJson(json);

      expect(mapping.strongsIds, equals(['H5921', 'H3651']));
    });
  });

  group('MorphologyService Card Display Invariants (v1.0.372)', () {
    test('1 Kings 18:21 H5587 renders masculine plural card instead of feminine dual', () {
      final analysis = MorphologyService.parse(
        code: 'HTd/Ncmpa',
        language: 'hebrew',
        arWord: 'الْفِرْقَتَيْنِ',
        origWord: 'סָעִף',
        origSurface: 'הַסְּעִפִּים֒',
        strongsId: 'H5587',
        morphPos: 'noun',
        morphGender: 'masculine',
        morphNumber: 'plural',
        morphSource: 'oshb_wlc',
        verifiedLocator: '1Kgs.18.21#11',
      );

      expect(analysis.partOfSpeech, contains('اسم'));
      expect(analysis.gender, contains('مذكر'));
      expect(analysis.number, contains('جمع'));
      expect(analysis.gender, isNot(contains('مؤنث')));
      expect(analysis.number, isNot(contains('مثنى')));
      expect(analysis.summary, isNot(contains('مؤنث')));
      expect(analysis.summary, isNot(contains('مثنى')));
    });

    test('Zechariah 4:6 Bet prefix detector handles literal OSHB surfaces & construct case (v1.0.373)', () {
      // w12: بِالْقُدْرَةِ (בְחַ֨יִל֙ - no Dagesh in Bet)
      final a1 = MorphologyService.parse(
        code: 'HR/Ncmsa',
        language: 'hebrew',
        arWord: 'بِالْقُدْرَةِ',
        origWord: 'חַיִל',
        origSurface: 'בְחַ֨יִל֙',
        strongsId: 'H2428',
        morphPos: 'noun',
        morphGender: 'masculine',
        morphNumber: 'singular',
        morphSource: 'oshb_wlc',
        verifiedLocator: 'OSHB:B38.C4.V6.w12',
      );
      expect(a1.prefixes, contains('باء الجر والظرفية (בְּ)'));

      // w14: بِالْقُوَّةِ (בְכֹ֔חַ - no Dagesh in Bet)
      final a2 = MorphologyService.parse(
        code: 'HR/Ncmsa',
        language: 'hebrew',
        arWord: 'بِالْقُوَّةِ',
        origWord: 'כֹּחַ',
        origSurface: 'בְכֹ֔חַ',
        strongsId: 'H3581',
        morphPos: 'noun',
        morphGender: 'masculine',
        morphNumber: 'singular',
        morphSource: 'oshb_wlc',
        verifiedLocator: 'OSHB:B38.C4.V6.w14',
      );
      expect(a2.prefixes, contains('باء الجر والظرفية (בְּ)'));

      // w17: بِرُوحِي (בְּרוּחִ֔י - Dagesh U+05BC before Sheva U+05B0) + construct case
      final a3 = MorphologyService.parse(
        code: 'HR/Ncbsc/Sp1cs',
        language: 'hebrew',
        arWord: 'بِرُوحِي',
        origWord: 'רוּחַ',
        origSurface: 'בְּרוּחִ֔י',
        strongsId: 'H7307',
        morphPos: 'noun',
        morphGender: 'common',
        morphNumber: 'singular',
        morphCase: 'construct',
        morphSource: 'oshb_wlc',
        verifiedLocator: 'OSHB:B38.C4.V6.w17',
      );
      expect(a3.prefixes, contains('باء الجر والظرفية (בְּ)'));
      expect(a3.grammaticalCase, contains('الإضافة'));

      // Control test: בַּיִת (H1004, HNcmsa) where Bet is root letter, NOT preposition
      final control = MorphologyService.parse(
        code: 'HNcmsa',
        language: 'hebrew',
        arWord: 'بَيْتُ',
        origWord: 'בַּיִת',
        origSurface: 'בַּיִת',
        strongsId: 'H1004',
        morphPos: 'noun',
        morphGender: 'masculine',
        morphNumber: 'singular',
        morphSource: 'oshb_wlc',
      );
      expect(control.prefixes, isNot(contains('باء الجر والظرفية (בְּ)')));

      // Construct state test for w6: كَلِمَةُ (דְּבַר־, HNcmsc)
      final constructWord = MorphologyService.parse(
        code: 'HNcmsc',
        language: 'hebrew',
        arWord: 'كَلِمَةُ',
        origWord: 'דָּבָר',
        origSurface: 'דְּבַר־',
        strongsId: 'H1697',
        morphPos: 'noun',
        morphGender: 'masculine',
        morphNumber: 'singular',
        morphCase: 'construct',
        morphSource: 'oshb_wlc',
        verifiedLocator: 'OSHB:B38.C4.V6.w6',
      );
      expect(constructWord.grammaticalCase, contains('الإضافة'));
    });

    test('Aramaic AR/ Bet prefix detector, non-Bet بِحِجَارَةٍ, Aramaic construct label & Peil passive (v1.0.374)', () {
      // 4 Aramaic forms starting with Bet preposition (AR/): Ezra 5:8 (בְּכֻתְלַיָּא, בְּיֶדְהֹם) & Dan 4:17 (בִּגְזֵרַת, בְּמַלְכ֣וּת)
      final arBetCases = [
        (code: 'AR/Ncmpd/Td', ar: 'الْحِيطَانِ', orig: 'כְּתַל', surf: 'בְּכֻתְלַיָּ֑א', id: 'H3797', gen: 'masculine', num: 'plural', c: null),
        (code: 'AR/Ncfsc/Sp3mp', ar: 'أَيْدِيهِمْ', orig: 'יַד', surf: 'בְּיֶדְהֹֽם', id: 'H3028', gen: 'feminine', num: 'singular', c: 'construct'),
        (code: 'AR/Ncfsc', ar: 'بِقَضَاءِ', orig: 'גְּזֵרָה', surf: 'בִּגְזֵרַ֤ת', id: 'H1510', gen: 'feminine', num: 'singular', c: 'construct'),
        (code: 'AR/Ncfsc', ar: 'مَمْلَكَةِ', orig: 'מַלְכוּ', surf: 'בְּמַלְכ֣וּת', id: 'H4437', gen: 'feminine', num: 'singular', c: 'construct'),
      ];
      for (final item in arBetCases) {
        final m = MorphologyService.parse(
          code: item.code,
          language: 'aramaic',
          arWord: item.ar,
          origWord: item.orig,
          origSurface: item.surf,
          strongsId: item.id,
          morphPos: 'noun',
          morphGender: item.gen,
          morphNumber: item.num,
          morphCase: item.c,
          morphSource: 'oshb_wlc',
        );
        expect(m.prefixes, contains('باء الجر والظرفية (בְּ)'), reason: 'Missing Bet prefix on ${item.surf} (${item.code})');
        if (item.c == 'construct') {
          expect(m.grammaticalCase, equals('حالة الإضافة الآرامية (Construct)'));
        }
      }

      // Negative test: Ezra 5:8 بِحِجَارَةٍ (אֶ֣בֶן, H69, ANcfsc) has Arabic بِـ only, NO Aramaic Bet prefix
      final stones = MorphologyService.parse(
        code: 'ANcfsc',
        language: 'aramaic',
        arWord: 'بِحِجَارَةٍ',
        origWord: 'אֶבֶן',
        origSurface: 'אֶ֣בֶן',
        strongsId: 'H69',
        morphPos: 'noun',
        morphGender: 'feminine',
        morphNumber: 'singular',
        morphCase: 'construct',
        morphSource: 'oshb_wlc',
        verifiedLocator: 'OSHB:B15.C5.V8.w13',
      );
      expect(stones.prefixes.any((p) => p.contains('باء')), isFalse);
      expect(stones.grammaticalCase, equals('حالة الإضافة الآرامية (Construct)'));

      // Ezra 5:8 arPos 2 مَعْلُومًا (יְדִ֣יעַ, H3046, AVQsmsa): Peil passive participle
      final known = MorphologyService.parse(
        code: 'AVQsmsa',
        language: 'aramaic',
        arWord: 'مَعْلُومًا',
        origWord: 'יְדַע',
        origSurface: 'יְדִ֣יעַ',
        strongsId: 'H3046',
        morphPos: 'verb',
        morphStem: 'peil',
        morphVoice: 'passive',
        morphMood: 'passive_participle',
        morphGender: 'masculine',
        morphNumber: 'singular',
        morphSource: 'oshb_wlc',
        verifiedLocator: 'OSHB:B15.C5.V8.w1',
      );
      expect(known.stem, contains('Peil'));
      expect(known.voice, contains('Passive'));
      expect(known.mood, contains('اسم مفعول'));
    });

    test('StrongsModal.resolveMorphologyLanguage prioritizes mapping.origWordLang over entry.language', () {
      const entry = StrongsEntry(
        strongsId: 'H1005',
        language: 'hebrew',
        originalWord: 'בַּיִת',
        transliteration: 'bayith',
        definitionEn: 'house',
        arIsVerified: true,
      );
      const aramaicMapping = WordMapping(
        id: 'wm_ezra_5_8_11',
        verseId: 'ezra_5_8',
        arWordPosition: 11,
        origWordPosition: 8,
        arWord: 'بَيْتِ',
        origWord: 'בַּיִת',
        origSurface: 'לְבֵית֙',
        origWordLang: 'aramaic',
        origMorphology: 'AR/Ncmsc',
        morphPos: 'noun',
        morphNumber: 'singular',
        morphGender: 'masculine',
        morphCase: 'construct',
        strongsId: 'H1005',
        isVerified: true,
      );
      expect(
        StrongsModal.resolveMorphologyLanguage(mapping: aramaicMapping, entry: entry),
        equals('aramaic'),
      );
      expect(
        StrongsModal.resolveMorphologyLanguage(mapping: null, entry: entry),
        equals('hebrew'),
      );
      expect(StrongsModal.formatLanguageBadge('aramaic'), equals('الآرامية'));
      expect(StrongsModal.formatLanguageBadge('Aramaic'), equals('الآرامية'));
      expect(StrongsModal.formatLanguageBadge('hebrew'), equals('Hebrew'));
      expect(StrongsModal.formatLanguageBadge('greek'), equals('Greek'));
    });
  });

  group('Ezra 5:8 Actual Modal Widget Tests (v1.0.375)', () {
    testWidgets('StrongsModal renders Aramaic Construct label for Ezra 5:8 H1005 even when entry.language is hebrew', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      const entry = StrongsEntry(
        strongsId: 'H1005',
        language: 'hebrew',
        originalWord: 'בַּיִת',
        transliteration: 'bayith',
        definitionEn: '(Aramaic) corresponding to H1004; a house',
        arIsVerified: true,
      );
      const mapping = WordMapping(
        id: 'wm_ezra_5_8_11',
        verseId: 'ezra_5_8',
        arWordPosition: 11,
        origWordPosition: 8,
        arWord: 'بَيْتِ',
        origWord: 'בַּיִת',
        origSurface: 'לְבֵית֙',
        origWordLang: 'aramaic',
        origMorphology: 'AR/Ncmsc',
        morphPos: 'noun',
        morphNumber: 'singular',
        morphGender: 'masculine',
        morphCase: 'construct',
        strongsId: 'H1005',
        strongsIds: ['H1005'],
        isVerified: true,
      );

      final studyProvider = WordStudyProvider()..setTestStrongsEntry(entry);
      final themeProvider = ThemeProvider();
      addTearDown(studyProvider.dispose);
      addTearDown(themeProvider.dispose);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<WordStudyProvider>.value(value: studyProvider),
            ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: SizedBox.expand(
                child: StrongsModal(strongsId: 'H1005', mapping: mapping),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('strongs_modal_lang_badge')), findsOneWidget);
      expect(find.text('الآرامية'), findsOneWidget);
      expect(find.text('Hebrew'), findsNothing);
      expect(find.text('H1005'), findsOneWidget);
      expect(find.textContaining('حالة الإضافة الآرامية (Construct)'), findsOneWidget);
      expect(find.textContaining('حالة الإضافة العبرية'), findsNothing);
    });

    testWidgets('StrongsModal & MorphologyModal render Ezra 5:8 H3046 Peil Passive Participle with Aramaic labels', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      const entry = StrongsEntry(
        strongsId: 'H3046',
        language: 'hebrew',
        originalWord: 'יְדַע',
        transliteration: 'yeda',
        definitionEn: '(Aramaic) corresponding to H3045; to know',
        arIsVerified: true,
      );
      const mapping = WordMapping(
        id: 'wm_ezra_5_8_2',
        verseId: 'ezra_5_8',
        arWordPosition: 2,
        origWordPosition: 1,
        arWord: 'مَعْلُومًا',
        origWord: 'יְדַע',
        origSurface: 'יְדִ֣יעַ',
        origWordLang: 'aramaic',
        origMorphology: 'AVQsmsa',
        morphPos: 'verb',
        morphStem: 'peil',
        morphVoice: 'passive',
        morphMood: 'passive_participle',
        morphNumber: 'singular',
        morphGender: 'masculine',
        strongsId: 'H3046',
        strongsIds: ['H3046'],
        isVerified: true,
      );

      final studyProvider = WordStudyProvider()..setTestStrongsEntry(entry);
      final themeProvider = ThemeProvider();
      addTearDown(studyProvider.dispose);
      addTearDown(themeProvider.dispose);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<WordStudyProvider>.value(value: studyProvider),
            ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: SizedBox.expand(
                child: StrongsModal(strongsId: 'H3046', mapping: mapping),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('الآرامية'), findsOneWidget);
      expect(find.text('Hebrew'), findsNothing);
      expect(find.text('H3046'), findsOneWidget);
      expect(find.textContaining('وزن بَعِيل الآرامي المجهول (Peil)'), findsOneWidget);
      expect(find.textContaining('الوزن الصرفي الآرامي'), findsOneWidget);
      expect(find.textContaining('اسم مفعول'), findsWidgets);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox.expand(
              child: MorphologyModal(mapping: mapping),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('اللغة الآرامية للعهد القديم'), findsOneWidget);
      expect(find.textContaining('وزن بَعِيل الآرامي المجهول (Peil)'), findsWidgets);
      expect(find.textContaining('الوزن الصرفي الآرامي'), findsOneWidget);
    });

    testWidgets('StrongsModal renders Aramaic Construct & no Bet prefix for Ezra 5:8 H69 (בِحِجَارَةٍ) when entry has no Aramaic tag', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      const entry = StrongsEntry(
        strongsId: 'H69',
        language: 'hebrew',
        originalWord: 'אֶבֶן',
        transliteration: 'eben',
        definitionEn: 'a stone',
        arIsVerified: true,
      );
      const mapping = WordMapping(
        id: 'wm_ezra_5_8_17',
        verseId: 'ezra_5_8',
        arWordPosition: 17,
        origWordPosition: 13,
        arWord: 'بِحِجَارَةٍ',
        origWord: 'אֶבֶן',
        origSurface: 'אֶ֣בֶן',
        origWordLang: 'aramaic',
        origMorphology: 'ANcfsc',
        morphPos: 'noun',
        morphNumber: 'singular',
        morphGender: 'feminine',
        morphCase: 'construct',
        strongsId: 'H69',
        strongsIds: ['H69'],
        isVerified: true,
      );

      final studyProvider = WordStudyProvider()..setTestStrongsEntry(entry);
      final themeProvider = ThemeProvider();
      addTearDown(studyProvider.dispose);
      addTearDown(themeProvider.dispose);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<WordStudyProvider>.value(value: studyProvider),
            ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: SizedBox.expand(
                child: StrongsModal(strongsId: 'H69', mapping: mapping),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('الآرامية'), findsOneWidget);
      expect(find.text('Hebrew'), findsNothing);
      expect(find.text('H69'), findsOneWidget);
      expect(find.textContaining('حالة الإضافة الآرامية (Construct)'), findsOneWidget);
      expect(find.textContaining('حالة الإضافة العبرية'), findsNothing);
      expect(find.textContaining('باء الجر'), findsNothing);
    });

    testWidgets('StrongsModal renders Dan 4:17 H6634 (יَشَاءُ) Yiqtol + OSHB AVqp3ms note & H6966 Aphel (v1.0.376)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      const entryYasha = StrongsEntry(
        strongsId: 'H6634',
        language: 'hebrew',
        originalWord: 'צְבָא',
        transliteration: 'tsebâʼ',
        definitionEn: '(Aramaic) to please, desire',
        arIsVerified: true,
      );
      const mappingYasha = WordMapping(
        id: 'wm_dan_4_17_19',
        verseId: 'dan_4_17',
        arWordPosition: 19,
        origWordPosition: 21,
        arWord: 'يَشَاءُ',
        origWord: 'צְבָא',
        origSurface: 'יִצְבֵּא֙',
        origWordLang: 'aramaic',
        origMorphology: 'AVqp3ms',
        morphPos: 'verb',
        morphStem: 'peal',
        morphTense: 'yiqtol',
        morphVoice: 'active',
        morphMood: 'indicative',
        morphPerson: '3',
        morphNumber: 'singular',
        morphGender: 'masculine',
        strongsId: 'H6634',
        strongsIds: ['H6634'],
        grammarNotes: 'ملاحظة الوسم: ورد اللفظ «יִצְבֵּא» (w21) في مدونة OSHB بالوسم الحرفي AVqp3ms، بينما تدرجه المعاجم فعلاً مضارعًا (Peal Yiqtol 3ms).',
        isVerified: true,
      );

      final studyProvider = WordStudyProvider()..setTestStrongsEntry(entryYasha);
      final themeProvider = ThemeProvider();
      addTearDown(studyProvider.dispose);
      addTearDown(themeProvider.dispose);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<WordStudyProvider>.value(value: studyProvider),
            ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: SizedBox.expand(
                child: StrongsModal(strongsId: 'H6634', mapping: mappingYasha),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('الآرامية'), findsOneWidget);
      expect(find.text('Hebrew'), findsNothing);
      expect(find.text('H6634'), findsOneWidget);
      expect(find.textContaining('الوزن الصرفي الآرامي'), findsOneWidget);
      expect(find.textContaining('Yiqtol'), findsWidgets);
      expect(find.textContaining('AVqp3ms'), findsWidgets);
      expect(find.textContaining('المعاجم'), findsOneWidget);

      // Verify H6966 (وَيُنَصِّبَ) Aphel stem renders with Aramaic label
      const mappingAphel = WordMapping(
        id: 'wm_dan_4_17_20',
        verseId: 'dan_4_17',
        arWordPosition: 20,
        origWordPosition: 25,
        arWord: 'وَيُنَصِّبَ',
        origWord: 'קוּם',
        origSurface: 'יְקִ֥ים',
        origWordLang: 'aramaic',
        origMorphology: 'AVai3ms',
        morphPos: 'verb',
        morphStem: 'aphel',
        morphTense: 'yiqtol',
        morphVoice: 'active',
        morphMood: 'indicative',
        morphPerson: '3',
        morphNumber: 'singular',
        morphGender: 'masculine',
        strongsId: 'H6966',
        strongsIds: ['H6966'],
        isVerified: true,
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox.expand(
              child: MorphologyModal(mapping: mappingAphel),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.textContaining('اللغة الآرامية للعهد القديم'), findsOneWidget);
      expect(find.textContaining('وزن أفعل الآرامي السببي (Aphel)'), findsWidgets);
    });

    testWidgets('StrongsModal keeps Hebrew badge for Hebrew record while preserving Strong ID', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      const hebrewEntry = StrongsEntry(
        strongsId: 'H1697',
        language: 'hebrew',
        originalWord: 'דָּבָר',
        transliteration: 'dabar',
        definitionEn: 'word, matter',
        arIsVerified: true,
      );
      const hebrewMapping = WordMapping(
        id: 'wm_zech_4_6_6',
        verseId: 'zech_4_6',
        arWordPosition: 6,
        origWordPosition: 6,
        arWord: 'كَلِمَةُ',
        origWord: 'דָּבָר',
        origSurface: 'דְּבַר־',
        origWordLang: 'hebrew',
        origMorphology: 'HNcmsc',
        morphPos: 'noun',
        morphGender: 'masculine',
        morphNumber: 'singular',
        morphCase: 'construct',
        strongsId: 'H1697',
        strongsIds: ['H1697'],
        isVerified: true,
      );

      final studyProvider = WordStudyProvider()..setTestStrongsEntry(hebrewEntry);
      final themeProvider = ThemeProvider();
      addTearDown(studyProvider.dispose);
      addTearDown(themeProvider.dispose);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<WordStudyProvider>.value(value: studyProvider),
            ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: SizedBox.expand(
                child: StrongsModal(strongsId: 'H1697', mapping: hebrewMapping),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Hebrew'), findsOneWidget);
      expect(find.text('الآرامية'), findsNothing);
      expect(find.text('H1697'), findsOneWidget);
    });
  });
}
