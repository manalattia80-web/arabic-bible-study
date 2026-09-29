const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmd3dwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function fetchSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(`Supabase Error ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function check() {
  try {
    // 1. Total entries
    const entries = await fetchSupabase('/rest/v1/strongs_entries?select=strongs_id');
    const totalEntries = entries.length;

    // 2. Verified Arabic translations
    const verified = await fetchSupabase('/rest/v1/strongs_ar_translations?is_verified=eq.true&select=strongs_id');
    const verifiedCount = verified.length;

    // 3. Hebrew vs Greek verified
    const hebrewVerified = verified.filter(v => v.strongs_id.startsWith('H')).length;
    const greekVerified = verified.filter(v => v.strongs_id.startsWith('G')).length;

    // 4. Sample verified entries
    const samples = await fetchSupabase('/rest/v1/strongs_ar_translations?is_verified=eq.true&limit=3');

    console.log(`\n=== DICTIONARY AUDIT PROGRESS ===`);
    console.log(`Total Strong's Entries: ${totalEntries}`);
    console.log(`Audited & Verified Entries: ${verifiedCount} / ${totalEntries} (${((verifiedCount / totalEntries) * 100).toFixed(1)}%)`);
    console.log(`  - Hebrew (Old Testament): ${hebrewVerified} / 8674`);
    console.log(`  - Greek (New Testament): ${greekVerified} / 5624`);
    if (samples && samples.length > 0) {
      console.log(`\nSample Verified Entry (${samples[0].strongs_id}):`);
      console.log(samples[0].definition_ar);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
