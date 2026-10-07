const fs = require('fs');
const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

const hebToArabicLetter = {
  'ק': 'ق',
  'ש': 'ش',
  'צ': 'ص',
  'ץ': 'ص',
  'ד': 'د',
  'כ': 'ك',
  'ך': 'ك',
  'ב': 'ب',
  'מ': 'م',
  'ם': 'م',
  'נ': 'ن',
  'ן': 'ن',
  'ה': 'ه',
  'ח': 'ح',
  'ع': 'ع',
  'ف': 'ف',
  'ף': 'ف',
  'ר': 'ر',
  'ت': 'ت',
  'ל': 'ل',
  'א': 'أ',
  'ג': 'ج',
  'ז': 'ز',
  'ט': 'ط',
  'י': 'ي'
};

const hebNiqqudToArabic = {
  '\u05B0': '\u0652',
  '\u05B1': '\u064E',
  '\u05B2': '\u064E',
  '\u05B3': '\u064F',
  '\u05B4': '\u0650',
  '\u05B5': '\u064E',
  '\u05B6': '\u064E',
  '\u05B7': '\u064E',
  '\u05B8': '\u064E',
  '\u05B9': '\u064F',
  '\u05BB': '\u064F',
  '\u05BC': '',
  '\u05C1': '',
  '\u05C2': ''
};

const hebRegex = /[\u0590-\u05FF]/;
const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
const arRegex = /[\u0600-\u06FF]/;

function fixWordInArabicText(word) {
  const cleanW = word.replace(/[«»\(\)\[\]\.,;:"]/g, '');
  if (!arRegex.test(cleanW)) return word;
  if (!hebRegex.test(cleanW) && !greekRegex.test(cleanW)) return word;

  let fixed = '';
  for (let ch of word) {
    if (hebToArabicLetter[ch]) {
      fixed += hebToArabicLetter[ch];
    } else if (hebNiqqudToArabic[ch] !== undefined) {
      fixed += hebNiqqudToArabic[ch];
    } else if (ch >= '\u0590' && ch <= '\u05FF') {
      // Ignore
    } else {
      fixed += ch;
    }
  }

  fixed = fixed.replace(/إشرائيل/g, 'إسرائيل');
  fixed = fixed.replace(/يهوده/g, 'يهوذا');
  fixed = fixed.replace(/يهودا/g, 'يهوذا');
  fixed = fixed.replace(/مستمدت/g, 'مستمدة');
  return fixed;
}

function cleanText(text) {
  if (!text) return text;
  const words = text.split(/(\s+)/);
  const cleaned = words.map(w => {
    if (/\s+/.test(w)) return w;
    return fixWordInArabicText(w);
  });
  return cleaned.join('');
}

function cleanPronunciation(pron) {
  if (!pron) return pron;
  if (!arRegex.test(pron) && hebRegex.test(pron)) return pron;
  
  let fixed = '';
  for (let ch of pron) {
    if (hebToArabicLetter[ch]) {
      fixed += hebToArabicLetter[ch];
    } else if (hebNiqqudToArabic[ch] !== undefined) {
      fixed += hebNiqqudToArabic[ch];
    } else if (ch >= '\u0590' && ch <= '\u05FF') {
      // Ignore
    } else {
      fixed += ch;
    }
  }
  return fixed.trim();
}

async function updateRow(id, payload) {
  const url = `${SUPABASE_URL}/rest/v1/strongs_ar_translations?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) console.error(`Failed to update ${id}: ${await res.text()}`);
}

async function runFix() {
  console.log('Starting parallel character mixing remediation on Supabase...');
  let page = 0;
  let pageSize = 1000;
  let totalFixed = 0;
  let fixedSamples = [];

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/strongs_ar_translations?select=id,strongs_id,pronunciation_ar,definition_ar,notes_ar&limit=${pageSize}&offset=${page * pageSize}`;
    const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    const pendingUpdates = [];

    for (const r of rows) {
      let isChanged = false;
      const payload = {};

      if (r.pronunciation_ar) {
        const cleanedPron = cleanPronunciation(r.pronunciation_ar);
        if (cleanedPron !== r.pronunciation_ar) {
          payload.pronunciation_ar = cleanedPron;
          isChanged = true;
        }
      }

      if (r.definition_ar) {
        const cleanedDef = cleanText(r.definition_ar);
        if (cleanedDef !== r.definition_ar) {
          payload.definition_ar = cleanedDef;
          isChanged = true;
        }
      }

      if (r.notes_ar) {
        const cleanedNotes = cleanText(r.notes_ar);
        if (cleanedNotes !== r.notes_ar) {
          payload.notes_ar = cleanedNotes;
          isChanged = true;
        }
      }

      if (isChanged) {
        payload.updated_at = new Date().toISOString();
        pendingUpdates.push({ id: r.id, payload });
        totalFixed++;
        if (fixedSamples.length < 10) {
          fixedSamples.push({
            id: r.strongs_id,
            oldPron: r.pronunciation_ar,
            newPron: payload.pronunciation_ar || r.pronunciation_ar,
            oldDefSnippet: r.definition_ar ? r.definition_ar.substring(0, 80) : '',
            newDefSnippet: payload.definition_ar ? payload.definition_ar.substring(0, 80) : ''
          });
        }
      }
    }

    // Execute batch updates concurrently (chunks of 30)
    const concurrency = 30;
    for (let i = 0; i < pendingUpdates.length; i += concurrency) {
      const chunk = pendingUpdates.slice(i, i + concurrency);
      await Promise.all(chunk.map(u => updateRow(u.id, u.payload)));
    }

    page++;
    console.log(`Processed page ${page} (${page * pageSize} rows). Fixed so far: ${totalFixed}`);
    if (rows.length < pageSize) break;
  }

  console.log(`\n=== REMEDIATION COMPLETE ===`);
  console.log(`Total rows updated in Supabase: ${totalFixed}`);
  console.log('\nSamples of Fixed Entries:');
  fixedSamples.forEach((s, idx) => {
    console.log(`\nSample #${idx + 1} [${s.id}]:`);
    console.log(`  Pronunciation Old: "${s.oldPron}" -> New: "${s.newPron}"`);
    if (s.oldDefSnippet !== s.newDefSnippet) {
      console.log(`  Definition Snippet Old: "${s.oldDefSnippet}"`);
      console.log(`  Definition Snippet New: "${s.newDefSnippet}"`);
    }
  });
}

runFix();
