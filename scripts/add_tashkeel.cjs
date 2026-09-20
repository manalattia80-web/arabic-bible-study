const fs = require('fs');

const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function fetchSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  let retries = 5;
  while(retries > 0) {
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
      if (!res.ok) throw new Error(await res.text());
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch(err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function main() {
  console.log('Fetching books...');
  const books = await fetchSupabase('/rest/v1/books?select=id,chapter_count&order=id.asc');
  
  for (const b of books) {
    console.log(`Processing Book ${b.id}...`);
    for (let ch = 1; ch <= b.chapter_count; ch++) {
      try {
        const bollsRes = await fetch(`https://bolls.life/get-chapter/SVD/${b.id}/${ch}/`);
        if (!bollsRes.ok) {
           console.log(`Failed bolls Book ${b.id} Ch ${ch}`);
           continue;
        }
        const bollsData = await bollsRes.json();
        
        for (const v of bollsData) {
           const verseNum = v.verse;
           const text = v.text.trim();
           await fetchSupabase(`/rest/v1/verses?book_id=eq.${b.id}&chapter_num=eq.${ch}&verse_num=eq.${verseNum}`, {
             method: 'PATCH',
             body: JSON.stringify({ text_avd_ar: text })
           });
        }
      } catch(e) {
        console.error(`Error Book ${b.id} Ch ${ch}: `, e.message);
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }
  console.log('DONE!');
}

main();
