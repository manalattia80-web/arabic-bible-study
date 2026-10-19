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
  exactDict.set(`${w}|${s}`, (exactDict.get(`${w}|${s}`) || 0) + cnt);
  normDict.set(`${normalizeArabic(w)}|${s}`, (normDict.get(`${normalizeArabic(w)}|${s}`) || 0) + cnt);
}

const l23 = JSON.parse(fs.readFileSync('scripts/luke23_data.json', 'utf8'));

console.log('Sample unmapped words in Luke 23 (verses 1-10):');

for (const v of l23.slice(0, 10)) {
  for (let i = 0; i < v.ar_tokens.length; i++) {
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
    
    if (!best) {
      console.log(`v${v.verse_num}: "${rawWord}" (clean: "${cleanWord}") -> Greek available:`, v.greek_words.map(g => `${g.greek} (${g.strong}: ${g.gloss})`).join(', '));
    }
  }
}
