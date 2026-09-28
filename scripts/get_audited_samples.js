const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function getSamples() {
  // Fetch sample verified OT (Hebrew H...) entries
  const resOT = await fetch(SUPABASE_URL + '/rest/v1/strongs_ar_translations?is_verified=eq.true&strongs_id=like.H*&limit=3', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const otEntries = await resOT.json();

  // Fetch sample verified NT (Greek G...) entries
  const resNT = await fetch(SUPABASE_URL + '/rest/v1/strongs_ar_translations?is_verified=eq.true&strongs_id=like.G*&limit=3', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const ntEntries = await resNT.json();

  console.log('=== OT SAMPLES ===');
  for (const e of otEntries) {
    const resEn = await fetch(SUPABASE_URL + '/rest/v1/strongs_entries?strongs_id=eq.' + e.strongs_id, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });
    const enList = await resEn.json();
    const en = enList[0] || {};
    console.log(`\nID: ${e.strongs_id} | Word: ${en.original_word} | Pronunciation: ${e.pronunciation_ar}`);
    console.log(`Definition: ${e.definition_ar}`);
    console.log(`Notes: ${e.notes_ar}`);
  }

  console.log('\n=== NT SAMPLES ===');
  for (const e of ntEntries) {
    const resEn = await fetch(SUPABASE_URL + '/rest/v1/strongs_entries?strongs_id=eq.' + e.strongs_id, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });
    const enList = await resEn.json();
    const en = enList[0] || {};
    console.log(`\nID: ${e.strongs_id} | Word: ${en.original_word} | Pronunciation: ${e.pronunciation_ar}`);
    console.log(`Definition: ${e.definition_ar}`);
    console.log(`Notes: ${e.notes_ar}`);
  }
}
getSamples();
