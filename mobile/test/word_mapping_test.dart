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
  });
}
