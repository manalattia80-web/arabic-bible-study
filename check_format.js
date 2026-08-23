const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function check() {
  // Get one verse from Gen (book_id 1)
  const genVerse = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/verses?book_id=eq.1&limit=1', {headers: {apikey: API_KEY}}).then(r=>r.json());
  
  // Get mappings for Gen
  const genMaps = await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?verse_id=eq.${genVerse[0].id}&order=ar_word_position.asc&limit=5`, {headers: {apikey: API_KEY}}).then(r=>r.json());
  
  // Get one verse from Jude (book_id 65)
  const judeVerse = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/verses?book_id=eq.65&limit=1', {headers: {apikey: API_KEY}}).then(r=>r.json());
  
  // Get mappings for Jude
  const judeMaps = await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?verse_id=eq.${judeVerse[0].id}&order=ar_word_position.asc&limit=5`, {headers: {apikey: API_KEY}}).then(r=>r.json());

  console.log("GENESIS FIRST 5 WORDS:");
  console.log(genMaps.map(m => m.ar_word));
  
  console.log("\nJUDE FIRST 5 WORDS:");
  console.log(judeMaps.map(m => m.ar_word));
}
check();
