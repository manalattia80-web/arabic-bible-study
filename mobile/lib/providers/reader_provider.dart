// lib/providers/reader_provider.dart
// Manages the currently-displayed chapter's verses.

import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../models/verse.dart';

class ReaderProvider extends ChangeNotifier {
  List<Verse> _verses     = [];
  int?        _bookId;
  int?        _chapterNum;
  bool        _loading    = false;
  String      _error      = '';
  double      _fontSize   = 20.0;  // user-adjustable
  bool        _showOriginal = true; // toggle original text visibility

  List<Verse> get verses      => _verses;
  int?        get bookId      => _bookId;
  int?        get chapterNum  => _chapterNum;
  bool        get loading     => _loading;
  String      get error       => _error;
  double      get fontSize    => _fontSize;
  bool        get showOriginal => _showOriginal;

  Future<void> loadChapter(int bookId, int chapterNum) async {
    // Skip if already loaded
    if (_bookId == bookId && _chapterNum == chapterNum && _verses.isNotEmpty) return;

    _loading    = true;
    _error      = '';
    _bookId     = bookId;
    _chapterNum = chapterNum;
    notifyListeners();

    try {
      _verses = await ApiService.getVerses(bookId, chapterNum);
    } catch (e) {
      _error  = e.toString();
      _verses = [];
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void increaseFontSize() {
    if (_fontSize < 32) { _fontSize += 2; notifyListeners(); }
  }

  void decreaseFontSize() {
    if (_fontSize > 14) { _fontSize -= 2; notifyListeners(); }
  }

  void toggleOriginalText() {
    _showOriginal = !_showOriginal;
    notifyListeners();
  }

  void clear() {
    _verses    = [];
    _bookId    = null;
    _chapterNum = null;
    notifyListeners();
  }
}
