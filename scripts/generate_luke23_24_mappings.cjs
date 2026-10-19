const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Loading dictionary for Luke 23 & 24 alignment...');
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

// Additional common biblical mapping overrides for NT particles and roots
const manualMappings = {
  'يهيج': 'G383',
  'ذكر': 'G1056', // Galilean context
  'سلطنة': 'G1849',
  'أرسله': 'G375',
  'زمان': 'G2425',
  'لسماعه': 'G191',
  'وترجى': 'G1679',
  'والكتبة': 'G1122',
  'المصلوبين': 'G4717',
  'الفردوس': 'G3857',
  'قبر': 'G3419',
  'القبر': 'G3419',
  'كتان': 'G4616',
  'حنوطا': 'G737',
  'أطيابا': 'G737',
  'فجر': 'G2020',
  'عمواس': 'G1695',
  'كليوباس': 'G2810',
  'برك': 'G2127',
  'وكسر': 'G2806',
  'أورشليم': 'G2419',
  'الجليل': 'G1056'
};

function alignChapter(chapterNum, dataFilePath) {
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
  const results = [];
  
  for (const v of data) {
    const verseWords = [];
    const usedGreekIndices = new Set();
    
    // First pass: Match strong content words
    for (let i = 0; i < v.ar_tokens.length; i++) {
      const raw = v.ar_tokens[i];
      const cl = cleanWord(raw);
      const nm = normalizeArabic(cl);
      
      let bestG = null;
      let bestScore = -999999;
      let bestJ = -1;
      
      // Check manual overrides first
      if (manualMappings[nm]) {
        const targetSid = manualMappings[nm];
        const gCandidate = v.greek_words.find((gw, j) => !usedGreekIndices.has(j) && gw.strong === targetSid);
        if (gCandidate) {
          bestG = gCandidate;
          bestJ = v.greek_words.indexOf(gCandidate);
          bestScore = 5000;
        }
      }
      
      if (!bestG) {
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
      }
      
      if (bestG && bestScore > 200) {
        usedGreekIndices.add(bestJ);
        verseWords.push({
          pos: i + 1,
          ar: raw,
          orig: bestG.lemma || bestG.greek,
          strong: bestG.strong
        });
      } else {
        verseWords.push({
          pos: i + 1,
          ar: raw,
          orig: '---',
          strong: ''
        });
      }
    }
    
    results.push({
      verse_num: v.verse_num,
      words: verseWords
    });
  }
  
  return results;
}

console.log('Aligning Luke 23...');
const luke23 = alignChapter(23, 'scripts/luke23_data.json');
console.log('Aligning Luke 24...');
const luke24 = alignChapter(24, 'scripts/luke24_data.json');

// Generate SQL
let sql = 'BEGIN TRANSACTION;\n\n';
sql += `DELETE FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 42 AND chapter_num IN (23, 24));\n\n`;

let totalInserted = 0;

for (const chData of [{ ch: 23, data: luke23 }, { ch: 24, data: luke24 }]) {
  for (const v of chData.data) {
    const verseId = `11111111-0000-0000-0042-0000000${chData.ch}${String(v.verse_num).padStart(3, '0')}`;
    for (const w of v.words) {
      const rowId = crypto.randomUUID();
      const strongVal = w.strong ? `'${w.strong}'` : 'NULL';
      const origVal = `'${w.orig.replace(/'/g, "''")}'`;
      const arVal = `'${w.ar.replace(/'/g, "''")}'`;
      
      sql += `INSERT INTO word_mappings (id, verse_id, ar_word_position, orig_word_position, ar_word, orig_word, orig_word_lang, strongs_id, is_verified) VALUES ('${rowId}', '${verseId}', ${w.pos}, ${w.pos}, ${arVal}, ${origVal}, 'greek', ${strongVal}, 1);\n`;
      totalInserted++;
    }
  }
}

sql += '\nCOMMIT;\n';

fs.writeFileSync('scripts/insert_luke23_24.sql', sql, 'utf8');
console.log(`Generated SQL for ${totalInserted} words across Luke 23 and 24.`);

execFileSync(sqlite, [db], { input: sql, encoding: 'utf8' });
console.log('Successfully inserted Luke 23 and 24 word mappings into mobile/assets/bible_study.db!');

const ch23Count = q("SELECT count(*) as count, count(DISTINCT verse_id) as verses FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 23);")[0];
const ch24Count = q("SELECT count(*) as count, count(DISTINCT verse_id) as verses FROM word_mappings WHERE verse_id IN (SELECT id FROM verses WHERE book_id = 42 AND chapter_num = 24);")[0];
console.log('Luke 23 verification:', ch23Count);
console.log('Luke 24 verification:', ch24Count);
