const fs = require('fs');

const dictLines = fs.readFileSync('scripts/temp_greek_dict.tsv', 'utf8').split('\n');

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\p{P}\u060C\u061B\u061F«»]/gu, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0649/g, '\u064A')
    .trim();
}

function cleanArabicPunctuation(text) {
  if (!text) return '';
  return text.replace(/[\.,;:!?«»\(\)\[\]\u060C\u061B\u061F"'\-—–]/gu, '').trim();
}

const exactDict = new Map();
const normDict = new Map();

for (const line of dictLines) {
  if (!line || !line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const w = cleanArabicPunctuation(parts[0]);
  const s = parts[1].trim();
  const cnt = parseInt(parts[2].trim(), 10) || 1;
  
  const key1 = `${w}|${s}`;
  exactDict.set(key1, (exactDict.get(key1) || 0) + cnt);
  
  const n = normalizeArabic(w);
  const key2 = `${n}|${s}`;
  normDict.set(key2, (normDict.get(key2) || 0) + cnt);
}

console.log(`Loaded ${exactDict.size} exact and ${normDict.size} norm dictionary entries.`);

const l23 = JSON.parse(fs.readFileSync('scripts/luke23_data.json', 'utf8'));

let totalWords = 0;
let matchedWords = 0;

for (const v of l23) {
  for (let i = 0; i < v.ar_tokens.length; i++) {
    totalWords++;
    const rawWord = v.ar_tokens[i];
    const cleanWord = cleanArabicPunctuation(rawWord);
    const normWord = normalizeArabic(cleanWord);
    
    let best = null;
    let bestScore = -999999;
    
    for (let j = 0; j < v.greek_words.length; j++) {
      const gw = v.greek_words[j];
      const sId = gw.strong;
      
      let score = 0;
      if (exactDict.has(`${cleanWord}|${sId}`)) {
        score = 2000 + exactDict.get(`${cleanWord}|${sId}`) * 10;
      } else if (normDict.has(`${normWord}|${sId}`)) {
        score = 1200 + normDict.get(`${normWord}|${sId}`) * 5;
      } else {
        // Try stripping common Arabic conjunctions/prepositions
        for (const prefix of ['و', 'ف', 'ب', 'ل', 'ك', 'وال', 'فال', 'كال', 'بال', 'لل']) {
          if (cleanWord.startsWith(prefix) && cleanWord.length > prefix.length + 1) {
            const stripped = cleanWord.slice(prefix.length);
            if (exactDict.has(`${stripped}|${sId}`)) {
              score = 1000 + exactDict.get(`${stripped}|${sId}`) * 5;
              break;
            }
            const strippedNorm = normalizeArabic(stripped);
            if (normDict.has(`${strippedNorm}|${sId}`)) {
              score = 800 + normDict.get(`${strippedNorm}|${sId}`) * 3;
              break;
            }
          }
        }
      }
      
      if (score > 0) {
        const posDiff = Math.abs((i / v.ar_tokens.length) - (j / v.greek_words.length));
        score -= (posDiff * 500);
        
        if (score > bestScore) {
          bestScore = score;
          best = gw;
        }
      }
    }
    
    if (best) {
      matchedWords++;
    }
  }
}

console.log(`Luke 23 match rate: ${matchedWords} / ${totalWords} (${(matchedWords / totalWords * 100).toFixed(1)}%)`);
