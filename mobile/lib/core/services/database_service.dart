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
import '../../models/word_occurrence.dart';

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
    final dbPath = p.join(databasesPath, 'bible_study_v7.db');

    final prefs = await SharedPreferences.getInstance();
    final currentDbVersion = prefs.getInt('db_version') ?? 0;
    const targetDbVersion = 7; // Incremented for full cross-references integration

    final exists = await databaseExists(dbPath);
    if (!exists || currentDbVersion < targetDbVersion) {
      debugPrint('Initializing local offline SQLite database (v$targetDbVersion) at $dbPath...');
      try {
        await Directory(p.dirname(dbPath)).create(recursive: true);
      } catch (_) {}

      // Clean up previous database versions to save space on device
      for (final oldVer in ['bible_study_v2.db', 'bible_study_v3.db', 'bible_study_v4.db', 'bible_study_v5.db', 'bible_study_v6.db']) {
        try {
          final oldPath = p.join(databasesPath, oldVer);
          final oldFile = File(oldPath);
          if (await oldFile.exists()) {
            await oldFile.delete();
          }
        } catch (_) {}
      }

      // Copy fresh asset
      final data = await rootBundle.load('assets/bible_study.db');
      final bytes = data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
      await File(dbPath).writeAsBytes(bytes, flush: true);
      await prefs.setInt('db_version', targetDbVersion);
      debugPrint('Local SQLite database copied successfully (${bytes.length} bytes).');
    }

    final db = await openDatabase(dbPath);

    // Dynamic Self-Healing: guarantee text_clean exists and is populated
    try {
      final cols = await db.rawQuery("PRAGMA table_info(verses)");
      final hasTextClean = cols.any((c) => c['name'] == 'text_clean');
      if (!hasTextClean) {
        debugPrint('Dynamic Self-Healing: text_clean missing in verses table, generating...');
        await db.execute('ALTER TABLE verses ADD COLUMN text_clean TEXT;');
        final rows = await db.rawQuery('SELECT id, text_avd_ar FROM verses');
        final batch = db.batch();
        for (final r in rows) {
          final clean = normalizeArabic(r['text_avd_ar'] as String? ?? '');
          batch.update('verses', {'text_clean': clean}, where: 'id = ?', whereArgs: [r['id']]);
        }
        await batch.commit(noResult: true);
        await db.execute('CREATE INDEX IF NOT EXISTS idx_verses_text_clean ON verses(text_clean);');
        debugPrint('Dynamic Self-Healing complete: text_clean populated and indexed.');
      }
    } catch (e) {
      debugPrint('Schema verification warning: $e');
    }

    return db;
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
      textAlab:         r['text_alab'] as String?,
      textErv:          r['text_erv'] as String?,
      textKjv:          r['text_kjv'] as String?,
      textNiv:          r['text_niv'] as String?,
    )).toList();
  }

  Future<Verse?> getVerse(int bookId, int chapterNum, int verseNum) async {
    final db = await database;
    final rows = await db.rawQuery(
      'SELECT v.*, b.name_ar as book_name_ar FROM verses v JOIN books b ON v.book_id = b.id WHERE v.book_id = ? AND v.chapter_num = ? AND v.verse_num = ? LIMIT 1',
      [bookId, chapterNum, verseNum],
    );
    if (rows.isEmpty) return null;
    final r = rows.first;
    return Verse(
      id:               r['id'] as String,
      bookId:           r['book_id'] as int,
      chapterNum:       r['chapter_num'] as int,
      verseNum:         r['verse_num'] as int,
      textAvdAr:        r['text_avd_ar'] as String? ?? '',
      textOriginal:     r['text_original'] as String? ?? '',
      textOriginalLang: r['text_original_lang'] as String? ?? 'hebrew',
      bookNameAr:       r['book_name_ar'] as String?,
      textAlab:         r['text_alab'] as String?,
      textErv:          r['text_erv'] as String?,
      textKjv:          r['text_kjv'] as String?,
      textNiv:          r['text_niv'] as String?,
    );
  }

  Future<List<Map<String, dynamic>>> getCrossReferences(int bookId, int chapterNum, int verseNum) async {
    final db = await database;
    return await db.rawQuery('''
      SELECT cr.id, cr.target_book_id, b.name_ar as target_book_name,
             cr.target_chapter_num, cr.target_verse_num,
             COALESCE(v.text_avd_ar, '') as target_text
      FROM cross_references cr
      JOIN books b ON cr.target_book_id = b.id
      LEFT JOIN verses v ON v.book_id = cr.target_book_id 
                         AND v.chapter_num = cr.target_chapter_num 
                         AND v.verse_num = cr.target_verse_num
      WHERE cr.book_id = ? AND cr.chapter_num = ? AND cr.verse_num = ?
      ORDER BY cr.id ASC
    ''', [bookId, chapterNum, verseNum]);
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
    final orig = r['original_word'] as String? ?? '';
    final lang = r['language'] as String? ?? 'hebrew';
    final isHeb = lang == 'hebrew' || lang == 'aramaic';

    String? audio;
    if (orig.trim().isNotEmpty) {
      final langCode = isHeb ? 'iw' : 'el';
      final ttsUrl =
          'https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(orig.trim())}&tl=$langCode&client=gtx';
      audio = 'https://arabic-bible-study.vercel.app/api/v1/audio?url=' +
          Uri.encodeComponent(ttsUrl);
    }

    return StrongsEntry(
      strongsId:       r['strongs_id'] as String,
      language:        lang,
      originalWord:    orig,
      transliteration: r['transliteration'] as String? ?? '',
      audioUrl:        audio,
      definitionEn:    r['definition_en'] as String? ?? '',
      kjvUsage:        r['kjv_usage'] as String?,
      definitionAr:    r['definition_ar'] as String?,
      notesAr:         r['notes_ar'] as String?,
      pronunciationAr: r['pronunciation_ar'] as String?,
      arIsVerified:    (r['ar_is_verified'] == 1 || r['ar_is_verified'] == true),
    );
  }

  Future<List<WordOccurrence>> getStrongsOccurrences(String strongsId) async {
    final db = await database;
    final rows = await db.rawQuery('''
      SELECT 
        wm.ar_word,
        wm.ar_word_position,
        v.id as verse_id,
        v.book_id,
        b.name_ar as book_name_ar,
        v.chapter_num,
        v.verse_num,
        v.text_avd_ar
      FROM word_mappings wm
      JOIN verses v ON wm.verse_id = v.id
      JOIN books b ON v.book_id = b.id
      WHERE wm.strongs_id = ?
      ORDER BY v.book_id ASC, v.chapter_num ASC, v.verse_num ASC
    ''', [strongsId]);

    // Group by verse_id if a word appears multiple times in the same verse
    final Map<String, WordOccurrence> grouped = {};
    for (final r in rows) {
      final vId = r['verse_id'] as String;
      final pos = (r['ar_word_position'] as int?) ?? 0;
      if (grouped.containsKey(vId)) {
        grouped[vId]!.arWordPositions.add(pos);
      } else {
        grouped[vId] = WordOccurrence(
          arWord:          r['ar_word'] as String? ?? '',
          arWordPositions: [pos],
          verseId:         vId,
          bookId:          r['book_id'] as int? ?? 0,
          bookNameAr:      r['book_name_ar'] as String? ?? '',
          chapterNum:      r['chapter_num'] as int? ?? 0,
          verseNum:        r['verse_num'] as int? ?? 0,
          textAvdAr:       r['text_avd_ar'] as String? ?? '',
        );
      }
    }
    return grouped.values.toList();
  }

  /// Returns occurrence counts per book for the given strongsId (for charting/visualizing)
  Future<List<Map<String, dynamic>>> getStrongsBookDistribution(String strongsId) async {
    final db = await database;
    return await db.rawQuery('''
      SELECT b.id as book_id, b.name_ar as book_name, b.testament, COUNT(wm.id) as count
      FROM word_mappings wm
      JOIN verses v ON wm.verse_id = v.id
      JOIN books b ON v.book_id = b.id
      WHERE wm.strongs_id = ?
      GROUP BY b.id, b.name_ar, b.testament
      ORDER BY b.id ASC
    ''', [strongsId]);
  }

  // ── Offline Search (Diacritics-Insensitive & Normalized) ───────────────────

  static String normalizeArabic(String text) {
    if (text.isEmpty) return '';
    return text
        .replaceAll(RegExp(r'[\u064B-\u065F\u0670\u0640]'), '') // remove tashkeel & tatweel
        .replaceAll(RegExp(r'[أإآ]'), 'ا')
        .replaceAll('ة', 'ه')
        .replaceAll('ى', 'ي')
        .replaceAll('السموات', 'السماوات')
        .replaceAll('داوود', 'داود')
        .trim();
  }

  Future<({List<Verse> verses, int total})> searchVersesWithCount(
    String query, {
    int? testamentId,
    int? bookId,
    List<int>? bookIds,
    int page = 1,
    int limit = 20,
  }) async {
    final db = await database;
    final trimmed = query.trim();
    if (trimmed.isEmpty) return (verses: <Verse>[], total: 0);

    // If query is a Strong's ID (e.g. H4428 or G2880), search via word_mappings
    final strongsMatch = RegExp(r'^([HG])\s*0*([1-9][0-9]{0,4})$', caseSensitive: false).firstMatch(trimmed);
    if (strongsMatch != null) {
      final sId = '${strongsMatch.group(1)!.toUpperCase()}${strongsMatch.group(2)}';
      String sWhere = 'wm.strongs_id = ?';
      List<dynamic> sArgs = [sId];

      if (bookId != null) {
        sWhere += ' AND v.book_id = ?';
        sArgs.add(bookId);
      } else if (bookIds != null && bookIds.isNotEmpty) {
        final placeholders = List.filled(bookIds.length, '?').join(',');
        sWhere += ' AND v.book_id IN ($placeholders)';
        sArgs.addAll(bookIds);
      } else if (testamentId != null) {
        final tStr = testamentId == 1 ? 'old' : 'new';
        sWhere += ' AND LOWER(b.testament) = ?';
        sArgs.add(tStr);
      }

      final countSql = '''
        SELECT COUNT(DISTINCT v.id) as total_count
        FROM verses v
        JOIN books b ON v.book_id = b.id
        JOIN word_mappings wm ON v.id = wm.verse_id
        WHERE $sWhere
      ''';
      final countResult = await db.rawQuery(countSql, sArgs);
      final total = Sqflite.firstIntValue(countResult) ?? 0;

      if (total == 0) return (verses: <Verse>[], total: 0);

      final querySql = '''
        SELECT v.*, b.name_ar as book_name_ar, GROUP_CONCAT(wm.ar_word, ',') as mapped_words
        FROM verses v
        JOIN books b ON v.book_id = b.id
        JOIN word_mappings wm ON v.id = wm.verse_id
        WHERE $sWhere
        GROUP BY v.id
        ORDER BY v.book_id ASC, v.chapter_num ASC, v.verse_num ASC
        LIMIT ? OFFSET ?
      ''';
      final queryArgs = [...sArgs, limit, (page - 1) * limit];
      final rows = await db.rawQuery(querySql, queryArgs);

      final verses = rows.map((r) {
        final rawWords = r['mapped_words'] as String?;
        final wordsList = rawWords != null
            ? rawWords.split(',').map((w) => w.trim()).where((w) => w.isNotEmpty).toSet().toList()
            : null;
        return Verse(
          id:               r['id'] as String,
          bookId:           r['book_id'] as int,
          chapterNum:       r['chapter_num'] as int,
          verseNum:         r['verse_num'] as int,
          textAvdAr:        r['text_avd_ar'] as String? ?? '',
          textOriginal:     r['text_original'] as String? ?? '',
          textOriginalLang: r['text_original_lang'] as String? ?? 'hebrew',
          bookNameAr:       r['book_name_ar'] as String?,
          highlightWords:   wordsList,
        );
      }).toList();

      return (verses: verses, total: total);
    }

    final normQuery = normalizeArabic(trimmed);
    final words = normQuery.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();

    String whereConditions;
    List<dynamic> whereArgs = [];

    if (words.length <= 1) {
      whereConditions = '(v.text_clean LIKE ? OR v.text_original LIKE ?)';
      whereArgs = ['%$normQuery%', '%$trimmed%'];
    } else {
      final phrase = '%$normQuery%';
      final wordsConditions = words.map((_) => 'v.text_clean LIKE ?').join(' AND ');
      whereConditions = '(v.text_clean LIKE ? OR ($wordsConditions) OR v.text_original LIKE ?)';
      whereArgs = [phrase, ...words.map((w) => '%$w%'), '%$trimmed%'];
    }

    if (bookId != null) {
      whereConditions += ' AND v.book_id = ?';
      whereArgs.add(bookId);
    } else if (bookIds != null && bookIds.isNotEmpty) {
      final placeholders = List.filled(bookIds.length, '?').join(',');
      whereConditions += ' AND v.book_id IN ($placeholders)';
      whereArgs.addAll(bookIds);
    } else if (testamentId != null) {
      final tStr = testamentId == 1 ? 'old' : 'new';
      whereConditions += ' AND LOWER(b.testament) = ?';
      whereArgs.add(tStr);
    }

    // 1. Get total matching count
    final countSql = '''
      SELECT COUNT(*) as total_count 
      FROM verses v 
      JOIN books b ON v.book_id = b.id 
      WHERE $whereConditions
    ''';
    final countResult = await db.rawQuery(countSql, whereArgs);
    final total = Sqflite.firstIntValue(countResult) ?? 0;

    if (total == 0) return (verses: <Verse>[], total: 0);

    // 2. Fetch paginated rows
    final querySql = '''
      SELECT v.*, b.name_ar as book_name_ar 
      FROM verses v 
      JOIN books b ON v.book_id = b.id 
      WHERE $whereConditions
      ORDER BY v.book_id ASC, v.chapter_num ASC, v.verse_num ASC 
      LIMIT ? OFFSET ?
    ''';
    final queryArgs = [...whereArgs, limit, (page - 1) * limit];
    final rows = await db.rawQuery(querySql, queryArgs);

    final verses = rows.map((r) => Verse(
      id:               r['id'] as String,
      bookId:           r['book_id'] as int,
      chapterNum:       r['chapter_num'] as int,
      verseNum:         r['verse_num'] as int,
      textAvdAr:        r['text_avd_ar'] as String? ?? '',
      textOriginal:     r['text_original'] as String? ?? '',
      textOriginalLang: r['text_original_lang'] as String? ?? 'hebrew',
      bookNameAr:       r['book_name_ar'] as String?,
    )).toList();

    return (verses: verses, total: total);
  }

  Future<List<Verse>> searchVerses(String query, {int? testamentId, int? bookId, List<int>? bookIds, int page = 1, int limit = 20}) async {
    final res = await searchVersesWithCount(query, testamentId: testamentId, bookId: bookId, bookIds: bookIds, page: page, limit: limit);
    return res.verses;
  }
}
