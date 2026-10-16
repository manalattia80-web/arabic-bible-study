const { execSync } = require('child_process');

// Query 2Sam 19:11, 1Kgs 4:21, 2Kgs 12:1, 1Chr 6:1, 2Chr 2:1
const sql = `
SELECT book_id, chapter_num, verse_num, text_original FROM verses WHERE 
(book_id = 10 AND chapter_num = 19 AND verse_num = 11) OR
(book_id = 11 AND chapter_num = 4 AND verse_num = 21) OR
(book_id = 12 AND chapter_num = 12 AND verse_num = 1) OR
(book_id = 13 AND chapter_num = 6 AND verse_num = 1) OR
(book_id = 14 AND chapter_num = 2 AND verse_num = 1);
`;

const res = execSync(`.\\sqlite_dist\\sqlite3.exe mobile/assets/bible_study.db "${sql.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
console.log(res);

// Also check if any verse contains '×' or 'Ö'
const checkCorrupted = execSync(`.\\sqlite_dist\\sqlite3.exe mobile/assets/bible_study.db "SELECT count(*) FROM verses WHERE text_original LIKE '%×%' OR text_original LIKE '%Ö%';"`, { encoding: 'utf8' });
console.log(`Corrupted verses containing × or Ö: ${checkCorrupted.trim()}`);
