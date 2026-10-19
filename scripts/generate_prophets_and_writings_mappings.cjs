const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Loading Hebrew dictionary for Prophets and Writings...');
const dictLines = fs.readFileSync('scripts/temp_hebrew_dict.tsv', 'utf8').split('\n');

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\p{P}\u060C\u061B\u061F«»"'\-—–]/gu, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .trim();
}

function cleanWord(text) {
  if (!text) return '';
  return text.replace(/[\.,;:!?«»\(\)\[\]\u060C\u061B\u061F"'\-—–]/gu, '').trim();
}

function stripHebrew(text) {
  if (!text) return '';
  return text
    .replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '')
    .replace(/[\u05BE׃׀]/g, ' ')
    .replace(/[\(\)\[\]]/g, '')
    .trim();
}

const exactDict = new Map();
const normDict = new Map();

for (const line of dictLines) {
  if (!line || !line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const w = cleanWord(parts[0]);
  const s = parts[1].trim();
  const cnt = parseInt(parts[2].trim(), 10) || 1;
  
  if (!exactDict.has(w)) exactDict.set(w, []);
  exactDict.get(w).push({ sid: s, cnt });
  
  const n = normalizeArabic(w);
  if (!normDict.has(n)) normDict.set(n, []);
  normDict.get(n).push({ sid: s, cnt });
}

const strongsMap = new Map();
const sRows = q("SELECT strongs_id, original_word FROM strongs_entries WHERE strongs_id LIKE 'H%';");
for (const r of sRows) {
  strongsMap.set(r.strongs_id, r.original_word);
}

// Fetch all unmapped verses in books other than Psalms (book_id != 19)
const unmappedVerses = q(`
  SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original, text_original_lang
  FROM verses 
  WHERE book_id != 19 AND id NOT IN (SELECT DISTINCT verse_id FROM word_mappings)
  ORDER BY book_id, chapter_num, verse_num;
`);

console.log(`Found ${unmappedVerses.length} unmapped verses in Prophets and Writings (excluding Psalms).`);

let sql = 'BEGIN TRANSACTION;\n\n';
let totalWords = 0;
let matchedCount = 0;

for (const v of unmappedVerses) {
  sql += `DELETE FROM word_mappings WHERE verse_id = '${v.id}';\n`;
  
  const arTokens = v.text_avd_ar.split(/\s+/).filter(Boolean);
  const rawHebrewWords = stripHebrew(v.text_original).split(/\s+/).filter(Boolean);
  const lang = v.text_original_lang || 'hebrew';
  
  for (let i = 0; i < arTokens.length; i++) {
    totalWords++;
    const raw = arTokens[i];
    const cl = cleanWord(raw);
    const nm = normalizeArabic(cl);
    
    let candidates = [];
    if (exactDict.has(cl)) {
      for (const item of exactDict.get(cl)) {
        candidates.push({ sid: item.sid, cnt: item.cnt, score: 2000 + item.cnt * 10 });
      }
    }
    if (candidates.length === 0 && normDict.has(nm)) {
      for (const item of normDict.get(nm)) {
        candidates.push({ sid: item.sid, cnt: item.cnt, score: 1200 + item.cnt * 5 });
      }
    }
    if (candidates.length === 0) {
      for (const p of ['و', 'ف', 'ب', 'ل', 'ك', 'وال', 'فال', 'كال', 'بال', 'لل']) {
        if (cl.startsWith(p) && cl.length > p.length + 1) {
          const subN = normalizeArabic(cl.slice(p.length));
          if (normDict.has(subN)) {
            for (const item of normDict.get(subN)) {
              candidates.push({ sid: item.sid, cnt: item.cnt, score: 800 + item.cnt * 3 });
            }
            break;
          }
        }
      }
    }
    
    let best = null;
    let bestScore = -999999;
    
    for (const cand of candidates) {
      let s = cand.score;
      const lemma = strongsMap.get(cand.sid) || '';
      const strippedLemma = stripHebrew(lemma);
      
      let foundInHebrew = false;
      for (let j = 0; j < rawHebrewWords.length; j++) {
        const hw = rawHebrewWords[j];
        if (hw === strippedLemma || hw.includes(strippedLemma) || (strippedLemma.length >= 3 && hw.slice(-3) === strippedLemma.slice(-3))) {
          foundInHebrew = true;
          const posDiff = Math.abs((i / arTokens.length) - (j / rawHebrewWords.length));
          s += (1500 - posDiff * 800);
          break;
        }
      }
      
      if (foundInHebrew && s > bestScore) {
        bestScore = s;
        best = { sid: cand.sid, lemma };
      } else if (!foundInHebrew && s > bestScore && s > 1500) {
        bestScore = s;
        best = { sid: cand.sid, lemma };
      }
    }
    
    const rowId = crypto.randomUUID();
    const pos = i + 1;
    let strongVal = 'NULL';
    let origVal = "'---'";
    
    if (best) {
      matchedCount++;
      strongVal = `'${best.sid}'`;
      const origText = best.lemma || '---';
      origVal = `'${origText.replace(/'/g, "''")}'`;
    }
    
    const arVal = `'${raw.replace(/'/g, "''")}'`;
    sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${v.id}', ${pos}, ${pos}, ${arVal}, ${origVal}, '${lang}', ${strongVal}, 1);\n`;
  }
}

sql += '\nCOMMIT;\n';

fs.writeFileSync('scripts/insert_prophets_and_writings.sql', sql, 'utf8');
console.log(`Generated SQL for ${totalWords} words (${matchedCount} linked) across ${unmappedVerses.length} verses.`);

console.log('Executing SQL against mobile/assets/bible_study.db...');
execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Execution complete!');

// Verification
const nonPsalmRemaining = q("SELECT count(*) as cnt FROM verses WHERE book_id != 19 AND id NOT IN (SELECT DISTINCT verse_id FROM word_mappings);")[0];
console.log('Remaining unmapped verses in the entire Bible outside of Psalms:', nonPsalmRemaining.cnt);

const totalUnmapped = q("SELECT count(*) as unmapped_total FROM verses WHERE id NOT IN (SELECT DISTINCT verse_id FROM word_mappings);")[0];
console.log('Remaining unmapped verses in the whole Bible (Psalms only):', totalUnmapped.unmapped_total);

const unmappedChapters = q(`
  SELECT count(*) as cnt FROM (
    SELECT v.book_id, v.chapter_num
    FROM verses v
    WHERE v.id NOT IN (SELECT DISTINCT verse_id FROM word_mappings)
    GROUP BY v.book_id, v.chapter_num
    HAVING count(v.id) = (SELECT count(*) FROM verses v2 WHERE v2.book_id = v.book_id AND v2.chapter_num = v.chapter_num)
  );
`)[0];
console.log('Remaining full unmapped chapters in the whole Bible (Psalms only):', unmappedChapters.cnt);
