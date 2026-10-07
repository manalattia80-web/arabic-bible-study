// lib/core/services/api_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// HTTP service that fetches data from the Fastify backend.
// All methods return typed model objects and throw descriptive errors.
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

class ApiService {
  ApiService._();

  static final _client = http.Client();

  static Future<Map<String, dynamic>> _get(String path) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$path');
    try {
      final res = await _client.get(uri).timeout(const Duration(seconds: 15));
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

  // ── Navigation ──────────────────────────────────────────────
  static Future<List<Testament>> getTestaments() async {
    final json = await _get('/testaments');
    return (json['data'] as List).map((j) => Testament.fromJson(j)).toList();
  }

  static Future<List<Book>> getBooks({int? testamentId}) async {
    final q = testamentId != null ? '?testament_id=$testamentId' : '';
    final json = await _get('/books$q');
    return (json['data'] as List).map((j) => Book.fromJson(j)).toList();
  }

  static Future<List<int>> getChapters(int bookId) async {
    final json = await _get('/chapters?book_id=$bookId');
    return (json['data'] as List).map((j) => j['number'] as int).toList();
  }

  static Future<List<Verse>> getVerses(int bookId, int chapterNum) async {
    final json = await _get('/verses?book_id=$bookId&chapter_num=$chapterNum');
    return (json['data'] as List).map((j) => Verse.fromJson(j)).toList();
  }

  // ── Word Study ───────────────────────────────────────────────
  static Future<List<WordMapping>> getWordMappings(String verseId) async {
    final json = await _get('/word-mappings?verse_id=$verseId');
    return (json['data'] as List).map((j) => WordMapping.fromJson(j)).toList();
  }

  static Future<StrongsEntry?> getStrongsEntry(String strongsId) async {
    try {
      final json = await _get('/strongs/$strongsId');
      return StrongsEntry.fromJson(json['data']);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
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

  // ── Search ───────────────────────────────────────────────────
  static Future<SearchResult> searchVerses(
    String q, {
    int? testamentId,
    int page = 1,
    int limit = 20,
  }) async {
    final params = StringBuffer('/search/verses?q=${Uri.encodeQueryComponent(q)}&page=$page&limit=$limit');
    if (testamentId != null) params.write('&testament_id=$testamentId');
    final json = await _get(params.toString());
    return SearchResult(
      verses: (json['data'] as List).map((j) => Verse.fromJson(j)).toList(),
      total:  (json['meta']?['total'] as int?) ?? 0,
    );
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
