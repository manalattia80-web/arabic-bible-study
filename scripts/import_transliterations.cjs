const { execFileSync } = require('child_process');
const path = require('path');
const sqlite = path.resolve(__dirname, '../sqlite_dist/sqlite3.exe');
const db = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function runSql(sql) {
  return execFileSync(sqlite, [db], { input: sql, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

async function main() {
  console.log('=== Importing Latin Transliterations from OpenScriptures ===\n');

  console.log('1. Fetching Greek Strong dictionary...');
  const gText = await fetch('https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js').then(r => r.text());
  const gIdx = gText.indexOf('{');
  const gEnd = gText.lastIndexOf('}') + 1;
  const gData = JSON.parse(gText.slice(gIdx, gEnd));
  console.log(`   Fetched ${Object.keys(gData).length} Greek entries.`);

  console.log('2. Fetching Hebrew Strong dictionary...');
  const hText = await fetch('https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js').then(r => r.text());
  const hIdx = hText.indexOf('{');
  const hEnd = hText.lastIndexOf('}') + 1;
  const hData = JSON.parse(hText.slice(hIdx, hEnd));
  console.log(`   Fetched ${Object.keys(hData).length} Hebrew entries.`);

  console.log('3. Updating strongs_entries in SQLite...');
  let sql = 'BEGIN TRANSACTION;\n';
  let updateCount = 0;

  // Greek
  for (const [id, item] of Object.entries(gData)) {
    const xlit = item.translit || item.xlit;
    if (xlit) {
      sql += `UPDATE strongs_entries SET transliteration = '${xlit.replace(/'/g, "''")}' WHERE strongs_id = '${id}';\n`;
      updateCount++;
    }
  }

  // Hebrew
  for (const [id, item] of Object.entries(hData)) {
    const xlit = item.xlit || item.translit;
    if (xlit) {
      sql += `UPDATE strongs_entries SET transliteration = '${xlit.replace(/'/g, "''")}' WHERE strongs_id = '${id}';\n`;
      updateCount++;
    }
  }

  sql += 'COMMIT;\n';
  console.log(`   Executing ${updateCount} transliteration updates...`);
  runSql(sql);
  console.log('   SQL executed successfully.');

  // Verification
  const remainingEmpty = q("SELECT count(*) as cnt FROM strongs_entries WHERE transliteration IS NULL OR trim(transliteration) = '';")[0];
  const totalEntries = q("SELECT count(*) as cnt FROM strongs_entries;")[0];
  console.log(`\nVerification:`);
  console.log(`   Total Strong entries: ${totalEntries.cnt}`);
  console.log(`   Remaining empty transliterations: ${remainingEmpty.cnt}`);

  const sample = q("SELECT strongs_id, original_word, transliteration FROM strongs_entries WHERE strongs_id IN ('G1', 'G26', 'G907', 'G908', 'H1', 'H430', 'H7880') ORDER BY strongs_id;");
  console.log('Sample updated entries:');
  sample.forEach(s => console.log(`   ${s.strongs_id} (${s.original_word}) -> ${s.transliteration}`));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
