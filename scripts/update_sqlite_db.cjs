const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { specificCorrections, transformText } = require('./theology_rules.cjs');

const DB_PATH = path.join(__dirname, '..', 'mobile', 'assets', 'bible_study.db');
const SQLITE_BIN = path.join(__dirname, '..', 'sqlite_dist', 'sqlite3.exe');

function runSql(sql) {
  const tmpFile = path.join(__dirname, 'temp_run.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpFile}"`, { stdio: 'inherit' });
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

async function main() {
  console.log('--- Updating SQLite bible_study.db ---');

  // Dump rows that have تدبيري
  const dumpSql = `SELECT strongs_id, definition_ar, notes_ar FROM strongs_ar_translations WHERE definition_ar LIKE '%تدبيري%' OR notes_ar LIKE '%تدبيري%' OR strongs_id IN ('${Object.keys(specificCorrections).join("','")}');`;
  
  const tmpQuery = path.join(__dirname, 'query.sql');
  const tmpOut = path.join(__dirname, 'dump.json');
  fs.writeFileSync(tmpQuery, `.mode json\n.output "${tmpOut.replace(/\\/g, '/')}"\n${dumpSql}\n.exit\n`, 'utf8');
  execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpQuery}"`);
  if (fs.existsSync(tmpQuery)) fs.unlinkSync(tmpQuery);

  const rows = JSON.parse(fs.readFileSync(tmpOut, 'utf8'));
  if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  console.log(`Found ${rows.length} rows to update in SQLite.`);

  // Prepare SQL update batches
  let sqlStatements = ['BEGIN TRANSACTION;'];
  let count = 0;

  for (const row of rows) {
    let def = row.definition_ar || '';
    let notes = row.notes_ar || '';

    // Check specific correction
    if (specificCorrections[row.strongs_id]) {
      if (specificCorrections[row.strongs_id].definition_ar) {
        def = specificCorrections[row.strongs_id].definition_ar;
      }
      if (specificCorrections[row.strongs_id].notes_ar) {
        notes = specificCorrections[row.strongs_id].notes_ar;
      }
    }

    def = transformText(def);
    notes = transformText(notes);

    sqlStatements.push(`UPDATE strongs_ar_translations SET definition_ar = ${escapeSql(def)}, notes_ar = ${escapeSql(notes)} WHERE strongs_id = ${escapeSql(row.strongs_id)};`);
    count++;
  }

  sqlStatements.push('COMMIT;');

  console.log(`Executing ${count} updates in SQLite...`);
  runSql(sqlStatements.join('\n'));
  console.log('Successfully updated SQLite database!');

  // Verification query
  const checkSql = `SELECT count(*) FROM strongs_ar_translations WHERE definition_ar LIKE '%التدبيري%';`;
  const tmpCheck = path.join(__dirname, 'check.sql');
  fs.writeFileSync(tmpCheck, checkSql, 'utf8');
  const remaining = execSync(`"${SQLITE_BIN}" "${DB_PATH}" < "${tmpCheck}"`).toString().trim();
  if (fs.existsSync(tmpCheck)) fs.unlinkSync(tmpCheck);
  console.log(`Remaining occurrences of التدبيري in SQLite: ${remaining}`);
}

main().catch(console.error);
