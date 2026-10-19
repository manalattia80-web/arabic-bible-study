const { execSync } = require('child_process');

const hebrewIds = ['H2905', 'H344', 'H3241', 'H2174', 'H6376', 'H2188', 'H7120', 'H6208', 'H3355', 'H3876', 'H4471', 'H8413', 'H8134', 'H2104', 'H1990', 'H7259', 'H5891', 'H420', 'H2153', 'H3812', 'H7192', 'H5742'];
const greekIds = ['G3076', 'G2197', 'G966', 'G4605', 'G2034', 'G4212', 'G3012', 'G3038', 'G1045', 'G5505', 'G2861', 'G4091', 'G4588', 'G4824', 'G4669', 'G4687', 'G5342', 'G4489', 'G4020', 'G2788', 'G4972', 'G2919', 'G2430', 'G919', 'G348', 'G2463', 'G2274', 'G5280', 'G2425', 'G5393', 'G3535', 'G969'];
const allIds = [...new Set([...hebrewIds, ...greekIds])];

const sql = `SELECT strongs_id FROM strongs_entries WHERE strongs_id IN ('${allIds.join("','")}');`;
const res = execSync(`.\\sqlite_dist\\sqlite3.exe mobile/assets/bible_study.db "${sql}"`).toString().trim().split(/\r?\n/).filter(Boolean);
const found = new Set(res);
const missing = allIds.filter(id => !found.has(id));

console.log('Total checked:', allIds.length);
console.log('Found:', found.size);
console.log('Missing:', missing);
