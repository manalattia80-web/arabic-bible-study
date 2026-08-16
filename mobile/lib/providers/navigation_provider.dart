// lib/providers/navigation_provider.dart
// ─────────────────────────────────────────────────────────────────────────────
// Manages testaments, books, and chapter lists.
// Data is fetched once and cached in memory during the session.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../models/testament.dart';
import '../models/book.dart';

class NavigationProvider extends ChangeNotifier {
  // ── State ──────────────────────────────────────────────────
  List<Testament> _testaments = [];
  List<Book>      _books      = [];
  List<Book>      _allBooks   = [];  // all 66, loaded once
  List<int>       _chapters   = [];

  bool   _loading = false;
  String _error   = '';

  // ── Getters ────────────────────────────────────────────────
  List<Testament> get testaments => _testaments;
  List<Book>      get books      => _books;
  List<int>       get chapters   => _chapters;
  bool            get loading    => _loading;
  String          get error      => _error;

  Book?     getBook(int id)      => _allBooks.where((b) => b.id == id).firstOrNull;
  Testament? getTestament(int id) => _testaments.where((t) => t.id == id).firstOrNull;

  // ── Actions ────────────────────────────────────────────────
  Future<void> loadTestaments() async {
    if (_testaments.isNotEmpty) return; // already cached
    _set(loading: true, error: '');
    try {
      _testaments = await ApiService.getTestaments();
      _error = '';
    } catch (e) {
      _error = e.toString();
    } finally {
      _set(loading: false);
    }
  }

  Future<void> loadBooks(int testamentId) async {
    // Check if we already have these books
    if (_books.isNotEmpty && _books.first.testamentId == testamentId) return;
    _set(loading: true, error: '');
    try {
      _books = await ApiService.getBooks(testamentId: testamentId);
      // Merge into allBooks cache
      for (final b in _books) {
        if (!_allBooks.any((ab) => ab.id == b.id)) _allBooks.add(b);
      }
      _error = '';
    } catch (e) {
      _error = e.toString();
    } finally {
      _set(loading: false);
    }
  }

  Future<void> loadChapters(int bookId) async {
    _set(loading: true, error: '');
    try {
      _chapters = await ApiService.getChapters(bookId);
      _error    = '';
    } catch (e) {
      _error = e.toString();
    } finally {
      _set(loading: false);
    }
  }

  void _set({bool? loading, String? error}) {
    if (loading != null) _loading = loading;
    if (error   != null) _error   = error;
    notifyListeners();
  }
}
