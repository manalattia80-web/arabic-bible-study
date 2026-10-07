const fs = require('fs');
const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function req(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  let retries = 5;
  while (retries > 0) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function run() {
  console.log('=== STARTING PSALMS RECONSTRUCTION & VAN DYCK ALIGNMENT ===');
  console.log('Fetching all 2,461 verses in Psalms (book_id = 19)...');
  
  let offset = 0;
  const limit = 1000;
  let allVerses = [];

  while (true) {
    const verses = await req(`/rest/v1/verses?book_id=eq.19&select=id,chapter_num,verse_num,text_avd_ar,text_original&limit=${limit}&offset=${offset}&order=chapter_num.asc,verse_num.asc`);
    if (!verses || verses.length === 0) break;
    allVerses.push(...verses);
    offset += limit;
    if (verses.length < limit) break;
  }

  console.log(`Loaded ${allVerses.length} verses in Psalms.`);

  let updatedCount = 0;
  const concurrency = 20;

  for (let i = 0; i < allVerses.length; i += concurrency) {
    const chunk = allVerses.slice(i, i + concurrency);

    await Promise.all(chunk.map(async (v) => {
      const mappings = await req(`/rest/v1/word_mappings?verse_id=eq.${v.id}&select=orig_word&order=ar_word_position.asc`);
      if (mappings && mappings.length > 0) {
        const alignedHebrew = mappings.map(m => m.orig_word).filter(w => w && w !== '---').join(' ');
        if (alignedHebrew && alignedHebrew !== v.text_original) {
          await req(`/rest/v1/verses?id=eq.${v.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              text_original: alignedHebrew,
              text_manuscript: alignedHebrew
            })
          });
          updatedCount++;
        }
      }
    }));

    if ((i + concurrency) % 200 === 0 || i + concurrency >= allVerses.length) {
      console.log(`Processed ${Math.min(i + concurrency, allVerses.length)} / ${allVerses.length} verses. Updated so far: ${updatedCount}`);
    }
  }

  console.log(`\n=== PSALMS ALIGNMENT COMPLETED ===`);
  console.log(`Total verses updated in Psalms: ${updatedCount}`);
}

run();
