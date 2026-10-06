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
  console.log("=== INSPECTING CURRENT ASSET DATABASE ===");
  if (!fs.existsSync(DB_PATH)) {
    console.error("DB file missing!");
    return;
  }

  const books = await runSql("SELECT id, name_ar, total_chapters, testament FROM books LIMIT 5;");
  console.log("Books sample:\n", books);

  const sampleDict = await runSql("SELECT strongs_id, pronunciation_ar, definition_ar FROM strongs_ar_translations WHERE strongs_id = 'G1078';");
  console.log("Sample Strongs Dict (G1078):\n", sampleDict);

  const mappingsCount = await runSql("SELECT count(*) FROM word_mappings;");
  console.log("Word Mappings count:", mappingsCount);
}

main().catch(console.error);
