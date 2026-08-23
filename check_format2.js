const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function check() {
  const genVerse = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/verses?book_id=eq.1&verse_num=eq.1', {headers: {apikey: API_KEY}}).then(r=>r.json());
  const genMaps = await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?verse_id=eq.${genVerse[0].id}&order=ar_word_position.asc&limit=2`, {headers: {apikey: API_KEY}}).then(r=>r.json());
  
  const judeVerse = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/verses?book_id=eq.65&verse_num=eq.1', {headers: {apikey: API_KEY}}).then(r=>r.json());
  const judeMaps = await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?verse_id=eq.${judeVerse[0].id}&order=ar_word_position.asc&limit=2`, {headers: {apikey: API_KEY}}).then(r=>r.json());

  console.log("GENESIS:");
  console.dir(genMaps, {depth: null});
  console.log("\nJUDE:");
  console.dir(judeMaps, {depth: null});
}
check();
