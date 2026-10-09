const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

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
  console.log("=== EXPORTING FULL SUPABASE DATA TO OFFLINE SQLITE DB ===");

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log("Removed previous partial DB file.");
  }

  // Schema creation
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
      id TEXT PRIMARY KEY,
      verse_id TEXT,
      ar_word_position INTEGER,
      ar_word TEXT,
      ar_word_normalized TEXT,
      orig_word TEXT,
      orig_word_lang TEXT,
      strongs_id TEXT,
      is_verified INTEGER
    );

    CREATE TABLE strongs_entries (
      strongs_id TEXT PRIMARY KEY,
      language TEXT,
      original_word TEXT,
      transliteration TEXT,
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

  // 1. Export Books (66 books)
  console.log("1. Exporting all 66 books...");
  const books = await fetchSupabase('/rest/v1/books?select=*&order=id.asc');
  if (books.length > 0) {
    let sql = 'BEGIN TRANSACTION;\n';
    for (const b of books) {
      sql += `INSERT OR REPLACE INTO books (id, name_ar, name_en, testament, total_chapters, order_num) VALUES (${b.id}, ${escapeSql(b.name_ar)}, ${escapeSql(b.name_en)}, ${escapeSql(b.testament)}, ${b.total_chapters || 0}, ${b.order_num || b.id});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    console.log(`Exported ${books.length} books.`);
  }

  // 2. Export All 31,102 Verses
  console.log("2. Exporting all 31,102 verses...");
  let offset = 0;
  const limit = 1000;
  let verseCount = 0;
  while (true) {
    const verses = await fetchSupabase(`/rest/v1/verses?select=id,book_id,chapter_num,verse_num,text_avd_ar,text_original,text_original_lang&limit=${limit}&offset=${offset}&order=book_id.asc,chapter_num.asc,verse_num.asc`);
    if (!verses || verses.length === 0) break;
    let sql = 'BEGIN TRANSACTION;\n';
    for (const v of verses) {
      sql += `INSERT OR REPLACE INTO verses (id, book_id, chapter_num, verse_num, text_avd_ar, text_original, text_original_lang) VALUES (${escapeSql(v.id)}, ${v.book_id}, ${v.chapter_num}, ${v.verse_num}, ${escapeSql(v.text_avd_ar)}, ${escapeSql(v.text_original)}, ${escapeSql(v.text_original_lang)});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    verseCount += verses.length;
    console.log(`Verses: Exported ${verseCount} total.`);
    offset += verses.length;
    if (verses.length < limit) break;
  }

  // 3. Export All 14,157 Strong's Entries
  console.log("3. Exporting strongs_entries...");
  offset = 0;
  let seCount = 0;
  while (true) {
    const entries = await fetchSupabase(`/rest/v1/strongs_entries?select=strongs_id,language,original_word,transliteration,definition_en,kjv_usage&limit=${limit}&offset=${offset}&order=strongs_id.asc`);
    if (!entries || entries.length === 0) break;
    let sql = 'BEGIN TRANSACTION;\n';
    for (const e of entries) {
      sql += `INSERT OR REPLACE INTO strongs_entries (strongs_id, language, original_word, transliteration, definition_en, kjv_usage) VALUES (${escapeSql(e.strongs_id)}, ${escapeSql(e.language)}, ${escapeSql(e.original_word)}, ${escapeSql(e.transliteration)}, ${escapeSql(e.definition_en)}, ${escapeSql(e.kjv_usage)});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    seCount += entries.length;
    console.log(`Strongs Entries: Exported ${seCount} total.`);
    offset += entries.length;
    if (entries.length < limit) break;
  }

  // 4. Export All 14,156 Strong's AR Translations (with Pentecostal and 'الكتابي' already in Supabase!)
  console.log("4. Exporting strongs_ar_translations...");
  offset = 0;
  let arCount = 0;
  while (true) {
    const trans = await fetchSupabase(`/rest/v1/strongs_ar_translations?select=strongs_id,pronunciation_ar,definition_ar,notes_ar,is_verified&limit=${limit}&offset=${offset}&order=strongs_id.asc`);
    if (!trans || trans.length === 0) break;
    let sql = 'BEGIN TRANSACTION;\n';
    for (const t of trans) {
      const verified = t.is_verified ? 1 : 0;
      sql += `INSERT OR REPLACE INTO strongs_ar_translations (strongs_id, pronunciation_ar, definition_ar, notes_ar, is_verified) VALUES (${escapeSql(t.strongs_id)}, ${escapeSql(t.pronunciation_ar)}, ${escapeSql(t.definition_ar)}, ${escapeSql(t.notes_ar)}, ${verified});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    arCount += trans.length;
    console.log(`AR Translations: Exported ${arCount} total.`);
    offset += trans.length;
    if (trans.length < limit) break;
  }

  // 5. Export New Testament Word Mappings (and key chapters, up to 100,000 mappings)
  console.log("5. Exporting key word mappings (NT and common books)...");
  offset = 0;
  let wmCount = 0;
  const maxWm = 100000;
  while (wmCount < maxWm) {
    const wms = await fetchSupabase(`/rest/v1/word_mappings?select=id,verse_id,ar_word_position,ar_word,ar_word_normalized,orig_word,orig_word_lang,strongs_id,is_verified&limit=${limit}&offset=${offset}&order=verse_id.asc,ar_word_position.asc`);
    if (!wms || wms.length === 0) break;
    let sql = 'BEGIN TRANSACTION;\n';
    for (const m of wms) {
      const verified = m.is_verified ? 1 : 0;
      sql += `INSERT OR REPLACE INTO word_mappings (id, verse_id, ar_word_position, ar_word, ar_word_normalized, orig_word, orig_word_lang, strongs_id, is_verified) VALUES (${escapeSql(m.id)}, ${escapeSql(m.verse_id)}, ${m.ar_word_position || 0}, ${escapeSql(m.ar_word)}, ${escapeSql(m.ar_word_normalized)}, ${escapeSql(m.orig_word)}, ${escapeSql(m.orig_word_lang)}, ${escapeSql(m.strongs_id)}, ${verified});\n`;
    }
    sql += 'COMMIT;\n';
    await execSql(sql);
    wmCount += wms.length;
    console.log(`Word Mappings: Exported ${wmCount} total.`);
    offset += wms.length;
    if (wms.length < limit) break;
  }

  // 6. Create Indexes
  console.log("6. Creating database indexes...");
  const indexSql = `
    CREATE INDEX idx_verses_book_ch ON verses(book_id, chapter_num);
    CREATE INDEX idx_wm_verse_id ON word_mappings(verse_id);
    CREATE INDEX idx_wm_strongs_id ON word_mappings(strongs_id);
    CREATE INDEX idx_strongs_ar_id ON strongs_ar_translations(strongs_id);
    VACUUM;
    PRAGMA optimize;
  `;
  await execSql(indexSql);
  console.log("Database indexes and vacuum completed!");

  const stats = fs.statSync(DB_PATH);
  console.log(`\n=== FULL OFFLINE DATABASE EXPORT COMPLETE ===`);
  console.log(`File: ${DB_PATH}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
