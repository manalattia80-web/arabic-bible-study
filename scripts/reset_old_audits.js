const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function resetOldAudits() {
  console.log('Resetting is_verified flag for entries created with old prompt...');
  const res = await fetch(SUPABASE_URL + '/rest/v1/strongs_ar_translations?updated_at=lt.2026-09-27T00:00:00.000Z', {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ is_verified: false })
  });
  if (res.ok) {
    console.log('Successfully queued all old entries for full contextual re-audit!');
  } else {
    console.error('Error resetting old audits:', await res.text());
  }
}

resetOldAudits();
