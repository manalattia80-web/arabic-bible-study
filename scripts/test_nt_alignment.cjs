const fs = require('fs');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
  return res && res.trim() ? JSON.parse(res) : [];
}

console.log('Loading GNT Scrivener...');
const gnt = JSON.parse(fs.readFileSync('scripts/data/gnt_scrivener.json', 'utf8'));

console.log('Exporting Greek dictionary to temp file...');
execFileSync(sqlite, [db, '.mode tabs', '.output scripts/temp_greek_dict.tsv', "SELECT ar_word, strongs_id, count(*) FROM word_mappings WHERE orig_word_lang = 'greek' AND strongs_id LIKE 'G%' GROUP BY ar_word, strongs_id;"]);

const dictLines = fs.readFileSync('scripts/temp_greek_dict.tsv', 'utf8').split('\n');

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\p{P}]/gu, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .trim();
}

const exactDict = new Map();
const normDict = new Map();

for (const line of dictLines) {
  if (!line || !line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const w = parts[0].trim();
  const s = parts[1].trim();
  const cnt = parseInt(parts[2].trim(), 10) || 1;
  
  const key1 = `${w}|${s}`;
  exactDict.set(key1, (exactDict.get(key1) || 0) + cnt);
  
  const n = normalizeArabic(w);
  const key2 = `${n}|${s}`;
  normDict.set(key2, (normDict.get(key2) || 0) + cnt);
}

console.log(`Loaded ${exactDict.size} exact pairs and ${normDict.size} normalized pairs.`);

// Test on Matt 28:1
const vRow = q("SELECT id, text_avd_ar FROM verses WHERE book_id = 40 AND chapter_num = 28 AND verse_num = 1;")[0];
const gVerse = gnt.find(v => v.book_name === 'Matthew' && v.chapter === 28 && v.verse === 1);

console.log('\nArabic text:', vRow.text_avd_ar);
console.log('Greek words:', gVerse.words.map(w => `${w.greek} [G${w.strong}]`).join(' '));

const arWords = vRow.text_avd_ar.split(/\s+/).filter(Boolean);

console.log('\nMatching words:');
const matched = [];
for (let i = 0; i < arWords.length; i++) {
  const rawWord = arWords[i];
  const cleanWord = rawWord.replace(/[\.,;:!?«»\(\)\[\]]/g, '').trim();
  const normWord = normalizeArabic(cleanWord);
  
  let bestCandidate = null;
  let bestScore = -999999;
  let bestGIdx = -1;
  
  for (let j = 0; j < gVerse.words.length; j++) {
    const gw = gVerse.words[j];
    const sId = 'G' + gw.strong;
    
    let score = 0;
    const exactKey = `${cleanWord}|${sId}`;
    if (exactDict.has(exactKey)) {
      score = 2000 + exactDict.get(exactKey) * 10;
    } else {
      const normKey = `${normWord}|${sId}`;
      if (normDict.has(normKey)) {
        score = 1200 + normDict.get(normKey) * 5;
      }
    }
    
    if (score > 0) {
      // Relative position alignment penalty
      const posDiff = Math.abs((i / arWords.length) - (j / gVerse.words.length));
      score -= (posDiff * 400);
      
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = gw;
        bestGIdx = j;
      }
    }
  }
  
  matched.push({
    pos: i + 1,
    ar: rawWord,
    clean: cleanWord,
    greek: bestCandidate ? bestCandidate.greek : '---',
    lemma: bestCandidate ? bestCandidate.dictionary_form : '---',
    strongs: bestCandidate ? 'G' + bestCandidate.strong : '',
    score: bestScore
  });
}

console.table(matched);
