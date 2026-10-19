const fs = require('fs');
const { execFileSync } = require('child_process');

const sqlite = 'sqlite_dist/sqlite3.exe';
const db = 'mobile/assets/bible_study.db';

function q(sql) {
  const res = execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' });
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

console.log(`Loaded ${exactDict.size} exact and ${normDict.size} norm Hebrew dictionary pairs.`);

// Load Genesis 35 verses
const gen35 = q("SELECT id, verse_num, text_avd_ar, text_original FROM verses WHERE book_id = 1 AND chapter_num = 35 ORDER BY verse_num;");

console.log(`Genesis 35 has ${gen35.length} verses.`);

// Also load strongs_entries for Hebrew lemmas
const strongsMap = new Map();
const sRows = q("SELECT strongs_id, original_word FROM strongs_entries WHERE strongs_id LIKE 'H%';");
for (const r of sRows) {
  strongsMap.set(r.strongs_id, r.original_word);
}
console.log(`Loaded ${strongsMap.size} Hebrew Strong's lemmas.`);

// Test matching on Gen 35:1
const v1 = gen35[0];
const tokens = v1.text_avd_ar.split(/\s+/).filter(Boolean);
console.log('\n--- Gen 35:1 Matching ---');
console.log('Arabic text:', v1.text_avd_ar);
console.log('Hebrew text:', v1.text_original);

for (let i = 0; i < tokens.length; i++) {
  const raw = tokens[i];
  const cl = cleanWord(raw);
  const nm = normalizeArabic(cl);
  
  let candidates = [];
  for (const [key, cnt] of exactDict) {
    if (key.startsWith(cl + '|')) {
      const sid = key.split('|')[1];
      candidates.push({ sid, cnt, type: 'exact' });
    }
  }
  if (candidates.length === 0) {
    for (const [key, cnt] of normDict) {
      if (key.startsWith(nm + '|')) {
        const sid = key.split('|')[1];
        candidates.push({ sid, cnt, type: 'norm' });
      }
    }
  }
  
  candidates.sort((a, b) => b.cnt - a.cnt);
  const best = candidates[0];
  const lemma = best ? strongsMap.get(best.sid) : '---';
  console.log(`${i+1}. "${raw}" -> ${best ? `${best.sid} (${lemma}) [${best.cnt}x]` : '---'}`);
}
