const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const sqliteExe = path.resolve('sqlite_dist/sqlite3.exe');
const dbPath = path.resolve('mobile/assets/bible_study.db');

const matchedCases = JSON.parse(fs.readFileSync('scripts/matched_cases.json', 'utf8'));

let sqlStatements = [];
sqlStatements.push('-- Master Fix for 86 False Friends across OT and NT');
sqlStatements.push('BEGIN TRANSACTION;');

for (const item of matchedCases) {
  const { caseInfo, mapping, targetLemma } = item;
  const escapedTargetLemma = targetLemma.replace(/'/g, "''");
  sqlStatements.push(`-- Book ${caseInfo.book} ${caseInfo.ch}:${caseInfo.v} - "${mapping.ar_word}" (${caseInfo.current} -> ${caseInfo.target})`);
  sqlStatements.push(`UPDATE word_mappings SET strongs_id = '${caseInfo.target}', orig_word = '${escapedTargetLemma}', orig_word_lang = '${caseInfo.lang}', is_verified = 1 WHERE id = '${mapping.id}';`);
}

sqlStatements.push('COMMIT;');

const sqlContent = sqlStatements.join('\n') + '\n';
fs.writeFileSync('scripts/fix_all_remaining_86_false_friends.sql', sqlContent, 'utf8');
console.log(`Generated SQL file with ${matchedCases.length} updates.`);

// Apply to database
console.log('Applying SQL to database...');
execFileSync(sqliteExe, [dbPath], { input: sqlContent, encoding: 'utf8' });

// Verify each record in DB
console.log('Verifying applied updates in database...');
let verifiedCount = 0;
let errors = [];

for (const item of matchedCases) {
  const { caseInfo, mapping, targetLemma } = item;
  const res = execFileSync(sqliteExe, [dbPath, '-json', `SELECT id, strongs_id, orig_word, orig_word_lang, is_verified FROM word_mappings WHERE id = '${mapping.id}';`], { encoding: 'utf8' });
  const rows = JSON.parse(res);
  if (!rows || rows.length === 0) {
    errors.push(`Row not found for id ${mapping.id}`);
  } else {
    const row = rows[0];
    if (row.strongs_id !== caseInfo.target) {
      errors.push(`Mismatch strongs_id for ${mapping.id}: got ${row.strongs_id}, expected ${caseInfo.target}`);
    } else if (row.orig_word !== targetLemma) {
      errors.push(`Mismatch orig_word for ${mapping.id}: got ${row.orig_word}, expected ${targetLemma}`);
    } else {
      verifiedCount++;
    }
  }
}

console.log(`Verification: ${verifiedCount} / ${matchedCases.length} successfully verified!`);
if (errors.length > 0) {
  console.error('Errors encountered:');
  errors.forEach(e => console.error(e));
  process.exit(1);
} else {
  console.log('ALL 86 CASES PERFECTLY UPDATED AND VERIFIED!');
}
