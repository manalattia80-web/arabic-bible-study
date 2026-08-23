// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/navigation_provider.dart';
import 'providers/reader_provider.dart';
import 'providers/word_study_provider.dart';
import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait mode (can be unlocked later for tablets)
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor:      Colors.transparent,
    statusBarBrightness: Brightness.light,
    statusBarIconBrightness: Brightness.dark,
  ));

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => NavigationProvider()),
        ChangeNotifierProvider(create: (_) => ReaderProvider()),
        ChangeNotifierProvider(create: (_) => WordStudyProvider()),
      ],
      child: const ArabicBibleApp(),
    ),
  );
}
