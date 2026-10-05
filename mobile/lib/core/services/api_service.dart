// lib/core/services/api_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Unified Service routing queries to the Offline Local SQLite Database.
// Automatically falls back to local database for 100% offline functionality.
// ─────────────────────────────────────────────────────────────────────────────

import '../../models/testament.dart';
import '../../models/book.dart';
import '../../models/verse.dart';
import '../../models/word_mapping.dart';
import '../../models/strongs_entry.dart';
import '../../models/word_occurrence.dart';
import 'local_db_service.dart';

class ApiService {
  ApiService._();

  // ── Navigation ──────────────────────────────────────────────
  static Future<List<Testament>> getTestaments() async {
    return await LocalDatabaseService.instance.getTestaments();
  }

  static Future<List<Book>> getBooks({int? testamentId}) async {
    return await LocalDatabaseService.instance.getBooks(testamentId: testamentId);
  }

  static Future<List<int>> getChapters(int bookId) async {
    return await LocalDatabaseService.instance.getChapters(bookId);
  }

  static Future<List<Verse>> getVerses(int bookId, int chapterNum) async {
    return await LocalDatabaseService.instance.getVerses(bookId, chapterNum);
  }

  // ── Word Study ───────────────────────────────────────────────
  static Future<List<WordMapping>> getWordMappings(String verseId) async {
    return await LocalDatabaseService.instance.getWordMappings(verseId);
  }

  static Future<StrongsEntry?> getStrongsEntry(String strongsId) async {
    return await LocalDatabaseService.instance.getStrongsEntry(strongsId);
  }

  static Future<List<WordOccurrence>> getStrongsOccurrences(String strongsId) async {
    return await LocalDatabaseService.instance.getStrongsOccurrences(strongsId);
  }

  // ── Search ───────────────────────────────────────────────────
  static Future<SearchResult> searchVerses(
    String q, {
    int? testamentId,
    int page = 1,
    int limit = 20,
  }) async {
    return await LocalDatabaseService.instance.searchVerses(
      q,
      testamentId: testamentId,
      page: page,
      limit: limit,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  const ApiException(this.message, this.statusCode);
  @override String toString() => 'ApiException($statusCode): $message';
}
