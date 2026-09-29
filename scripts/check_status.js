const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmd3dwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function check() {
  const r = await fetch(SUPABASE_URL + '/rest/v1/verses?limit=1', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  console.log('Status:', r.status);
  console.log('Body:', await r.text());
}

check();
