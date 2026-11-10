import 'package:flutter_test/flutter_test.dart';
import 'package:arabic_bible_study/models/word_mapping.dart';
import 'package:arabic_bible_study/core/services/morphology_service.dart';

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
  });
}
