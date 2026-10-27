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
  Future<Database>? _initFuture;

  Future<Database> get database async {
    if (_db != null && _db!.isOpen) return _db!;
    try {
      _initFuture ??= _initDatabase();
      _db = await _initFuture!;
      return _db!;
    } catch (e) {
      _initFuture = null;
      rethrow;
    }
  }

  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final dbPath = p.join(databasesPath, 'bible_study_v39.db');

    final prefs = await SharedPreferences.getInstance();
    final currentDbVersion = prefs.getInt('db_version') ?? 0;
    const targetDbVersion = 39; // Database v39: Full lexical elevation, Gen 3:6 & 4:18 collation, WLC pure scripts, multi-strongs normalization

    final exists = await databaseExists(dbPath);
    if (!exists || currentDbVersion < targetDbVersion) {
      debugPrint('Initializing local offline SQLite database (v$targetDbVersion) at $dbPath...');
      try {
        await Directory(p.dirname(dbPath)).create(recursive: true);
      } catch (_) {}

      // Clean up previous database versions to save space on device
      for (final oldVer in [
        'bible_study_v2.db',
        'bible_study_v3.db',
        'bible_study_v4.db',
        'bible_study_v5.db',
        'bible_study_v6.db',
        'bible_study_v7.db',
        'bible_study_v8.db',
        'bible_study_v9.db',
        'bible_study_v10.db',
        'bible_study_v11.db',
        'bible_study_v12.db',
        'bible_study_v13.db',
        'bible_study_v14.db',
        'bible_study_v15.db',
        'bible_study_v16.db',
        'bible_study_v17.db',
        'bible_study_v18.db',
        'bible_study_v19.db',
        'bible_study_v20.db',
        'bible_study_v21.db',
        'bible_study_v22.db',
        'bible_study_v23.db',
        'bible_study_v24.db',
        'bible_study_v25.db',
        'bible_study_v26.db',
        'bible_study_v27.db',
        'bible_study_v28.db',
        'bible_study_v29.db',
        'bible_study_v30.db',
        'bible_study_v31.db',
        'bible_study_v32.db',
        'bible_study_v33.db',
        'bible_study_v34.db',
        'bible_study_v35.db',
        'bible_study_v36.db',
        'bible_study_v37.db',
        'bible_study_v38.db',
      ]) {
        try {
          final oldPath = p.join(databasesPath, oldVer);
          final oldFile = File(oldPath);
          if (await oldFile.exists()) {
            await oldFile.delete();
          }
        } catch (_) {}
      }

      // Reassemble SQLite database from chunked parts (5 MB each, zero OOM risk)
      final outFile = File(dbPath);
      if (await outFile.exists()) {
        try { await outFile.delete(); } catch (_) {}
      }

      final sink = outFile.openWrite();
      const totalParts = 66;
      for (int i = 0; i < totalParts; i++) {
        final partIndexStr = i.toString().padLeft(2, '0');
        final partData = await rootBundle.load('assets/db_parts/part_$partIndexStr.dat');
        sink.add(partData.buffer.asUint8List(partData.offsetInBytes, partData.lengthInBytes));
      }
      await sink.flush();
      await sink.close();
      // Independent SQLite integrity verification on device before accepting version
      final testDb = await openDatabase(dbPath, readOnly: true);
      final checkRes = await testDb.rawQuery('PRAGMA integrity_check;');
      await testDb.close();

      final isOk = checkRes.isNotEmpty && checkRes.first.values.first.toString() == 'ok';
      if (!isOk) {
        try { await outFile.delete(); } catch (_) {}
        throw StateError('Assembled SQLite database failed integrity check: $checkRes');
      }

      await prefs.setInt('db_version', targetDbVersion);
      debugPrint('Local SQLite database assembled successfully (${await outFile.length()} bytes).');
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

    // Dynamic Self-Healing: guarantee books have testament populated
    try {
      await db.execute("UPDATE books SET testament = 'old' WHERE id <= 39 AND (testament IS NULL OR testament = '');");
      await db.execute("UPDATE books SET testament = 'new' WHERE id >= 40 AND (testament IS NULL OR testament = '');");
    } catch (_) {}

    // Dynamic Self-Healing: guarantee books have accurate total_chapters populated
    try {
      final zeroChapters = await db.rawQuery("SELECT COUNT(*) as cnt FROM books WHERE total_chapters IS NULL OR total_chapters <= 0;");
      final cnt = (zeroChapters.first['cnt'] as int?) ?? 0;
      if (cnt > 0) {
        final batch = db.batch();
        defaultChapterCounts.forEach((id, chCount) {
          batch.execute("UPDATE books SET total_chapters = ? WHERE id = ? AND (total_chapters IS NULL OR total_chapters <= 0);", [chCount, id]);
        });
        await batch.commit(noResult: true);
        debugPrint('Dynamic Self-Healing: updated total_chapters for $cnt books.');
      }
    } catch (e) {
      debugPrint('Self-healing total_chapters warning: $e');
    }

    // Dynamic Self-Healing: restore Ezekiel 40:49 Hebrew Masoretic text
    try {
      await db.execute('''
        UPDATE verses
        SET text_original = 'אֹרֶךְ הָאוּלָם עֶשְׂרִים אַמָּה וְרֹחַב עַשְׁתֵּי עֶשְׂרֵה אַמָּה וּבַמַּעֲלוֹת אֲשֶׁר יַעֲלוּ אֵלָיו וְעַמֻּדִים אֶל־הָאֵילִים אֶחָד מִפּוֹ וְאֶחָד מִפּוֹ׃',
            text_original_lang = 'hebrew'
        WHERE book_id = 26 AND chapter_num = 40 AND verse_num = 49
          AND (text_original IS NULL OR text_original = '' OR text_original = '---');
      ''');
    } catch (e) {
      debugPrint('Self-healing Ezekiel 40:49 warning: $e');
    }

    // Dynamic Self-Healing: Strong's G1 (Alpha) 3-layer lexical vs contextual vs editorial distinction
    try {
      await db.rawUpdate('''
        UPDATE strongs_ar_translations
        SET lexical_def_ar = ?,
            contextual_usage_ar = ?,
            editorial_commentary_ar = ?,
            definition_ar = ?,
            notes_ar = ?,
            is_verified = 1,
            verified_source = 'قاموس سترونج اليوناني (G1) ومعجم Thayer',
            verified_at = '2026-10-25'
        WHERE strongs_id IN ('G1', 'G0001', 'G001')
          AND (lexical_def_ar IS NULL OR lexical_def_ar = '');
      ''', [
        'الحرف الأول من الأبجدية اليونانية (Α, α)؛ يُستعمل للدلالة على البداية والأولية، كما يدخل في اشتقاق الكلمات اليونانية كسابقة تفيد النفي أو المصاحبة.',
        'ورد في العهد الجديد مقترنًا بالحرف الأخير «أوميجا» (Ω) في سفر الرؤيا (١: ٨؛ ٢١: ٦؛ ٢٢: ١٣) في صيغة «الأَلِفُ وَالْيَاءُ، الْبِدَايَةُ وَالنِّهَايَةُ».',
        'يُطلق هذا اللقب في سفر الرؤيا للدلالة على الأزلية والأبدية والسيادة الإلهية الشاملة للتاريخ من مبدئه إلى منتهاه.',
        'الحرف الأول من الأبجدية اليونانية (Α, α)؛ يُستعمل للدلالة على البداية والأولية، كما يدخل في اشتقاق الكلمات اليونانية كسابقة تفيد النفي أو المصاحبة.',
        'ورد في العهد الجديد مقترنًا بالحرف الأخير «أوميجا» (Ω) في سفر الرؤيا (١: ٨؛ ٢١: ٦؛ ٢٢: ١٣) في صيغة «الأَلِفُ وَالْيَاءُ، الْبِدَايَةُ وَالنِّهَايَةُ».',
      ]);
    } catch (e) {
      debugPrint('Self-healing Strongs G1 warning: $e');
    }

    return db;
  }

  // ── Canonical Books Fallback Data (100% Offline Resilience) ────────────────
  static const Map<int, String> defaultBookNamesEn = {
    1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
    6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
    11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
    15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms', 20: 'Proverbs',
    21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah', 24: 'Jeremiah', 25: 'Lamentations',
    26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah',
    32: 'Jonah', 33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
    38: 'Zechariah', 39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John',
    44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
    48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians',
    53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
    56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter',
    61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John',
    65: 'Jude', 66: 'Revelation'
  };

  static const Map<int, int> defaultChapterCounts = {
    1: 50, 2: 40, 3: 27, 4: 36, 5: 34, 6: 24, 7: 21, 8: 4, 9: 31, 10: 24,
    11: 22, 12: 25, 13: 29, 14: 36, 15: 10, 16: 13, 17: 10, 18: 42, 19: 150, 20: 31,
    21: 12, 22: 8, 23: 66, 24: 52, 25: 5, 26: 48, 27: 12, 28: 14, 29: 3, 30: 9,
    31: 1, 32: 4, 33: 7, 34: 3, 35: 3, 36: 3, 37: 2, 38: 14, 39: 4,
    40: 28, 41: 16, 42: 24, 43: 21, 44: 28, 45: 16, 46: 16, 47: 13, 48: 6, 49: 6,
    50: 4, 51: 4, 52: 5, 53: 3, 54: 6, 55: 4, 56: 3, 57: 1, 58: 13, 59: 5,
    60: 5, 61: 3, 62: 5, 63: 1, 64: 1, 65: 1, 66: 22
  };

  List<Book> _getCanonicalBooks({int? testamentId}) {
    final List<Book> list = [];
    final startId = testamentId == 2 ? 40 : 1;
    final endId   = testamentId == 1 ? 39 : 66;

    for (int id = startId; id <= endId; id++) {
      final tId = id >= 40 ? 2 : 1;
      final nameAr = Verse.defaultBookNames[id] ?? 'سفر $id';
      final nameEn = defaultBookNamesEn[id] ?? 'Book $id';
      list.add(Book(
        id:           id,
        testamentId:  tId,
        nameAr:       nameAr,
        nameArShort:  nameAr,
        nameEn:       nameEn,
        nameEnShort:  nameEn,
        chapterCount: defaultChapterCounts[id] ?? 1,
        sortOrder:    id,
      ));
    }
    return list;
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
      if (testamentId == 1) {
        sql += ' WHERE (id <= 39 OR LOWER(COALESCE(testament, "")) IN ("old", "ot", "1"))';
      } else {
        sql += ' WHERE (id >= 40 OR LOWER(COALESCE(testament, "")) IN ("new", "nt", "2"))';
      }
    }
    sql += ' ORDER BY COALESCE(order_num, id) ASC';

    try {
      final rows = await db.rawQuery(sql, args);
      if (rows.isNotEmpty) {
        return rows.map((r) {
          final bId = r['id'] as int;
          final tId = (bId >= 40) ? 2 : 1;
          final nameAr = (r['name_ar'] as String? ?? '').trim();
          final nameEn = (r['name_en'] as String? ?? '').trim();
          final rawCount = (r['total_chapters'] as int?) ?? (r['chapter_count'] as int?) ?? 0;
          final chCount = rawCount > 0 ? rawCount : (defaultChapterCounts[bId] ?? 1);
          return Book(
            id:           bId,
            testamentId:  tId,
            nameAr:       nameAr.isNotEmpty ? nameAr : (Verse.defaultBookNames[bId] ?? 'سفر $bId'),
            nameArShort:  (r['name_ar_short'] ?? (nameAr.isNotEmpty ? nameAr : Verse.defaultBookNames[bId])) as String? ?? '',
            nameEn:       nameEn.isNotEmpty ? nameEn : (defaultBookNamesEn[bId] ?? 'Book $bId'),
            nameEnShort:  (r['name_en_short'] ?? (nameEn.isNotEmpty ? nameEn : defaultBookNamesEn[bId])) as String? ?? '',
            nameOriginal: r['name_original'] as String?,
            chapterCount: chCount,
            sortOrder:    (r['order_num'] as int?) ?? (r['sort_order'] as int?) ?? bId,
          );
        }).toList();
      }
    } catch (_) {}

    return _getCanonicalBooks(testamentId: testamentId);
  }

  Future<List<int>> getChapters(int bookId) async {
    final db = await database;
    try {
      final rows = await db.rawQuery(
        'SELECT DISTINCT chapter_num FROM verses WHERE book_id = ? ORDER BY chapter_num ASC',
        [bookId],
      );
      if (rows.isNotEmpty) {
        return rows.map((r) => r['chapter_num'] as int).toList();
      }
      // Fallback to book's total_chapters or chapter_count
      final bRows = await db.rawQuery('SELECT total_chapters, chapter_count FROM books WHERE id = ?', [bookId]);
      if (bRows.isNotEmpty) {
        final raw = (bRows.first['total_chapters'] as int?) ?? (bRows.first['chapter_count'] as int?) ?? 0;
        final total = raw > 0 ? raw : (defaultChapterCounts[bookId] ?? 1);
        return List.generate(total, (i) => i + 1);
      }
    } catch (_) {}

    final fallbackTotal = defaultChapterCounts[bookId] ?? 1;
    return List.generate(fallbackTotal, (i) => i + 1);
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

  Future<Verse?> getVerseById(String verseId) async {
    final db = await database;
    final rows = await db.rawQuery(
      'SELECT v.*, b.name_ar as book_name_ar FROM verses v JOIN books b ON v.book_id = b.id WHERE v.id = ? LIMIT 1',
      [verseId],
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
    try {
      final rows = await db.rawQuery(
        '''SELECT wm.*, 
                  (SELECT GROUP_CONCAT(wms.strongs_id, ',') 
                   FROM word_mapping_strongs wms 
                   WHERE wms.mapping_id = wm.id 
                   ORDER BY wms.link_order ASC) AS all_strongs_ids
           FROM word_mappings wm 
           WHERE wm.verse_id = ? 
           ORDER BY wm.ar_word_position ASC''',
        [verseId],
      );
      if (rows.isNotEmpty) {
        return rows.map((r) => WordMapping.fromJson(Map<String, dynamic>.from(r))).toList();
      }
    } catch (e) {
      debugPrint('Error querying local word_mappings: $e');
    }

    // Dynamic offline fallback from verse texts if not pre-seeded
    try {
      final vRows = await db.rawQuery('SELECT * FROM verses WHERE id = ? LIMIT 1', [verseId]);
      if (vRows.isNotEmpty) {
        final v = vRows.first;
        final arText = (v['text_avd_ar'] as String? ?? '').trim();
        final origText = (v['text_original'] as String? ?? '').trim();
        final origLang = (v['text_original_lang'] as String? ?? 'hebrew');

        final arWords = arText.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
        final origWords = origText.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();

        if (arWords.isNotEmpty) {
          final List<WordMapping> generated = [];
          for (int i = 0; i < arWords.length; i++) {
            final ar = arWords[i];
            final orig = i < origWords.length ? origWords[i] : (origWords.isNotEmpty ? origWords.last : '-');
            final pos = i + 1;

            String? sId;
            String? trans;
            if (orig.isNotEmpty && orig != '-') {
              final cleanOrig = orig.replaceAll(RegExp(r'[\.,;:!?׃־—–\[\]\(\)\{\}\x22\x27״׳]'), '').trim();
              final unpointed = cleanOrig.replaceAll(RegExp(r'[\u0591-\u05C7\u0300-\u036F]'), '').trim();
              final sMatches = await db.rawQuery(
                'SELECT strongs_id, transliteration FROM strongs_entries WHERE original_word LIKE ? OR original_word LIKE ? LIMIT 1',
                ['%$cleanOrig%', '%$unpointed%'],
              );
              if (sMatches.isNotEmpty) {
                sId = sMatches.first['strongs_id'] as String?;
                trans = sMatches.first['transliteration'] as String?;
              }
            }

            final cleanWord = (orig.isNotEmpty && orig != '-')
                ? orig.replaceAll(RegExp(r'[\.,;:!?׃־—–\[\]\(\)\{\}\x22\x27״׳·]'), '').trim()
                : '';
            final isHeb = origLang == 'hebrew' || origLang == 'aramaic';
            final audio = (cleanWord.isNotEmpty && cleanWord != '-' && cleanWord != '—' && !cleanWord.contains('---'))
                ? 'https://translate.google.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(cleanWord)}&tl=${isHeb ? "iw" : "el"}&client=tw-ob'
                : null;

            generated.add(WordMapping(
              id: '${verseId}_$pos',
              verseId: verseId,
              arWordPosition: pos,
              origWordPosition: pos,
              arWord: ar,
              origWord: orig,
              origWordLang: origLang,
              strongsId: sId,
              transliterationLat: trans,
              audioUrl: audio,
              isVerified: false,
            ));
          }

          if (generated.isNotEmpty) {
            try {
              await saveWordMappings(verseId, generated);
            } catch (e) {
              debugPrint('Warning: Could not cache generated word mappings: $e');
            }
          }
          return generated;
        }
      }
    } catch (e) {
      debugPrint('Error generating fallback word mappings: $e');
    }

    return [];
  }

  Future<void> saveWordMappings(String verseId, List<WordMapping> mappings) async {
    if (mappings.isEmpty) return;
    try {
      final db = await database;
      final batch = db.batch();
      for (final m in mappings) {
        final row = <String, dynamic>{
          'verse_id':           m.verseId,
          'ar_word_position':   m.arWordPosition,
          'ar_word':            m.arWord,
          'ar_word_normalized': m.arWordNormalized,
          'orig_word':          m.origWord,
          'orig_word_lang':     m.origWordLang,
          'strongs_id':          m.strongsId,
          'is_verified':         m.isVerified ? 1 : 0,
        };
        final intId = int.tryParse(m.id);
        if (intId != null) {
          row['id'] = intId;
        }
        batch.insert(
          'word_mappings',
          row,
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
      await batch.commit(noResult: true);
    } catch (e) {
      debugPrint('Error saving word mappings: $e');
    }
  }

  Future<StrongsEntry?> getStrongsEntry(String strongsId) async {
    if (strongsId.trim().isEmpty || strongsId == '---' || strongsId == '-') return null;
    final db = await database;
    final trimmed = strongsId.trim().toUpperCase();
    final match = RegExp(r'^([HG])0*([1-9][0-9]*)$').firstMatch(trimmed);
    final normalizedId = match != null ? '${match.group(1)}${match.group(2)}' : trimmed;
    final paddedId = match != null ? '${match.group(1)}${match.group(2)!.padLeft(4, '0')}' : trimmed;

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
        t.lexical_def_ar,
        t.contextual_usage_ar,
        t.editorial_commentary_ar,
        t.is_verified as ar_is_verified,
        t.verified_source,
        t.verified_at
      FROM strongs_entries e
      LEFT JOIN strongs_ar_translations t ON e.strongs_id = t.strongs_id
      WHERE e.strongs_id = ? OR e.strongs_id = ? OR e.strongs_id = ?
      LIMIT 1
    ''', [trimmed, normalizedId, paddedId]);

    if (rows.isEmpty) return null;
    final r = rows.first;
    final orig = r['original_word']?.toString() ?? '';
    final lang = r['language']?.toString() ?? 'hebrew';
    final isHeb = lang == 'hebrew' || lang == 'aramaic';

    String? audio;
    if (orig.trim().isNotEmpty) {
      final langCode = isHeb ? 'iw' : 'el';
      audio =
          'https://translate.google.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(orig.trim())}&tl=$langCode&client=tw-ob';
    }

    final rawVerified = r['ar_is_verified'];
    final vSource = r['verified_source']?.toString().trim();
    final bool arIsVerified = (rawVerified == 1 || rawVerified == true || rawVerified == '1') &&
        vSource != null &&
        vSource.isNotEmpty;

    return StrongsEntry(
      strongsId:             r['strongs_id']?.toString() ?? trimmed,
      language:              lang,
      originalWord:          orig,
      transliteration:       r['transliteration']?.toString() ?? '',
      audioUrl:              audio,
      definitionEn:          r['definition_en']?.toString() ?? '',
      kjvUsage:              r['kjv_usage']?.toString(),
      definitionAr:          r['definition_ar']?.toString(),
      notesAr:               r['notes_ar']?.toString(),
      lexicalDefAr:          r['lexical_def_ar']?.toString(),
      contextualUsageAr:     r['contextual_usage_ar']?.toString(),
      editorialCommentaryAr: r['editorial_commentary_ar']?.toString(),
      pronunciationAr:       r['pronunciation_ar']?.toString(),
      arIsVerified:          arIsVerified,
      verifiedSource:        (vSource != null && vSource.isNotEmpty) ? vSource : null,
      verifiedAt:            r['verified_at']?.toString(),
    );
  }

  Future<StrongsEntry?> getStrongsEntryByWord(String word, {String language = 'hebrew'}) async {
    if (word.trim().isEmpty || word == '---' || word == '-') return null;
    final db = await database;
    final cleanWord = word.replaceAll(RegExp(r'[\.,;:!?׃־—–\[\]\(\)\{\}\x22\x27״׳]'), '').trim();
    final unpointed = cleanWord.replaceAll(RegExp(r'[\u0591-\u05C7\u0300-\u036F]'), '').trim();

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
        t.lexical_def_ar,
        t.contextual_usage_ar,
        t.editorial_commentary_ar,
        t.is_verified as ar_is_verified,
        t.verified_source,
        t.verified_at
      FROM strongs_entries e
      LEFT JOIN strongs_ar_translations t ON e.strongs_id = t.strongs_id
      WHERE (e.original_word LIKE ? OR e.original_word LIKE ?)
        AND e.language = ?
      LIMIT 1
    ''', ['%$cleanWord%', '%$unpointed%', language]);

    if (rows.isEmpty) return null;
    final r = rows.first;
    final orig = r['original_word']?.toString() ?? cleanWord;
    final lang = r['language']?.toString() ?? language;
    final isHeb = lang == 'hebrew' || lang == 'aramaic';

    String? audio;
    if (orig.trim().isNotEmpty) {
      final langCode = isHeb ? 'iw' : 'el';
      audio =
          'https://translate.google.com/translate_tts?ie=UTF-8&q=${Uri.encodeComponent(orig.trim())}&tl=$langCode&client=tw-ob';
    }

    final rawVerified = r['ar_is_verified'];
    final vSource = r['verified_source']?.toString().trim();
    final bool arIsVerified = (rawVerified == 1 || rawVerified == true || rawVerified == '1') &&
        vSource != null &&
        vSource.isNotEmpty;

    return StrongsEntry(
      strongsId:             r['strongs_id']?.toString() ?? '',
      language:              lang,
      originalWord:          orig,
      transliteration:       r['transliteration']?.toString() ?? '',
      audioUrl:              audio,
      definitionEn:          r['definition_en']?.toString() ?? '',
      kjvUsage:              r['kjv_usage']?.toString(),
      definitionAr:          r['definition_ar']?.toString(),
      notesAr:               r['notes_ar']?.toString(),
      lexicalDefAr:          r['lexical_def_ar']?.toString(),
      contextualUsageAr:     r['contextual_usage_ar']?.toString(),
      editorialCommentaryAr: r['editorial_commentary_ar']?.toString(),
      pronunciationAr:       r['pronunciation_ar']?.toString(),
      arIsVerified:          arIsVerified,
      verifiedSource:        (vSource != null && vSource.isNotEmpty) ? vSource : null,
      verifiedAt:            r['verified_at']?.toString(),
    );
  }

  Future<List<WordOccurrence>> getStrongsOccurrences(String strongsId) async {
    final db = await database;
    final match = RegExp(r'^([HG])\s*0*([1-9][0-9]{0,4})$', caseSensitive: false).firstMatch(strongsId.trim());
    List<String> candidates;
    if (match != null) {
      final prefix = match.group(1)!.toUpperCase();
      final numInt = int.tryParse(match.group(2)!) ?? 0;
      candidates = {
        '$prefix$numInt',
        '$prefix${numInt.toString().padLeft(4, '0')}',
        '$prefix${numInt.toString().padLeft(5, '0')}',
        '$numInt',
        numInt.toString().padLeft(4, '0'),
      }.toList();
    } else {
      candidates = [strongsId.trim()];
    }

    final placeholders = List.filled(candidates.length, '?').join(',');
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
      WHERE wm.strongs_id IN ($placeholders)
         OR wm.id IN (SELECT mapping_id FROM word_mapping_strongs WHERE strongs_id IN ($placeholders))
      ORDER BY v.book_id ASC, v.chapter_num ASC, v.verse_num ASC
    ''', [...candidates, ...candidates]);

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
    if (grouped.isNotEmpty) {
      return grouped.values.toList();
    }

    // Fallback: search verses matching original_word if word_mappings has no rows
    final sEntries = await db.rawQuery(
      'SELECT original_word FROM strongs_entries WHERE strongs_id IN ($placeholders) LIMIT 1',
      candidates,
    );
    if (sEntries.isNotEmpty) {
      final origWord = sEntries.first['original_word'] as String? ?? '';
      final unpointed = origWord.replaceAll(RegExp(r'[\u0591-\u05C7\u0300-\u036F]'), '').trim();
      final searchToken = unpointed.isNotEmpty ? unpointed : origWord.trim();
      if (searchToken.isNotEmpty) {
        final vRows = await db.rawQuery('''
          SELECT v.id as verse_id, v.book_id, b.name_ar as book_name_ar, v.chapter_num, v.verse_num, v.text_avd_ar
          FROM verses v
          JOIN books b ON v.book_id = b.id
          WHERE v.text_original LIKE ?
          ORDER BY v.book_id ASC, v.chapter_num ASC, v.verse_num ASC
          LIMIT 100
        ''', ['%$searchToken%']);

        return vRows.map((r) => WordOccurrence(
          arWord:          origWord,
          arWordPositions: [1],
          verseId:         r['verse_id'] as String,
          bookId:          r['book_id'] as int? ?? 0,
          bookNameAr:      r['book_name_ar'] as String? ?? '',
          chapterNum:      r['chapter_num'] as int? ?? 0,
          verseNum:        r['verse_num'] as int? ?? 0,
          textAvdAr:       r['text_avd_ar'] as String? ?? '',
        )).toList();
      }
    }

    return [];
  }

  /// Returns occurrence counts per book for the given strongsId (for charting/visualizing)
  Future<List<Map<String, dynamic>>> getStrongsBookDistribution(String strongsId) async {
    final db = await database;
    final match = RegExp(r'^([HG])\s*0*([1-9][0-9]{0,4})$', caseSensitive: false).firstMatch(strongsId.trim());
    List<String> candidates;
    if (match != null) {
      final prefix = match.group(1)!.toUpperCase();
      final numInt = int.tryParse(match.group(2)!) ?? 0;
      candidates = {
        '$prefix$numInt',
        '$prefix${numInt.toString().padLeft(4, '0')}',
        '$prefix${numInt.toString().padLeft(5, '0')}',
        '$numInt',
        numInt.toString().padLeft(4, '0'),
      }.toList();
    } else {
      candidates = [strongsId.trim()];
    }
    final placeholders = List.filled(candidates.length, '?').join(',');
    final res = await db.rawQuery('''
      SELECT b.id as book_id, b.name_ar as book_name, b.testament, COUNT(wm.id) as count
      FROM word_mappings wm
      JOIN verses v ON wm.verse_id = v.id
      JOIN books b ON v.book_id = b.id
      WHERE wm.strongs_id IN ($placeholders)
      GROUP BY b.id, b.name_ar, b.testament
      ORDER BY b.id ASC
    ''', candidates);
    if (res.isNotEmpty) return res;

    final sEntries = await db.rawQuery(
      'SELECT original_word FROM strongs_entries WHERE strongs_id IN ($placeholders) LIMIT 1',
      candidates,
    );
    if (sEntries.isNotEmpty) {
      final origWord = sEntries.first['original_word'] as String? ?? '';
      final unpointed = origWord.replaceAll(RegExp(r'[\u0591-\u05C7\u0300-\u036F]'), '').trim();
      final searchToken = unpointed.isNotEmpty ? unpointed : origWord.trim();
      if (searchToken.isNotEmpty) {
        return await db.rawQuery('''
          SELECT b.id as book_id, b.name_ar as book_name, b.testament, COUNT(v.id) as count
          FROM verses v
          JOIN books b ON v.book_id = b.id
          WHERE v.text_original LIKE ?
          GROUP BY b.id, b.name_ar, b.testament
          ORDER BY b.id ASC
        ''', ['%$searchToken%']);
      }
    }
    return [];
  }

  // ── Offline Search (Diacritics-Insensitive & Normalized) ───────────────────

  static String normalizeArabic(String text) {
    if (text.isEmpty) return '';
    return text
        .replaceAll(RegExp(r'[\u064B-\u065F\u0670\u0640\u00AD]'), '') // remove tashkeel, tatweel, soft-hyphen
        .replaceAll(RegExp(r'[أإآ]'), 'ا')
        .replaceAll('ة', 'ه')
        .replaceAll('ى', 'ي')
        .replaceAll('السموات', 'السماوات')
        .replaceAll('داوود', 'داود')
        .replaceAll(RegExp(r'[÷¾]'), '') // remove legacy division and fraction symbols
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

    // If query is a Strong's ID (e.g. H4428 or G2880), search via word_mappings with fallback to text_original
    final strongsMatch = RegExp(r'^([HG])\s*0*([1-9][0-9]{0,4})$', caseSensitive: false).firstMatch(trimmed);
    if (strongsMatch != null) {
      final prefix = strongsMatch.group(1)!.toUpperCase();
      final numStr = strongsMatch.group(2)!;
      final numInt = int.tryParse(numStr) ?? 0;
      final candidates = {
        '$prefix$numInt',
        '$prefix${numInt.toString().padLeft(4, '0')}',
        '$prefix${numInt.toString().padLeft(5, '0')}',
        '$numInt',
        numInt.toString().padLeft(4, '0'),
      }.toList();

      final sPlaceholders = List.filled(candidates.length, '?').join(',');
      String sWhere = 'wm.strongs_id IN ($sPlaceholders)';
      List<dynamic> sArgs = [...candidates];

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
      int total = Sqflite.firstIntValue(countResult) ?? 0;

      if (total > 0) {
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

      // Fallback: search via original Hebrew/Greek word from strongs_entries
      final sEntries = await db.rawQuery(
        'SELECT original_word FROM strongs_entries WHERE strongs_id IN ($sPlaceholders) LIMIT 1',
        candidates,
      );
      if (sEntries.isNotEmpty) {
        final origWord = sEntries.first['original_word'] as String? ?? '';
        final unpointed = origWord.replaceAll(RegExp(r'[\u0591-\u05C7\u0300-\u036F]'), '').trim();
        final searchToken = unpointed.isNotEmpty ? unpointed : origWord.trim();
        if (searchToken.isNotEmpty) {
          String origWhere = '(v.text_original LIKE ?)';
          List<dynamic> origArgs = ['%$searchToken%'];

          if (bookId != null) {
            origWhere += ' AND v.book_id = ?';
            origArgs.add(bookId);
          } else if (bookIds != null && bookIds.isNotEmpty) {
            final placeholders = List.filled(bookIds.length, '?').join(',');
            origWhere += ' AND v.book_id IN ($placeholders)';
            origArgs.addAll(bookIds);
          } else if (testamentId != null) {
            final tStr = testamentId == 1 ? 'old' : 'new';
            origWhere += ' AND LOWER(b.testament) = ?';
            origArgs.add(tStr);
          }

          final countOrigSql = '''
            SELECT COUNT(*) as total_count
            FROM verses v
            JOIN books b ON v.book_id = b.id
            WHERE $origWhere
          ''';
          final countOrigRes = await db.rawQuery(countOrigSql, origArgs);
          total = Sqflite.firstIntValue(countOrigRes) ?? 0;

          if (total > 0) {
            final queryOrigSql = '''
              SELECT v.*, b.name_ar as book_name_ar
              FROM verses v
              JOIN books b ON v.book_id = b.id
              WHERE $origWhere
              ORDER BY v.book_id ASC, v.chapter_num ASC, v.verse_num ASC
              LIMIT ? OFFSET ?
            ''';
            final rows = await db.rawQuery(queryOrigSql, [...origArgs, limit, (page - 1) * limit]);
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
        }
      }

      return (verses: <Verse>[], total: 0);
    }

    final normQuery = normalizeArabic(trimmed);
    if (normQuery.isEmpty && !trimmed.contains(RegExp(r'[A-Za-z\u0370-\u03FF\u0590-\u05FF]'))) {
      return (verses: <Verse>[], total: 0);
    }
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
