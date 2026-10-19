// scripts/audit_engine/arabic_morphology.cjs
// Advanced Arabic Morphological Analyzer for Biblical Alignment

function cleanWord(text) {
  if (!text) return '';
  return text.replace(/[\.,;:!?«»\(\)\[\]\u060C\u061B\u061F"'\-—–]/gu, '').trim();
}

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/gu, '') // strip tashkeel & tatweel
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')   // normalize alef
    .replace(/\u0629/g, '\u0647')                 // ta marbuta -> ha
    .replace(/\u0649/g, '\u064A')                 // alef maqsura -> ya
    .trim();
}

const PREFIXES = [
  'وال', 'فال', 'بال', 'كال', 'لل',
  'و', 'ف', 'ب', 'ل', 'ك', 'س', 'ال'
];

const SUFFIXES = [
  'هما', 'هم', 'هن', 'كما', 'كم', 'كن',
  'نا', 'ني', 'ها', 'ه', 'ي', 'ك',
  'ات', 'ان', 'ين', 'ون', 'وا',
  'تم', 'تن', 'ت', 'ة'
];

function getCandidateStems(raw) {
  const parts = raw.split(/[:«»\(\)\[\]"'\-—–]/).filter(Boolean);
  const candidates = new Set();
  
  for (const part of (parts.length ? parts : [raw])) {
    const cl = cleanWord(part);
    if (!cl) continue;
    const nm = normalizeArabic(cl);
    candidates.add(cl);
    candidates.add(nm);
    
    // Try suffix stripping
    for (const suf of SUFFIXES) {
      if (nm.endsWith(suf) && nm.length > suf.length + 2) {
        const s = nm.slice(0, -suf.length);
        candidates.add(s);
        for (const pref of PREFIXES) {
          if (s.startsWith(pref) && s.length > pref.length + 2) {
            candidates.add(s.slice(pref.length));
          }
        }
      }
    }
    
    // Try prefix stripping
    for (const pref of PREFIXES) {
      if (nm.startsWith(pref) && nm.length > pref.length + 2) {
        const s = nm.slice(pref.length);
        candidates.add(s);
        for (const suf of SUFFIXES) {
          if (s.endsWith(suf) && s.length > suf.length + 2) {
            candidates.add(s.slice(0, -suf.length));
          }
        }
      }
    }
  }
  
  return Array.from(candidates);
}

module.exports = {
  cleanWord,
  normalizeArabic,
  getCandidateStems,
  PREFIXES,
  SUFFIXES
};
