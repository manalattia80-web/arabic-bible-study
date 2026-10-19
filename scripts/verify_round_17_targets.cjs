const { execFileSync } = require('child_process');
const q = sql => {
  const res = execFileSync('sqlite_dist/sqlite3.exe', ['mobile/assets/bible_study.db', '-json', sql], {encoding: 'utf8'});
  return res && res.trim() ? JSON.parse(res) : [];
};

const targets = [
  'H593', 'H2928', 'H4719', 'H3562', 'H6777',
  'G5420', 'G4847', 'G1127', 'G72', 'G3071', 'G543', 'G223', 'G3319', 'G254', 'G117', 'G2119', 'G4029', 'G686'
];

for (const id of targets) {
  const r = q(`SELECT e.strongs_id, e.original_word, substr(t.definition_ar, 1, 60) as def FROM strongs_entries e LEFT JOIN strongs_ar_translations t ON e.strongs_id = t.strongs_id WHERE e.strongs_id='${id}'`);
  console.log(id, r[0]);
}
