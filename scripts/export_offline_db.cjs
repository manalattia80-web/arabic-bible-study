const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

const DB_PATH = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');
const SQLITE_BIN = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');

async function fetchSupabase(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  let retries = 5;
  while (retries > 0) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

function execSql(sqlContent) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(__dirname, 'temp_export.sql');
    fs.writeFileSync(tmpFile, sqlContent, 'utf8');
    
    const child = spawn(SQLITE_BIN, [DB_PATH], { stdio: ['pipe', 'ignore', 'pipe'] });
    const inputStream = fs.createReadStream(tmpFile);
    let stderr = '';

    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      if (code === 0) resolve();
      else reject(new Error(`SQLite Error (code ${code}): ${stderr}`));
    });

    inputStream.pipe(child.stdin);
  });
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

async function main() {
  console.log("=== EXPORTING CLEAN OFFLINE SQLITE DB FOR BIBLE STUDY APP ===");

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log("Removed existing DB file.");
  }

  // Schema creation: Integer autoincrement primary keys for word_mappings to optimize file size <75MB
  const schemaSql = `
    PRAGMA synchronous = OFF;
    PRAGMA journal_mode = MEMORY;

    CREATE TABLE books (
      id INTEGER PRIMARY KEY,
      name_ar TEXT,
      name_en TEXT,
      testament TEXT,
      total_chapters INTEGER,
      order_num INTEGER
    );

    CREATE TABLE verses (
      id TEXT PRIMARY KEY,
      book_id INTEGER,
      chapter_num INTEGER,
      verse_num INTEGER,
      text_avd_ar TEXT,
      text_original TEXT,
      text_original_lang TEXT
    );

    CREATE TABLE word_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      verse_id TEXT,
      ar_word_position INTEGER,
      orig_word_position INTEGER,
      ar_word TEXT,
      orig_word TEXT,
      orig_word_lang TEXT,
      strongs_id TEXT,
      is_verified INTEGER
    );

    CREATE TABLE strongs_entries (
      strongs_id TEXT PRIMARY KEY,
      original_word TEXT,
      definition_en TEXT,
      kjv_usage TEXT
    );

    CREATE TABLE strongs_ar_translations (
      strongs_id TEXT PRIMARY KEY,
      pronunciation_ar TEXT,
      definition_ar TEXT,
      notes_ar TEXT,
      is_verified INTEGER
    );
  `;
  await execSql(schemaSql);
  console.log("Schema created.");

  // 1. Export Books
  console.log("Exporting books...");
  const CHAPTER_COUNTS = [50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22];
  const books = await fetchSupabase('/rest/v1/books?select=*&order=id.asc');
  if (books.length > 0) {
    let sql = 'BEGIN TRANSACTION;\n';
    for (const b of books) {
      const testName = b.id <= 39 ? 'OT' : 'NT';
      const totalCh = CHAPTER_COUNTS[b.id - 1] || b.total_chapters || 0;
      sql += `INSERT OR REPLACE INTO books (id, name_ar, name_en, testament, total_chapters, order_num) VALUES (${b.id}, ${escapeSql(b.name_ar)}, ${escapeSql(b.name_en)}, ${escapeSql(testName)}, ${totalCh}, ${b.order_num || b.id});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    console.log(`Exported ${books.length} books.`);
  }

  // 2. Export Verses and Scholar-Verified Word Mappings Book by Book
  console.log("Exporting verses and scholar-verified word_mappings book by book...");
  let totalVerses = 0;
  let totalMappings = 0;

  for (const b of books) {
    let offset = 0;
    const limit = 2000;
    let bookVerses = [];

    while (true) {
      const verses = await fetchSupabase(`/rest/v1/verses?book_id=eq.${b.id}&select=id,book_id,chapter_num,verse_num,text_avd_ar,text_original,text_manuscript,text_original_lang&limit=${limit}&offset=${offset}&order=chapter_num.asc,verse_num.asc`);
      if (!verses || verses.length === 0) break;
      bookVerses.push(...verses);
      if (verses.length < limit) break;
      offset += limit;
    }

    if (bookVerses.length === 0) continue;

    // Insert verses for this book (preferring authentic full manuscript text e.g. Leningrad Codex / SBLGNT)
    let verseSql = 'BEGIN TRANSACTION;\n';
    for (const v of bookVerses) {
      const origText = (v.text_manuscript && v.text_manuscript.trim().length > 0) ? v.text_manuscript : v.text_original;
      verseSql += `INSERT OR REPLACE INTO verses (id, book_id, chapter_num, verse_num, text_avd_ar, text_original, text_original_lang) VALUES (${escapeSql(v.id)}, ${v.book_id}, ${v.chapter_num}, ${v.verse_num}, ${escapeSql(v.text_avd_ar)}, ${escapeSql(origText)}, ${escapeSql(v.text_original_lang)});\n`;
    }
    verseSql += 'COMMIT;\n';
    await execSql(verseSql);
    totalVerses += bookVerses.length;

    // Fetch and insert ONLY scholar-verified word_mappings (is_verified = true)
    const verseIds = bookVerses.map(v => v.id);
    const chunkSize = 50;
    let bookMappingsCount = 0;

    for (let i = 0; i < verseIds.length; i += chunkSize) {
      const chunk = verseIds.slice(i, i + chunkSize);
      const idsParam = chunk.map(id => `"${id}"`).join(',');
      const mappings = await fetchSupabase(`/rest/v1/word_mappings?verse_id=in.(${idsParam})&is_verified=eq.true&select=verse_id,ar_word_position,orig_word_position,ar_word,orig_word,orig_word_lang,strongs_id,is_verified&limit=5000`);
      
      if (mappings && mappings.length > 0) {
        let wmSql = 'BEGIN TRANSACTION;\n';
        for (const m of mappings) {
          wmSql += `INSERT INTO word_mappings (verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES (${escapeSql(m.verse_id)}, ${m.ar_word_position || 0}, ${m.orig_word_position || 0}, ${escapeSql(m.ar_word)}, ${escapeSql(m.orig_word)}, ${escapeSql(m.orig_word_lang)}, ${escapeSql(m.strongs_id)}, 1);\n`;
        }
        wmSql += 'COMMIT;\n';
        await execSql(wmSql);
        bookMappingsCount += mappings.length;
      }
    }

    totalMappings += bookMappingsCount;
    console.log(`[Book ${b.id}] ${b.name_ar} (${b.name_en}): Exported ${bookVerses.length} verses & ${bookMappingsCount} verified word mappings.`);
  }

  console.log(`\nTotal Verses Exported: ${totalVerses}`);
  console.log(`Total Verified Word Mappings Exported: ${totalMappings}`);

  // 3. Export Strongs Entries
  console.log("Exporting strongs_entries...");
  let offset = 0;
  let seCount = 0;
  while (true) {
    const entries = await fetchSupabase(`/rest/v1/strongs_entries?select=strongs_id,original_word,definition_en,kjv_usage&order=strongs_id.asc&limit=1000&offset=${offset}`);
    if (!entries || entries.length === 0) break;
    let sql = 'BEGIN TRANSACTION;\n';
    for (const e of entries) {
      sql += `INSERT OR REPLACE INTO strongs_entries (strongs_id, original_word, definition_en, kjv_usage) VALUES (${escapeSql(e.strongs_id)}, ${escapeSql(e.original_word)}, ${escapeSql(e.definition_en)}, ${escapeSql(e.kjv_usage)});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    seCount += entries.length;
    console.log(`Strongs Entries offset ${offset}: Exported ${seCount} total.`);
    if (entries.length < 1000) break;
    offset += 1000;
  }

  // 4. Export Strongs AR Translations
  console.log("Exporting strongs_ar_translations...");
  offset = 0;
  let arCount = 0;
  while (true) {
    const trans = await fetchSupabase(`/rest/v1/strongs_ar_translations?select=strongs_id,pronunciation_ar,definition_ar,notes_ar,is_verified&order=strongs_id.asc&limit=1000&offset=${offset}`);
    if (!trans || trans.length === 0) break;
    let sql = 'BEGIN TRANSACTION;\n';
    for (const t of trans) {
      const verified = t.is_verified ? 1 : 0;
      sql += `INSERT OR REPLACE INTO strongs_ar_translations (strongs_id, pronunciation_ar, definition_ar, notes_ar, is_verified) VALUES (${escapeSql(t.strongs_id)}, ${escapeSql(t.pronunciation_ar)}, ${escapeSql(t.definition_ar)}, ${escapeSql(t.notes_ar)}, ${verified});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    arCount += trans.length;
    console.log(`AR Translations offset ${offset}: Exported ${arCount} total.`);
    if (trans.length < 1000) break;
    offset += 1000;
  }

  // 4.5 Ensure all strongs_ar_translations exist in strongs_entries
  console.log("Ensuring all strongs_ar_translations exist in strongs_entries...");
  await execSql(`
    BEGIN TRANSACTION;
    INSERT OR IGNORE INTO strongs_entries (strongs_id, original_word, definition_en, kjv_usage)
    SELECT strongs_id, pronunciation_ar, '', '' FROM strongs_ar_translations;
    COMMIT;
  `);

  // 5. Create Indexes & Vacuum database for maximum performance and smallest file size
  console.log("Creating database indexes...");
  const indexSql = `
    CREATE INDEX idx_verses_book_ch ON verses(book_id, chapter_num);
    CREATE INDEX idx_wm_verse_id ON word_mappings(verse_id);
    CREATE INDEX idx_wm_strongs_id ON word_mappings(strongs_id);
    PRAGMA optimize;
    VACUUM;
  `;
  await execSql(indexSql);
  console.log("Database indexes created and database vacuumed successfully!");

  const stats = fs.statSync(DB_PATH);
  console.log(`\n=== FULL OFFLINE DATABASE EXPORT COMPLETE ===`);
  console.log(`Uncompressed DB File: ${DB_PATH}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
