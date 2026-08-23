const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function run() {
  const dict = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/strongs_entries?select=id,original_word&limit=1', {headers: {apikey: API_KEY}}).then(r=>r.json());
  console.log(dict);
}
run().catch(console.error);
