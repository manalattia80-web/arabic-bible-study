// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/theme_provider.dart';
import 'providers/navigation_provider.dart';
import 'providers/reader_provider.dart';
import 'providers/word_study_provider.dart';
import 'providers/update_provider.dart';
import 'core/services/database_service.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Guarantee offline SQLite database is ready before UI renders
  try {
    await DatabaseService.instance.database;
  } catch (e) {
    debugPrint('Database initialization warning: $e');
  }

  // Lock to portrait mode (can be unlocked later for tablets)
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
  ));

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => NavigationProvider()),
        ChangeNotifierProvider(create: (_) => ReaderProvider()),
        ChangeNotifierProvider(create: (_) => WordStudyProvider()),
        ChangeNotifierProvider(create: (_) => UpdateProvider()),
      ],
      child: const ArabicBibleApp(),
    ),
  );
}
