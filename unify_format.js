const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function updateAll() {
  console.log("Fetching all strongs_entries...");
  const strongsMap = {};
  let offsetDict = 0;
  while(true) {
    const dictReq = await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/strongs_entries?select=strongs_id,original_word&limit=1000&offset=${offsetDict}`, {headers: {apikey: API_KEY}});
    const dict = await dictReq.json();
    if (!dict || dict.length === 0) break;
    for (let d of dict) strongsMap[d.strongs_id] = d.original_word;
    offsetDict += 1000;
  }
  console.log(`Loaded ${Object.keys(strongsMap).length} strongs entries.`);

  // To avoid patching 14,000 times, let's just get the distinct strongs_id from word_mappings
  console.log("Fetching word_mappings to find unique strongs_id...");
  let offset = 0;
  const uniqueStrongs = new Set();
  
  while(true) {
    const req = await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?select=strongs_id&limit=1000&offset=${offset}`, {headers: {apikey: API_KEY}});
    const rows = await req.json();
    if (!rows || rows.length === 0) break;
    for (let r of rows) {
      if (r.strongs_id && r.strongs_id !== 'H0' && r.strongs_id !== 'G0') {
        uniqueStrongs.add(r.strongs_id);
      }
    }
    offset += 1000;
  }
  
  const toUpdate = Array.from(uniqueStrongs).slice(12250);
  console.log(`Found ${uniqueStrongs.size} unique strongs, processing remaining ${toUpdate.length}...`);

  console.log("Starting batch PATCH updates...");
  let count = 0;
  for (let sid of toUpdate) {
    const word = strongsMap[sid];
    if (!word) {
      console.log(`Warning: ${sid} not found in strongs_entries`);
      continue;
    }
    
    // Update all occurrences of this strongs_id
    const res = await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?strongs_id=eq.${sid}`, {
      method: 'PATCH',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        orig_word: word,
        orig_morphology: null,
        transliteration_ar: null,
        transliteration_lat: null
      })
    });
    
    if (!res.ok) {
      console.error(`Failed to patch ${sid}: ${await res.text()}`);
    }
    
    count++;
    if (count % 50 === 0) console.log(`Updated ${count} / ${toUpdate.length}...`);
  }
  
  // Finally, update H0 and G0 to '---'
  console.log("Updating H0/null...");
  await fetch(`https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/word_mappings?strongs_id=is.null`, {
    method: 'PATCH',
    headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ orig_word: '---', orig_morphology: null, transliteration_ar: null, transliteration_lat: null })
  });

  console.log("Done unifying format!");
}

updateAll().catch(console.error);
