import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:arabic_bible_study/core/services/search_history_service.dart';
import 'package:arabic_bible_study/core/services/user_backup_service.dart';
import 'package:arabic_bible_study/providers/theme_provider.dart';

void main() {
  group('UserBackupService — Offline GitHub -> Play Migration', () {
    test('round-trips is_dark_mode and recent_search_queries accurately', () async {
      SharedPreferences.setMockInitialValues({
        'is_dark_mode': true,
        'recent_search_queries': ['المحبة', 'الإيمان', 'النعمة'],
        'db_version': 382,
      });

      final exported = await UserBackupService.exportToJson(
        now: DateTime.utc(2026, 11, 23, 20, 0, 0),
      );
      final decoded = jsonDecode(exported) as Map<String, dynamic>;
      expect(decoded['schema_version'], 1);
      expect(decoded['app_id'], 'com.arabicbible.study');
      expect(decoded['preferences']['is_dark_mode'], isTrue);
      expect(
        decoded['preferences']['recent_search_queries'],
        equals(['المحبة', 'الإيمان', 'النعمة']),
      );

      // Simulate clean reinstall on Play-signed build
      SharedPreferences.setMockInitialValues({'db_version': 382});
      final result = await UserBackupService.importFromJson(exported);
      expect(result.isDarkMode, isTrue);
      expect(result.recentSearchQueries, equals(['المحبة', 'الإيمان', 'النعمة']));

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('is_dark_mode'), isTrue);
      expect(
        await SearchHistoryService.getRecentQueries(),
        equals(['المحبة', 'الإيمان', 'النعمة']),
      );
      expect(prefs.getInt('db_version'), 382);
    });

    test('never overwrites internal db_version even if injected into JSON', () async {
      SharedPreferences.setMockInitialValues({
        'is_dark_mode': false,
        'recent_search_queries': <String>[],
        'db_version': 382,
      });

      final payload = jsonEncode({
        'schema_version': 1,
        'app_id': 'com.arabicbible.study',
        'exported_at': '2026-11-23T20:00:00.000Z',
        'preferences': {
          'is_dark_mode': true,
          'recent_search_queries': ['السلام'],
          'db_version': 999,
        },
      });

      await UserBackupService.importFromJson(payload);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getInt('db_version'), 382);
      expect(prefs.getBool('is_dark_mode'), isTrue);
      expect(await SearchHistoryService.getRecentQueries(), equals(['السلام']));
    });

    test('rejects invalid payloads without mutating existing preferences', () async {
      SharedPreferences.setMockInitialValues({
        'is_dark_mode': true,
        'recent_search_queries': ['المحبة'],
      });

      final invalidInputs = <String>[
        '',
        'not json',
        '[]',
        jsonEncode({'schema_version': 2, 'app_id': 'com.arabicbible.study', 'preferences': {}}),
        jsonEncode({'schema_version': 1, 'app_id': 'com.other.app', 'preferences': {}}),
        jsonEncode({
          'schema_version': 1,
          'app_id': 'com.arabicbible.study',
          'preferences': {'is_dark_mode': 'true', 'recent_search_queries': []},
        }),
        jsonEncode({
          'schema_version': 1,
          'app_id': 'com.arabicbible.study',
          'preferences': {'is_dark_mode': false, 'recent_search_queries': [123]},
        }),
      ];

      for (final bad in invalidInputs) {
        await expectLater(
          UserBackupService.importFromJson(bad),
          throwsA(isA<UserBackupException>()),
        );
      }

      // Existing preferences remain completely untouched
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('is_dark_mode'), isTrue);
      expect(await SearchHistoryService.getRecentQueries(), equals(['المحبة']));
    });

    test('sanitizes, deduplicates, and caps recent_search_queries at 10 items', () async {
      SharedPreferences.setMockInitialValues({});
      final payload = jsonEncode({
        'schema_version': 1,
        'app_id': 'com.arabicbible.study',
        'preferences': {
          'is_dark_mode': false,
          'recent_search_queries': [
            '  المحبة  ',
            '',
            'المحبة',
            'الإيمان',
            'الرجاء',
            'النعمة',
            'السلام',
            'الفرح',
            'النور',
            'الحق',
            'الحياة',
            'الطريق',
            'الراعي',
            'الحمل',
          ],
        },
      });

      final result = await UserBackupService.importFromJson(payload);
      expect(result.recentSearchQueries.length, 10);
      expect(result.recentSearchQueries.first, 'المحبة');
      expect(result.recentSearchQueries.last, 'الطريق');
    });

    test('ThemeProvider.reloadFromPrefs reflects restored theme state', () async {
      SharedPreferences.setMockInitialValues({'is_dark_mode': false});
      final themeProvider = ThemeProvider();
      await themeProvider.reloadFromPrefs();
      expect(themeProvider.isDark, isFalse);

      final payload = jsonEncode({
        'schema_version': 1,
        'app_id': 'com.arabicbible.study',
        'preferences': {
          'is_dark_mode': true,
          'recent_search_queries': ['المحبة'],
        },
      });

      await UserBackupService.importFromJson(payload);
      await themeProvider.reloadFromPrefs();
      expect(themeProvider.isDark, isTrue);
    });
  });
}
