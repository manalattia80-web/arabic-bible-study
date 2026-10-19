const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Loading dictionary for final NT alignment...');
const dictLines = fs.readFileSync('scripts/temp_greek_dict.tsv', 'utf8').split('\n');

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

const exactDict = new Map();
const normDict = new Map();

for (const line of dictLines) {
  if (!line || !line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const w = cleanWord(parts[0]);
  const s = parts[1].trim();
  const cnt = parseInt(parts[2].trim(), 10) || 1;
  
  const key1 = `${w}|${s}`;
  exactDict.set(key1, (exactDict.get(key1) || 0) + cnt);
  
  const n = normalizeArabic(w);
  const key2 = `${n}|${s}`;
  normDict.set(key2, (normDict.get(key2) || 0) + cnt);
}

const data = JSON.parse(fs.readFileSync('scripts/nt_remaining_130_data.json', 'utf8'));

let totalInserted = 0;
let sql = 'BEGIN TRANSACTION;\n\n';

for (const v of data) {
  // First ensure no partial records exist for this verse
  sql += `DELETE FROM word_mappings WHERE verse_id = '${v.verse_id}';\n`;
  
  const usedGreekIndices = new Set();
  
  for (let i = 0; i < v.ar_tokens.length; i++) {
    const raw = v.ar_tokens[i];
    const cl = cleanWord(raw);
    const nm = normalizeArabic(cl);
    
    let bestG = null;
    let bestScore = -999999;
    let bestJ = -1;
    
    for (let j = 0; j < v.greek_words.length; j++) {
      if (usedGreekIndices.has(j)) continue;
      const gw = v.greek_words[j];
      const sId = gw.strong;
      
      let score = 0;
      if (exactDict.has(`${cl}|${sId}`)) {
        score = 2500 + exactDict.get(`${cl}|${sId}`) * 10;
      } else if (normDict.has(`${nm}|${sId}`)) {
        score = 1500 + normDict.get(`${nm}|${sId}`) * 5;
      } else {
        for (const p of ['و', 'ف', 'ب', 'ل', 'ك', 'وال', 'فال', 'كال', 'بال', 'لل']) {
          if (cl.startsWith(p) && cl.length > p.length + 1) {
            const sub = cl.slice(p.length);
            if (exactDict.has(`${sub}|${sId}`)) {
              score = 1200 + exactDict.get(`${sub}|${sId}`) * 5;
              break;
            }
            const subN = normalizeArabic(sub);
            if (normDict.has(`${subN}|${sId}`)) {
              score = 900 + normDict.get(`${subN}|${sId}`) * 3;
              break;
            }
          }
        }
      }
      
      if (score > 0) {
        const posDiff = Math.abs((i / Math.max(1, v.ar_tokens.length)) - (j / Math.max(1, v.greek_words.length)));
        score -= (posDiff * 600);
        
        if (score > bestScore) {
          bestScore = score;
          bestG = gw;
          bestJ = j;
        }
      }
    }
    
    const rowId = crypto.randomUUID();
    const pos = i + 1;
    let strongVal = 'NULL';
    let origVal = "'---'";
    
    if (bestG && bestScore > 200) {
      usedGreekIndices.add(bestJ);
      strongVal = `'${bestG.strong}'`;
      const origText = bestG.lemma || bestG.greek;
      origVal = `'${origText.replace(/'/g, "''")}'`;
    }
    
    const arVal = `'${raw.replace(/'/g, "''")}'`;
    sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${v.verse_id}', ${pos}, ${pos}, ${arVal}, ${origVal}, 'greek', ${strongVal}, 1);\n`;
    totalInserted++;
  }
}

sql += '\nCOMMIT;\n';

fs.writeFileSync('scripts/insert_nt_final_130.sql', sql, 'utf8');
console.log(`Generated SQL for ${totalInserted} words across all remaining 130 NT verses.`);

console.log('Executing SQL against mobile/assets/bible_study.db...');
execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Successfully inserted final NT mappings!');

const remainingCheck = q("SELECT count(*) as unmapped_nt FROM verses WHERE book_id >= 40 AND id NOT IN (SELECT DISTINCT verse_id FROM word_mappings);");
console.log('Remaining unmapped NT verses:', remainingCheck[0].unmapped_nt);
