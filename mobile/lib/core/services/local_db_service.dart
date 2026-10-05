import 'dart:io';
import 'package:flutter/services.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../../models/book.dart';
import '../../models/testament.dart';
import '../../models/verse.dart';
import '../../models/word_mapping.dart';
import '../../models/strongs_entry.dart';
import '../../models/word_occurrence.dart';

class LocalDatabaseService {
  LocalDatabaseService._();
  static final LocalDatabaseService instance = LocalDatabaseService._();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDatabase();
    return _db!;
  }

  Future<Database> _initDatabase() async {
    final dbDir = await getDatabasesPath();
    final dbPath = join(dbDir, 'bible_study.db');

    final exists = await databaseExists(dbPath);
    if (!exists) {
      try {
        await Directory(dirname(dbPath)).create(recursive: true);
      } catch (_) {}

      final data = await rootBundle.load('assets/bible_study.db');
      final bytes = data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
      await File(dbPath).writeAsBytes(bytes, flush: true);
    }

    return await openDatabase(dbPath, readOnly: true);
  }

  // ── Navigation ──────────────────────────────────────────────
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
      final testamentName = testamentId == 1 ? 'OT' : 'NT';
      sql += ' WHERE testament = ?';
      args.add(testamentName);
    }
    sql += ' ORDER BY id ASC';

    final res = await db.rawQuery(sql, args);
    return res.map((row) {
      final testament = row['testament'] == 'OT' ? 1 : 2;
      final nameAr = row['name_ar'] as String? ?? '';
      final nameEn = row['name_en'] as String? ?? '';
      return Book(
        id: row['id'] as int,
        testamentId: testament,
        nameAr: nameAr,
        nameArShort: nameAr,
        nameEn: nameEn,
        nameEnShort: nameEn,
        chapterCount: row['total_chapters'] as int? ?? 1,
        sortOrder: row['order_num'] as int? ?? row['id'] as int,
      );
    }).toList();
  }

  Future<List<int>> getChapters(int bookId) async {
    final db = await database;
    final res = await db.rawQuery(
      'SELECT DISTINCT chapter_num FROM verses WHERE book_id = ? ORDER BY chapter_num ASC',
      [bookId],
    );
    return res.map((r) => r['chapter_num'] as int).toList();
  }

  Future<List<Verse>> getVerses(int bookId, int chapterNum) async {
    final db = await database;
    final res = await db.rawQuery(
      'SELECT * FROM verses WHERE book_id = ? AND chapter_num = ? ORDER BY verse_num ASC',
      [bookId, chapterNum],
    );

    return res.map((r) {
      final bookIdVal = r['book_id'] as int;
      final isOt = bookIdVal <= 39;
      return Verse(
        id: r['id'] as String,
        bookId: bookIdVal,
        chapterNum: r['chapter_num'] as int,
        verseNum: r['verse_num'] as int,
        textAvdAr: r['text_avd_ar'] as String? ?? '',
        textOriginal: r['text_original'] as String? ?? '',
        textOriginalLang: r['text_original_lang'] as String? ?? (isOt ? 'hebrew' : 'greek'),
      );
    }).toList();
  }

  // ── Word Study ───────────────────────────────────────────────
  Future<List<WordMapping>> getWordMappings(String verseId) async {
    final db = await database;
    final res = await db.rawQuery(
      'SELECT * FROM word_mappings WHERE verse_id = ? ORDER BY ar_word_position ASC',
      [verseId],
    );

    return res.map((r) {
      return WordMapping(
        id: r['id'] as String,
        verseId: r['verse_id'] as String,
        arWordPosition: r['ar_word_position'] as int? ?? 0,
        origWordPosition: r['orig_word_position'] as int? ?? 0,
        arWord: r['ar_word'] as String? ?? '',
        origWord: r['orig_word'] as String? ?? '',
        origWordLang: r['orig_word_lang'] as String? ?? 'hebrew',
        strongsId: r['strongs_id'] as String?,
        isVerified: (r['is_verified'] as int? ?? 0) == 1,
      );
    }).toList();
  }

  Future<StrongsEntry?> getStrongsEntry(String strongsId) async {
    final db = await database;
    final res = await db.rawQuery(
      '''
      SELECT e.strongs_id, e.original_word, e.definition_en, e.kjv_usage,
             t.pronunciation_ar, t.definition_ar, t.notes_ar, t.is_verified
      FROM strongs_entries e
      LEFT JOIN strongs_ar_translations t ON e.strongs_id = t.strongs_id
      WHERE e.strongs_id = ?
      ''',
      [strongsId],
    );

    if (res.isEmpty) return null;
    final r = res.first;

    final id = r['strongs_id'] as String;
    final isHebrew = id.startsWith('H');

    return StrongsEntry(
      strongsId: id,
      language: isHebrew ? 'hebrew' : 'greek',
      originalWord: r['original_word'] as String? ?? '',
      transliteration: id,
      definitionEn: r['definition_en'] as String? ?? '',
      kjvUsage: r['kjv_usage'] as String?,
      pronunciationAr: r['pronunciation_ar'] as String?,
      definitionAr: r['definition_ar'] as String?,
      notesAr: r['notes_ar'] as String?,
      arIsVerified: (r['is_verified'] as int? ?? 0) == 1,
    );
  }

  Future<List<WordOccurrence>> getStrongsOccurrences(String strongsId) async {
    final db = await database;
    final res = await db.rawQuery(
      '''
      SELECT m.verse_id, m.ar_word, m.ar_word_position, v.book_id, v.chapter_num, v.verse_num, v.text_avd_ar, b.name_ar as book_name_ar
      FROM word_mappings m
      JOIN verses v ON m.verse_id = v.id
      JOIN books b ON v.book_id = b.id
      WHERE m.strongs_id = ?
      LIMIT 100
      ''',
      [strongsId],
    );

    return res.map((r) {
      final pos = r['ar_word_position'] as int? ?? 0;
      return WordOccurrence(
        arWord: r['ar_word'] as String? ?? '',
        arWordPositions: [pos],
        verseId: r['verse_id'] as String,
        bookId: r['book_id'] as int,
        bookNameAr: r['book_name_ar'] as String? ?? '',
        chapterNum: r['chapter_num'] as int,
        verseNum: r['verse_num'] as int,
        textAvdAr: r['text_avd_ar'] as String? ?? '',
      );
    }).toList();
  }

  // ── Search ───────────────────────────────────────────────────
  Future<SearchResult> searchVerses(
    String q, {
    int? testamentId,
    int page = 1,
    int limit = 20,
  }) async {
    final db = await database;
    final query = q.trim();
    if (query.isEmpty) return const SearchResult(verses: [], total: 0);

    String where = 'WHERE text_avd_ar LIKE ?';
    List<dynamic> args = ['%$query%'];

    if (testamentId != null) {
      final testamentName = testamentId == 1 ? 'OT' : 'NT';
      where += ' AND book_id IN (SELECT id FROM books WHERE testament = ?)';
      args.add(testamentName);
    }

    final countRes = await db.rawQuery('SELECT COUNT(*) as cnt FROM verses $where', args);
    final total = countRes.first['cnt'] as int? ?? 0;

    final offset = (page - 1) * limit;
    final res = await db.rawQuery(
      'SELECT * FROM verses $where ORDER BY book_id ASC, chapter_num ASC, verse_num ASC LIMIT ? OFFSET ?',
      [...args, limit, offset],
    );

    final verses = res.map((r) {
      final bookIdVal = r['book_id'] as int;
      final isOt = bookIdVal <= 39;
      return Verse(
        id: r['id'] as String,
        bookId: bookIdVal,
        chapterNum: r['chapter_num'] as int,
        verseNum: r['verse_num'] as int,
        textAvdAr: r['text_avd_ar'] as String? ?? '',
        textOriginal: r['text_original'] as String? ?? '',
        textOriginalLang: r['text_original_lang'] as String? ?? (isOt ? 'hebrew' : 'greek'),
      );
    }).toList();

    return SearchResult(verses: verses, total: total);
  }
}

class SearchResult {
  final List<Verse> verses;
  final int total;
  const SearchResult({required this.verses, required this.total});
}
