const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function main() {
  const versesRes = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/verses?book_id=eq.65', {
    headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
  });
  const verses = await versesRes.json();
  const verseIds = verses.map(v => v.id);
  
  console.log('Deleting existing mappings for Jude...');
  for (let vid of verseIds) {
    await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?verse_id=eq.${vid}`, {
      method: 'DELETE',
      headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
    });
  }
  console.log('Done deleting.');
}
main();
