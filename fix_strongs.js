const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function main() {
  const r = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/strongs_entries', {
    method: 'POST',
    headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { strongs_id: 'G2920', original_word: 'krisis', language: 'greek', transliteration: 'krisis', definition_en: 'judgment' }
    ])
  });
  console.log(await r.text());
}
main();
