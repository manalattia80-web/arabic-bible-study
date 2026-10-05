const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');
const SQLITE_BIN = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');

function runSql(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn(SQLITE_BIN, [DB_PATH, sql], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`SQLite Error: ${stderr}`));
    });
  });
}

async function main() {
  console.log("=== VERIFYING OFFLINE SQLITE DATABASE ===");
  if (!fs.existsSync(DB_PATH) && fs.existsSync(DB_PATH + '.gz')) {
    const zlib = require('zlib');
    console.log("Decompressing bible_study.db.gz for verification...");
    fs.writeFileSync(DB_PATH, zlib.gunzipSync(fs.readFileSync(DB_PATH + '.gz')));
  }
  if (!fs.existsSync(DB_PATH)) {
    console.error("DB file does not exist!");
    return;
  }
  const stats = fs.statSync(DB_PATH);
  console.log(`DB File Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  const booksCount = await runSql("SELECT count(*) FROM books;");
  const versesCount = await runSql("SELECT count(*) FROM verses;");
  const mappingsCount = await runSql("SELECT count(*) FROM word_mappings;");
  const strongsCount = await runSql("SELECT count(*) FROM strongs_entries;");
  const dictCount = await runSql("SELECT count(*) FROM strongs_ar_translations;");

  console.log(`Books Count: ${booksCount}`);
  console.log(`Verses Count: ${versesCount}`);
  console.log(`Word Mappings Count: ${mappingsCount}`);
  console.log(`Strong's Entries Count: ${strongsCount}`);
  console.log(`Arabic Dictionary Translations: ${dictCount}`);

  // Test verse query
  const sampleVerse = await runSql("SELECT book_id, chapter_num, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 40 AND chapter_num = 1 AND verse_num = 1;");
  console.log("\nSample Verse (Matthew 1:1):", sampleVerse);

  // Test mapping query
  const sampleMappings = await runSql("SELECT ar_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = '11111111-0000-0000-0040-000000001001' ORDER BY ar_word_position ASC;");
  console.log("\nSample Word Mappings (Matthew 1:1):\n", sampleMappings);
}

main().catch(console.error);
