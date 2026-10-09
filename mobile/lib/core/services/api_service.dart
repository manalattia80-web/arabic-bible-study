// lib/core/services/api_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Offline-first Data & Sync Service.
// Prioritizes local SQLite database for instant, zero-latency, offline reading,
// with graceful API fallback and online synchronization.
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api.dart';
import '../../models/testament.dart';
import '../../models/book.dart';
import '../../models/verse.dart';
import '../../models/word_mapping.dart';
import '../../models/strongs_entry.dart';
import '../../models/word_occurrence.dart';
import 'database_service.dart';

class ApiService {
  ApiService._();

  static final _client = http.Client();

  static Future<Map<String, dynamic>> _get(String path) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$path');
    try {
      final res = await _client.get(uri).timeout(const Duration(seconds: 10));
      if (res.statusCode >= 400) {
        final body = jsonDecode(res.body);
        throw ApiException(body['message'] ?? 'HTTP ${res.statusCode}', res.statusCode);
      }
      return jsonDecode(res.body) as Map<String, dynamic>;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException('Network error: $e', 0);
    }
  }

  // ── Navigation (100% Offline with API Fallback) ────────────────────────────

  static Future<List<Testament>> getTestaments() async {
    return DatabaseService.instance.getTestaments();
  }

  static Future<List<Book>> getBooks({int? testamentId}) async {
    try {
      final local = await DatabaseService.instance.getBooks(testamentId: testamentId);
      if (local.isNotEmpty) return local;
    } catch (_) {}

    final q = testamentId != null ? '?testament_id=$testamentId' : '';
    final json = await _get('/books$q');
    return (json['data'] as List).map((j) => Book.fromJson(j)).toList();
  }

  static Future<List<int>> getChapters(int bookId) async {
    try {
      final local = await DatabaseService.instance.getChapters(bookId);
      if (local.isNotEmpty) return local;
    } catch (_) {}

    final json = await _get('/chapters?book_id=$bookId');
    return (json['data'] as List).map((j) => j['number'] as int).toList();
  }

  static Future<List<Verse>> getVerses(int bookId, int chapterNum) async {
    try {
      final local = await DatabaseService.instance.getVerses(bookId, chapterNum);
      if (local.isNotEmpty) return local;
    } catch (_) {}

    final json = await _get('/verses?book_id=$bookId&chapter_num=$chapterNum');
    return (json['data'] as List).map((j) => Verse.fromJson(j)).toList();
  }

  // ── Word Study (Local Cache + Network Sync) ───────────────────────────────

  static Future<List<WordMapping>> getWordMappings(String verseId) async {
    // 1. Try local SQLite database first
    try {
      final local = await DatabaseService.instance.getWordMappings(verseId);
      if (local.isNotEmpty) return local;
    } catch (_) {}

    // 2. Fetch from API and cache locally
    try {
      final json = await _get('/word-mappings?verse_id=$verseId');
      final list = (json['data'] as List).map((j) => WordMapping.fromJson(j)).toList();
      if (list.isNotEmpty) {
        DatabaseService.instance.saveWordMappings(verseId, list);
      }
      return list;
    } catch (e) {
      final local = await DatabaseService.instance.getWordMappings(verseId);
      if (local.isNotEmpty) return local;
      rethrow;
    }
  }

  static Future<StrongsEntry?> getStrongsEntry(String strongsId) async {
    // 1. Try local SQLite database first
    try {
      final local = await DatabaseService.instance.getStrongsEntry(strongsId);
      if (local != null && local.hasArabicDef) return local;
    } catch (_) {}

    // 2. Try online API
    try {
      final json = await _get('/strongs/$strongsId');
      return StrongsEntry.fromJson(json['data']);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      return await DatabaseService.instance.getStrongsEntry(strongsId);
    } catch (_) {
      return await DatabaseService.instance.getStrongsEntry(strongsId);
    }
  }

  static Future<List<WordOccurrence>> getStrongsOccurrences(String strongsId) async {
    try {
      final json = await _get('/strongs/$strongsId/occurrences');
      return (json['data'] as List).map((j) => WordOccurrence.fromJson(j)).toList();
    } catch (e) {
      return [];
    }
  }

  // ── Search (Offline Full-Text Search with API Fallback) ─────────────────────

  static Future<SearchResult> searchVerses(
    String q, {
    int? testamentId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final params = StringBuffer('/search/verses?q=${Uri.encodeQueryComponent(q)}&page=$page&limit=$limit');
      if (testamentId != null) params.write('&testament_id=$testamentId');
      final json = await _get(params.toString());
      return SearchResult(
        verses: (json['data'] as List).map((j) => Verse.fromJson(j)).toList(),
        total:  (json['meta']?['total'] as int?) ?? 0,
      );
    } catch (_) {
      // Offline fallback search
      final localVerses = await DatabaseService.instance.searchVerses(
        q,
        testamentId: testamentId,
        page: page,
        limit: limit,
      );
      return SearchResult(
        verses: localVerses,
        total:  localVerses.length,
      );
    }
  }
}

// ── Models for API responses ────────────────────────────────────
class ApiException implements Exception {
  final String message;
  final int statusCode;
  const ApiException(this.message, this.statusCode);
  @override String toString() => 'ApiException($statusCode): $message';
}

class SearchResult {
  final List<Verse> verses;
  final int total;
  const SearchResult({required this.verses, required this.total});
}
