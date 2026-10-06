const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function main() {
  console.log("=== PURGING UNVERIFIED AUTO-GENERATED WORD MAPPINGS FROM SUPABASE ===");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/word_mappings?is_verified=eq.false`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    }
  });

  if (!res.ok) {
    console.error("Error purging unverified mappings:", await res.text());
  } else {
    const deleted = await res.json();
    console.log(`Successfully purged ${deleted.length} unverified word mappings from database.`);
  }

  console.log("=== PURGE COMPLETE ===");
}

main().catch(console.error);
