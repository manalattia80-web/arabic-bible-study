// lib/app.dart
// ─────────────────────────────────────────────────────────────────────────────
// Root app widget with go_router configuration and theme.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/navigation/screens/home_screen.dart';
import 'features/navigation/screens/book_list_screen.dart';
import 'features/navigation/screens/chapter_list_screen.dart';
import 'features/reader/screens/chapter_reader_screen.dart';
import 'features/word_study/screens/word_study_screen.dart';
import 'features/search/screens/search_screen.dart';

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'home',
      builder: (ctx, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/books/:testamentId',
      name: 'books',
      builder: (ctx, state) => BookListScreen(
        testamentId: int.parse(state.pathParameters['testamentId']!),
      ),
    ),
    GoRoute(
      path: '/chapters/:bookId',
      name: 'chapters',
      builder: (ctx, state) => ChapterListScreen(
        bookId: int.parse(state.pathParameters['bookId']!),
      ),
    ),
    GoRoute(
      path: '/reader/:bookId/:chapterNum',
      name: 'reader',
      builder: (ctx, state) => ChapterReaderScreen(
        bookId:     int.parse(state.pathParameters['bookId']!),
        chapterNum: int.parse(state.pathParameters['chapterNum']!),
      ),
    ),
    GoRoute(
      path: '/word-study/:verseId',
      name: 'word-study',
      builder: (ctx, state) => WordStudyScreen(
        verseId: state.pathParameters['verseId']!,
        // Pass verse data through extra to avoid extra API call
        verse: state.extra as Map<String, dynamic>?,
      ),
    ),
    GoRoute(
      path: '/search',
      name: 'search',
      builder: (ctx, state) => const SearchScreen(),
    ),
  ],
);

class ArabicBibleApp extends StatelessWidget {
  const ArabicBibleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title:              'البحث الكتابي العربي',
      debugShowCheckedModeBanner: false,
      theme:              AppTheme.dark,
      routerConfig:       _router,
      // Force LTR layout for the app shell; individual RTL widgets are handled locally
      builder: (context, child) => Directionality(
        textDirection: TextDirection.ltr,
        child: child!,
      ),
    );
  }
}
