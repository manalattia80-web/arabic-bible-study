const fs = require('fs');
const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

const greekFixes = {
  'ἐك': 'ἐκ',
  'و(φέر': 'و(φέρω',
  'و(φορέω': 'و(φορέω',
  'و(λαμβάνω': 'و(λαμβάνω',
  'و(ῥίπτω': 'و(ῥίπτω',
  'و(εἶμι)': 'و(εἶμι)',
  'و(λέγω)': 'و(λέγω'
};

const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
const arRegex = /[\u0600-\u06FF]/;

function fixGreekWord(word) {
  let w = word;
  for (const [bad, good] of Object.entries(greekFixes)) {
    if (w.includes(bad)) {
      w = w.replace(bad, good);
    }
  }
  // If word has Greek character merged with Arabic 'ك' at the end like "ἐك"
  w = w.replace(/(\text{[\u0370-\u03FF\u1F00-\u1FFF]+})ك/g, '$1κ');
  w = w.replace(/ἐك/g, 'ἐκ');
  return w;
}

function cleanText(text) {
  if (!text) return text;
  const words = text.split(/(\s+)/);
  const cleaned = words.map(w => {
    if (/\s+/.test(w)) return w;
    return fixGreekWord(w);
  });
  return cleaned.join('');
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
  console.log('Running Greek character mixing cleanup on Supabase...');
  let page = 0;
  let pageSize = 1000;
  let totalFixed = 0;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/strongs_ar_translations?select=id,strongs_id,definition_ar,notes_ar&limit=${pageSize}&offset=${page * pageSize}`;
    const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    const pendingUpdates = [];

    for (const r of rows) {
      let isChanged = false;
      const payload = {};

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
      }
    }

    const concurrency = 30;
    for (let i = 0; i < pendingUpdates.length; i += concurrency) {
      const chunk = pendingUpdates.slice(i, i + concurrency);
      await Promise.all(chunk.map(u => updateRow(u.id, u.payload)));
    }

    page++;
    if (rows.length < pageSize) break;
  }

  console.log(`Greek cleanup finished. Updated ${totalFixed} rows.`);
}

runFix();
