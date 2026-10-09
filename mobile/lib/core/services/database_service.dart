// lib/core/services/database_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// Embedded Offline SQLite Database Service.
// Automatically unpacks assets/bible_study.db and provides 100% offline access.
// ─────────────────────────────────────────────────────────────────────────────

import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path/path.dart' as p;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';

import '../../models/book.dart';
import '../../models/testament.dart';
import '../../models/verse.dart';
import '../../models/word_mapping.dart';
import '../../models/strongs_entry.dart';

class DatabaseService {
  DatabaseService._();
  static final DatabaseService instance = DatabaseService._();

  Database? _db;

  Future<Database> get database async {
    if (_db != null && _db!.isOpen) return _db!;
    _db = await _initDatabase();
    return _db!;
  }

  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final dbPath = p.join(databasesPath, 'bible_study_v2.db');

    final prefs = await SharedPreferences.getInstance();
    final currentDbVersion = prefs.getInt('db_version') ?? 0;
    const targetDbVersion = 2; // Incremented for full offline release

    final exists = await databaseExists(dbPath);
    if (!exists || currentDbVersion < targetDbVersion) {
      debugPrint('Initializing local offline SQLite database (v$targetDbVersion) at $dbPath...');
      try {
        await Directory(p.dirname(dbPath)).create(recursive: true);
      } catch (_) {}

      // Copy from asset
      final data = await rootBundle.load('assets/bible_study.db');
      final bytes = data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
      await File(dbPath).writeAsBytes(bytes, flush: true);
      await prefs.setInt('db_version', targetDbVersion);
      debugPrint('Local SQLite database copied successfully (${bytes.length} bytes).');
    }

    return await openDatabase(dbPath);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  Future<List<Testament>> getTestaments() async {
    return const [
      Testament(id: 1, nameAr: 'العهد القديم', nameEn: 'Old Testament', originalLang: 'hebrew'),
      Testament(id: 2, nameAr: 'العهد الجديد', nameEn: 'New Testament', originalLang: 'greek'),
    ];
  }

  Future<List<Book>> getBooks({int? testamentId}) async {
    final db = await database;
    String sql = 'SELECT * FROM books';
    List<dynamic> args = [];
    if (testamentId != null) {
      final tName = testamentId == 1 ? 'old' : 'new';
      sql += ' WHERE LOWER(testament) = LOWER(?)';
      args.add(tName);
    }
    sql += ' ORDER BY order_num ASC';

    final rows = await db.rawQuery(sql, args);
    return rows.map((r) {
      final tStr = (r['testament'] as String? ?? 'old').toLowerCase();
      final tId = tStr == 'new' ? 2 : 1;
      return Book(
        id:           r['id'] as int,
        testamentId:  tId,
        nameAr:       r['name_ar'] as String,
        nameArShort:  (r['name_ar_short'] ?? r['name_ar']) as String,
        nameEn:       r['name_en'] as String,
        nameEnShort:  (r['name_en_short'] ?? r['name_en']) as String,
        nameOriginal: r['name_original'] as String?,
        chapterCount: (r['total_chapters'] as int?) ?? 0,
        sortOrder:    (r['order_num'] as int?) ?? (r['id'] as int),
      );
    }).toList();
  }

  Future<List<int>> getChapters(int bookId) async {
    final db = await database;
    final rows = await db.rawQuery(
      'SELECT DISTINCT chapter_num FROM verses WHERE book_id = ? ORDER BY chapter_num ASC',
      [bookId],
    );
    if (rows.isNotEmpty) {
      return rows.map((r) => r['chapter_num'] as int).toList();
    }
    // Fallback to book's total_chapters
    final bRows = await db.rawQuery('SELECT total_chapters FROM books WHERE id = ?', [bookId]);
    if (bRows.isNotEmpty) {
      final total = (bRows.first['total_chapters'] as int?) ?? 1;
      return List.generate(total, (i) => i + 1);
    }
    return [1];
  }

  // ── Verses ─────────────────────────────────────────────────────────────────

  Future<List<Verse>> getVerses(int bookId, int chapterNum) async {
    final db = await database;
    final rows = await db.rawQuery(
      'SELECT * FROM verses WHERE book_id = ? AND chapter_num = ? ORDER BY verse_num ASC',
      [bookId, chapterNum],
    );
    return rows.map((r) => Verse(
      id:               r['id'] as String,
      bookId:           r['book_id'] as int,
      chapterNum:       r['chapter_num'] as int,
      verseNum:         r['verse_num'] as int,
      textAvdAr:        r['text_avd_ar'] as String? ?? '',
      textOriginal:     r['text_original'] as String? ?? '',
      textOriginalLang: r['text_original_lang'] as String? ?? 'hebrew',
    )).toList();
  }

  // ── Word Study ─────────────────────────────────────────────────────────────

  Future<List<WordMapping>> getWordMappings(String verseId) async {
    final db = await database;
    final rows = await db.rawQuery(
      'SELECT * FROM word_mappings WHERE verse_id = ? ORDER BY ar_word_position ASC',
      [verseId],
    );
    return rows.map((r) => WordMapping.fromJson(Map<String, dynamic>.from(r))).toList();
  }

  Future<void> saveWordMappings(String verseId, List<WordMapping> mappings) async {
    if (mappings.isEmpty) return;
    final db = await database;
    final batch = db.batch();
    for (final m in mappings) {
      batch.insert(
        'word_mappings',
        {
          'id':                 m.id,
          'verse_id':           m.verseId,
          'ar_word_position':   m.arWordPosition,
          'ar_word':            m.arWord,
          'ar_word_normalized': m.arWordNormalized,
          'orig_word':          m.origWord,
          'orig_word_lang':     m.origWordLang,
          'strongs_id':          m.strongsId,
          'is_verified':         m.isVerified ? 1 : 0,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<StrongsEntry?> getStrongsEntry(String strongsId) async {
    final db = await database;
    final rows = await db.rawQuery('''
      SELECT 
        e.strongs_id,
        e.language,
        e.original_word,
        e.transliteration,
        e.definition_en,
        e.kjv_usage,
        t.pronunciation_ar,
        t.definition_ar,
        t.notes_ar,
        t.is_verified as ar_is_verified
      FROM strongs_entries e
      LEFT JOIN strongs_ar_translations t ON e.strongs_id = t.strongs_id
      WHERE e.strongs_id = ?
    ''', [strongsId]);

    if (rows.isEmpty) return null;
    final r = rows.first;
    return StrongsEntry(
      strongsId:       r['strongs_id'] as String,
      language:        r['language'] as String? ?? 'hebrew',
      originalWord:    r['original_word'] as String? ?? '',
      transliteration: r['transliteration'] as String? ?? '',
      audioUrl:        null, // Synthesized on the fly by StrongsEntry.fromJson or fallback
      definitionEn:    r['definition_en'] as String? ?? '',
      kjvUsage:        r['kjv_usage'] as String?,
      definitionAr:    r['definition_ar'] as String?,
      notesAr:         r['notes_ar'] as String?,
      pronunciationAr: r['pronunciation_ar'] as String?,
      arIsVerified:    (r['ar_is_verified'] == 1 || r['ar_is_verified'] == true),
    );
  }

  // ── Offline Search ─────────────────────────────────────────────────────────

  Future<List<Verse>> searchVerses(String query, {int? testamentId, int page = 1, int limit = 20}) async {
    final db = await database;
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) return [];

    String sql = '''
      SELECT v.*, b.name_ar as book_name_ar 
      FROM verses v 
      JOIN books b ON v.book_id = b.id 
      WHERE v.text_avd_ar LIKE ?
    ''';
    List<dynamic> args = ['%$cleanQuery%'];

    if (testamentId != null) {
      final tStr = testamentId == 1 ? 'old' : 'new';
      sql += ' AND LOWER(b.testament) = ?';
      args.add(tStr);
    }

    sql += ' ORDER BY v.book_id ASC, v.chapter_num ASC, v.verse_num ASC LIMIT ? OFFSET ?';
    args.add(limit);
    args.add((page - 1) * limit);

    final rows = await db.rawQuery(sql, args);

    return rows.map((r) => Verse(
      id:               r['id'] as String,
      bookId:           r['book_id'] as int,
      chapterNum:       r['chapter_num'] as int,
      verseNum:         r['verse_num'] as int,
      textAvdAr:        r['text_avd_ar'] as String? ?? '',
      textOriginal:     r['text_original'] as String? ?? '',
      textOriginalLang: r['text_original_lang'] as String? ?? 'hebrew',
      bookNameAr:       r['book_name_ar'] as String?,
    )).toList();
  }
}
