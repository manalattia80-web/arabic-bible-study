const { execFileSync } = require('child_process');
const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const out = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return out && out.trim() ? JSON.parse(out) : [];
}

const targets = [
  // Hebrew
  { book: 2, ch: 6, v: 22, word: 'وألصافان', cur: 'H451', tgt: 'H469', lang: 'hebrew' },
  { book: 2, ch: 6, v: 25, word: 'فوطيئيل', cur: 'H6326', tgt: 'H6317', lang: 'hebrew' },
  { book: 2, ch: 12, v: 23, word: 'والقائمتين', cur: 'H4617', tgt: 'H4201', lang: 'hebrew' },
  { book: 2, ch: 12, v: 34, word: 'ومعاجنهم', cur: 'H4894', tgt: 'H4863', lang: 'hebrew' },
  { book: 2, ch: 21, v: 18, word: 'بلكمة', cur: 'H1053', tgt: 'H106', lang: 'hebrew' },
  // Ex 28:18-20: والصف (3 records)
  { book: 2, ch: 28, v: 18, word: 'والصف', cur: 'H8503', tgt: 'H2905', lang: 'hebrew' },
  { book: 2, ch: 28, v: 19, word: 'والصف', cur: 'H8503', tgt: 'H2905', lang: 'hebrew' },
  { book: 2, ch: 28, v: 20, word: 'والصف', cur: 'H8503', tgt: 'H2905', lang: 'hebrew' },
  // Lev 11:9-12: زعانف (2 records)
  { book: 3, ch: 11, v: 9, word: 'زعانف', cur: 'H5507', tgt: 'H5579', lang: 'hebrew' },
  { book: 3, ch: 11, v: 10, word: 'زعانف', cur: 'H5507', tgt: 'H5579', lang: 'hebrew' },
  // Lev 11:9-12: حرشف (3 records)
  { book: 3, ch: 11, v: 9, word: 'حرشف', cur: 'H7138', tgt: 'H7193', lang: 'hebrew' },
  { book: 3, ch: 11, v: 10, word: 'حرشف', cur: 'H7138', tgt: 'H7193', lang: 'hebrew' },
  { book: 3, ch: 11, v: 12, word: 'حرشف', cur: 'H7138', tgt: 'H7193', lang: 'hebrew' },
  // Lev 12:3: غرلته
  { book: 3, ch: 12, v: 3, word: 'غرلته', cur: 'H4899', tgt: 'H6190', lang: 'hebrew' },

  // Greek
  // Acts 20:13-14: أسوس (2 records)
  { book: 44, ch: 20, v: 13, word: 'أسوس', cur: 'G78', tgt: 'G789', lang: 'greek' },
  { book: 44, ch: 20, v: 14, word: 'أسوس', cur: 'G78', tgt: 'G789', lang: 'greek' },
  // Acts 18:24: إسكندري
  { book: 44, ch: 18, v: 24, word: 'إسكندري', cur: 'G742', tgt: 'G221', lang: 'greek' },
  // Acts 13:1: لوكيوس
  { book: 44, ch: 13, v: 1, word: 'لوكيوس', cur: 'G3070', tgt: 'G3066', lang: 'greek' },
  // Acts 13:5: سلاميس
  { book: 44, ch: 13, v: 5, word: 'سلاميس', cur: 'G4540', tgt: 'G4529', lang: 'greek' },
  // Acts 17:18: الرواقيين
  { book: 44, ch: 17, v: 18, word: 'الرواقيين', cur: 'G4524', tgt: 'G4770', lang: 'greek' },
  // 2 Cor 12:7: شوكة
  { book: 47, ch: 12, v: 7, word: 'شوكة', cur: 'G4613', tgt: 'G4647', lang: 'greek' },
  // Heb 9:1: خدمة
  { book: 58, ch: 9, v: 1, word: 'خدمة', cur: 'G3002', tgt: 'G2999', lang: 'greek' },
  // 2 Tim 3:13: أردأ
  { book: 55, ch: 3, v: 13, word: 'أردأ', cur: 'G5488', tgt: 'G5501', lang: 'greek' },
  // Luke 19:29: بيت فاجي (2 records: بيت + فاجي)
  { book: 42, ch: 19, v: 29, word: 'بيت', cur: 'G961', tgt: 'G967', lang: 'greek' },
  { book: 42, ch: 19, v: 29, word: 'فاجي', cur: 'G961', tgt: 'G967', lang: 'greek' },
  // Rev 21:19: زمرد ذبابي (2 records: زمرد + ذبابي)
  { book: 66, ch: 21, v: 19, word: 'زمرد', cur: 'G4658', tgt: 'G4665', lang: 'greek' },
  { book: 66, ch: 21, v: 19, word: 'ذبابي', cur: 'G4658', tgt: 'G4665', lang: 'greek' }
];

console.log('Inspecting targets against strongs_entries & word_mappings...');
let missingStrongs = 0;
let matchedItems = [];
let notFound = [];

for (const t of targets) {
  // Check strongs_entries
  const se = q(`SELECT strongs_id, original_word FROM strongs_entries WHERE strongs_id = '${t.tgt}';`);
  if (!se || se.length === 0) {
    console.error(`MISSING IN strongs_entries: ${t.tgt}`);
    missingStrongs++;
  }
  const lemma = se[0]?.original_word || '';

  // Check word_mappings
  const verse = q(`SELECT id, text_avd_ar FROM verses WHERE book_id = ${t.book} AND chapter_num = ${t.ch} AND verse_num = ${t.v};`);
  if (!verse || verse.length === 0) {
    console.error(`Verse not found: ${t.book} ${t.ch}:${t.v}`);
    notFound.push(t);
    continue;
  }
  const verseId = verse[0].id;

  const mappings = q(`SELECT id, ar_word_position, orig_word_position, ar_word, orig_word, strongs_id FROM word_mappings WHERE verse_id = '${verseId}' ORDER BY ar_word_position;`);

  const cleanTarget = t.word.replace(/[\u064B-\u065F\u0670]/g, '');
  const matched = mappings.filter(m => {
    const cleanAr = (m.ar_word || '').replace(/[\u064B-\u065F\u0670]/g, '');
    return cleanAr.includes(cleanTarget) || cleanTarget.includes(cleanAr);
  });

  if (matched.length === 0) {
    console.warn(`NOT MATCHED: ${t.book} ${t.ch}:${t.v} word "${t.word}"`);
    console.log('Available in verse:', mappings.map(m => `${m.ar_word_position}:${m.ar_word}(${m.strongs_id})`).join(' '));
    notFound.push(t);
  } else {
    // If multiple matches, pick the one matching t.cur
    let sel = matched[0];
    if (matched.length > 1) {
      const byCur = matched.find(m => m.strongs_id === t.cur);
      if (byCur) sel = byCur;
    }
    matchedItems.push({
      target: t,
      verseId,
      mapping: sel,
      lemma
    });
  }
}

console.log(`\nSummary:`);
console.log(`Matched: ${matchedItems.length} / ${targets.length}`);
console.log(`Not found: ${notFound.length}`);
console.log(`Missing strongs: ${missingStrongs}`);

require('fs').writeFileSync('scripts/new_batch_matched.json', JSON.stringify(matchedItems, null, 2), 'utf8');
