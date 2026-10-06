const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function fetchWithRetry(url, options = {}) {
  let retries = 5;
  while (retries > 0) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return res;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function main() {
  console.log("=== EXECUTING BULK MANUSCRIPT TEXT RESTORATION IN SUPABASE ===");

  for (let bookId = 1; bookId <= 66; bookId++) {
    const res = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/verses?book_id=eq.${bookId}&select=id,text_manuscript`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const verses = await res.json();
    const withManuscript = verses.filter(v => v.text_manuscript && v.text_manuscript.trim().length > 0);
    
    if (withManuscript.length === 0) continue;

    console.log(`Updating Book ${bookId} (${withManuscript.length} verses)...`);
    
    for (const v of withManuscript) {
      await fetchWithRetry(`${SUPABASE_URL}/rest/v1/verses?id=eq.${v.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ text_original: v.text_manuscript })
      });
    }
  }

  console.log("=== BULK RESTORATION COMPLETE ===");
}

main().catch(console.error);
