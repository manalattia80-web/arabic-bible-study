const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function main() {
  console.log("=== EXECUTING BULK MANUSCRIPT TEXT RESTORATION IN SUPABASE ===");

  for (let bookId = 1; bookId <= 66; bookId++) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/verses?book_id=eq.${bookId}&select=id,text_manuscript`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const verses = await res.json();
    const withManuscript = verses.filter(v => v.text_manuscript && v.text_manuscript.trim().length > 0);
    
    if (withManuscript.length === 0) continue;

    console.log(`Updating Book ${bookId} (${withManuscript.length} verses)...`);
    
    // Batch update using PostgREST PATCH in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < withManuscript.length; i += chunkSize) {
      const chunk = withManuscript.slice(i, i + chunkSize);
      await Promise.all(chunk.map(v => 
        fetch(`${SUPABASE_URL}/rest/v1/verses?id=eq.${v.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ text_original: v.text_manuscript })
        })
      ));
    }
  }

  console.log("=== BULK RESTORATION COMPLETE ===");
}

main().catch(console.error);
