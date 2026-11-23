import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:arabic_bible_study/core/services/search_history_service.dart';
import 'package:arabic_bible_study/features/navigation/widgets/backup_restore_modal.dart';
import 'package:arabic_bible_study/providers/theme_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'BackupRestoreModal UI end-to-end: export to clipboard -> fresh install -> restore updates ThemeProvider & search history',
    (WidgetTester tester) async {
      String? clipboardText;
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(SystemChannels.platform, (MethodCall call) async {
        if (call.method == 'Clipboard.setData') {
          final args = call.arguments as Map<dynamic, dynamic>;
          clipboardText = args['text'] as String?;
          return null;
        }
        if (call.method == 'Clipboard.getData') {
          return <String, dynamic>{'text': clipboardText};
        }
        return null;
      });
      addTearDown(() {
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
            .setMockMethodCallHandler(SystemChannels.platform, null);
      });

      // Step 1: Old install state with dark mode enabled + 2 Arabic search terms
      SharedPreferences.setMockInitialValues({
        'is_dark_mode': true,
        'recent_search_queries': ['المحبة', 'الإيمان'],
        'db_version': 382,
      });

      final oldThemeProvider = ThemeProvider();
      await oldThemeProvider.reloadFromPrefs();
      expect(oldThemeProvider.isDark, isTrue);

      await tester.pumpWidget(
        ChangeNotifierProvider<ThemeProvider>.value(
          value: oldThemeProvider,
          child: MaterialApp(
            home: Builder(
              builder: (context) => Scaffold(
                body: ElevatedButton(
                  key: const Key('open_modal_btn'),
                  onPressed: () => showBackupRestoreModal(context),
                  child: const Text('Open'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.byKey(const Key('open_modal_btn')));
      await tester.pumpAndSettle();

      // Export to clipboard via UI button
      await tester.tap(find.byKey(const Key('backup_export_btn')));
      await tester.pumpAndSettle();

      expect(clipboardText, isNotNull);
      expect(clipboardText, contains('"is_dark_mode": true'));
      expect(clipboardText, contains('المحبة'));
      expect(clipboardText, contains('الإيمان'));

      // Step 2: Simulate clean Play-signed reinstall (empty user prefs, light mode)
      SharedPreferences.setMockInitialValues({'db_version': 382});
      final freshThemeProvider = ThemeProvider();
      await freshThemeProvider.reloadFromPrefs();
      expect(freshThemeProvider.isDark, isFalse);

      await tester.pumpWidget(
        ChangeNotifierProvider<ThemeProvider>.value(
          value: freshThemeProvider,
          child: MaterialApp(
            home: Builder(
              builder: (context) => Scaffold(
                body: ElevatedButton(
                  key: const Key('open_modal_btn_fresh'),
                  onPressed: () => showBackupRestoreModal(context),
                  child: const Text('Open Fresh'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.byKey(const Key('open_modal_btn_fresh')));
      await tester.pumpAndSettle();

      // Enter exported JSON and tap Restore button
      await tester.enterText(
        find.byKey(const Key('backup_restore_input')),
        clipboardText!,
      );
      await tester.tap(find.byKey(const Key('backup_restore_submit_btn')));
      await tester.pumpAndSettle();

      // Verify restored preferences + live ThemeProvider update + protected db_version
      expect(freshThemeProvider.isDark, isTrue);
      expect(
        await SearchHistoryService.getRecentQueries(),
        equals(['المحبة', 'الإيمان']),
      );
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getInt('db_version'), 382);
      expect(find.textContaining('تمت الاستعادة بنجاح'), findsOneWidget);
    },
  );
}
