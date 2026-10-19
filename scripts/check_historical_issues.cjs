const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

const checks = [
  // User request 6
  { desc: 'Rev 7:7 يساكر (exp G2466)', sql: "SELECT wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 66 AND v.chapter_num = 7 AND v.verse_num = 7 AND wm.ar_word LIKE '%يَسَّاكَرَ%';" },
  { desc: '1 Cor 13:12 لغز (exp G135)', sql: "SELECT wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 46 AND v.chapter_num = 13 AND v.verse_num = 12 AND wm.ar_word LIKE '%لُغْزٍ%';" },
  { desc: 'John 7:50 نيقوديموس (exp G3530)', sql: "SELECT wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 43 AND v.chapter_num = 7 AND v.verse_num = 50 AND wm.ar_word LIKE '%نِيقُودِيمُوسُ%';" },
  { desc: 'Mark 14:56 تتفق (exp G2470)', sql: "SELECT wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 41 AND v.chapter_num = 14 AND v.verse_num = 56 AND wm.ar_word LIKE '%تَتَّفِقْ%';" },
  { desc: '2 Cor 11:32 الوالي (exp G1481)', sql: "SELECT wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 47 AND v.chapter_num = 11 AND v.verse_num = 32 AND wm.ar_word LIKE '%الْوَالِي%';" },
  // 20 items from request 6:
  { desc: 'Mark 2:22 الزقاق (exp G779)', sql: "SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 41 AND v.chapter_num = 2 AND v.verse_num = 22 AND wm.ar_word LIKE '%زِقَاق%';" },
  { desc: 'Mark 11:2-7 الجحش (exp G4454)', sql: "SELECT v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 41 AND v.chapter_num = 11 AND v.verse_num IN (2,4,5,7) AND wm.ar_word LIKE '%جَحْش%';" },
  { desc: 'Mark 14:38 اسهروا (exp G1127)', sql: "SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 41 AND v.chapter_num = 14 AND v.verse_num = 38 AND wm.ar_word LIKE '%اسْهَرُوا%';" },
  { desc: 'Mark 14:68 الدهليز (exp G4259)', sql: "SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 41 AND v.chapter_num = 14 AND v.verse_num = 68 AND wm.ar_word LIKE '%الدِّهْلِيزِ%';" },
  { desc: 'Mark 15:40; 16:1 سالومة (exp G4539)', sql: "SELECT v.chapter_num, v.verse_num, wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 41 AND v.chapter_num IN (15,16) AND wm.ar_word LIKE '%سَالُومَةُ%';" },
  { desc: 'Luke 1:15 مسكرا (exp G4608)', sql: "SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 42 AND v.chapter_num = 1 AND v.verse_num = 15 AND wm.ar_word LIKE '%مُسْكِرًا%';" },
  { desc: 'Luke 3:16 سيور (exp G2438)', sql: "SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 42 AND v.chapter_num = 3 AND v.verse_num = 16 AND wm.ar_word LIKE '%سُيُورَ%';" },
  { desc: 'Luke 8:3 يونا (exp G2489)', sql: "SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 42 AND v.chapter_num = 8 AND v.verse_num = 3 AND wm.ar_word LIKE '%يُونَّا%';" },
  { desc: 'Luke 13:4 سلوام (exp G4610)', sql: "SELECT wm.ar_word_position, wm.ar_word, wm.strongs_id FROM word_mappings wm JOIN verses v ON wm.verse_id = v.id WHERE v.book_id = 42 AND v.chapter_num = 13 AND v.verse_num = 4 AND wm.ar_word LIKE '%سِلْوَامَ%';" }
];

checks.forEach(c => {
  try {
    const res = q(c.sql);
    console.log(c.desc, '->', JSON.stringify(res));
  } catch(e) {
    console.log(c.desc, 'ERROR:', e.message);
  }
});
