const fs = require('fs');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return res && res.trim() ? JSON.parse(res) : [];
}

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

// Test on 2 Samuel 12:21 and Genesis 24:5
const sampleVerses = q(`
  SELECT id, book_id, chapter_num, verse_num, text_avd_ar, text_original 
  FROM verses 
  WHERE (book_id = 10 AND chapter_num = 12 AND verse_num = 21)
     OR (book_id = 1 AND chapter_num = 24 AND verse_num = 5);
`);

const PREFIXES = ['وال', 'فال', 'بال', 'كال', 'لل', 'و', 'ف', 'ب', 'ل', 'ك', 'س', 'ال'];
const SUFFIXES = ['هما', 'هم', 'هن', 'كما', 'كم', 'كن', 'نا', 'ني', 'ها', 'ه', 'ي', 'ك', 'ات', 'ان', 'ين', 'ون', 'وا', 'تم', 'تن', 'ت', 'ة'];

function getStems(raw) {
  const parts = raw.split(/[:«»\(\)\[\]"'\-—–]/).filter(Boolean);
  const set = new Set();
  
  for (const part of (parts.length ? parts : [raw])) {
    const cl = cleanWord(part);
    if (!cl) continue;
    const nm = normalizeArabic(cl);
    set.add(cl);
    set.add(nm);
    
    for (const suf of SUFFIXES) {
      if (nm.endsWith(suf) && nm.length > suf.length + 2) {
        const s = nm.slice(0, -suf.length);
        set.add(s);
        for (const pref of PREFIXES) {
          if (s.startsWith(pref) && s.length > pref.length + 2) {
            set.add(s.slice(pref.length));
          }
        }
      }
    }
    
    for (const pref of PREFIXES) {
      if (nm.startsWith(pref) && nm.length > pref.length + 2) {
        const s = nm.slice(pref.length);
        set.add(s);
        for (const suf of SUFFIXES) {
          if (s.endsWith(suf) && s.length > suf.length + 2) {
            set.add(s.slice(0, -suf.length));
          }
        }
      }
    }
  }
  
  return Array.from(set);
}

for (const v of sampleVerses) {
  console.log(`\nTesting ${v.book_id === 1 ? 'Gen' : '2Sam'} ${v.chapter_num}:${v.verse_num}`);
  const arTokens = v.text_avd_ar.split(/\s+/).filter(Boolean);
  const rawHebrewWords = stripHebrew(v.text_original).split(/\s+/).filter(Boolean);
  
  for (let i = 0; i < arTokens.length; i++) {
    const raw = arTokens[i];
    const cl = cleanWord(raw);
    const nm = normalizeArabic(cl);
    const stems = getStems(raw);
    
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
      for (const stem of stems) {
        if (normDict.has(stem)) {
          for (const item of normDict.get(stem)) {
            candidates.push({ sid: item.sid, cnt: item.cnt, score: 800 + item.cnt * 3 });
          }
          if (candidates.length > 0) break;
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
    
    console.log(`  ${i+1}. ${raw} -> ${best ? `${best.lemma} (${best.sid})` : '---'}`);
  }
}
