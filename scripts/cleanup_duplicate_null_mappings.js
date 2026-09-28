const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function fetchSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  let retries = 5;
  while(retries > 0) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          ...options.headers
        }
      });
      if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`);
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch(err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function runCleanup() {
  console.log('Starting DB Cleanup of duplicate null/dummy mappings...');
  
  let totalDeleted = 0;

  while (true) {
    // Fetch batch of null strongs_id mappings
    const nullRows = await fetchSupabase(`/rest/v1/word_mappings?strongs_id=is.null&select=id,verse_id,ar_word&limit=500`);
    if (!nullRows || nullRows.length === 0) break;

    console.log(`Analyzing batch of ${nullRows.length} null mapping rows...`);
    
    const verseIds = Array.from(new Set(nullRows.map(r => r.verse_id)));
    const validMap = new Set();

    // Fetch valid rows in small chunks of 20 verse_ids to avoid header overflow
    for (let i = 0; i < verseIds.length; i += 20) {
      const chunk = verseIds.slice(i, i + 20).map(id => `"${id}"`).join(',');
      const validRows = await fetchSupabase(`/rest/v1/word_mappings?verse_id=in.(${chunk})&strongs_id=not.is.null&select=verse_id,ar_word`);
      if (validRows) {
        validRows.forEach(v => validMap.add(`${v.verse_id}_${v.ar_word.trim()}`));
      }
    }

    const idsToDelete = [];
    for (const nr of nullRows) {
      const key = `${nr.verse_id}_${nr.ar_word.trim()}`;
      if (validMap.has(key)) {
        idsToDelete.push(nr.id);
      }
    }

    if (idsToDelete.length === 0) {
      console.log('No redundant duplicate null rows found in this batch.');
      break; // No progress, stop loop
    }

    console.log(`Deleting ${idsToDelete.length} redundant duplicate null rows...`);
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const chunk = idsToDelete.slice(i, i + 50).map(id => `"${id}"`).join(',');
      await fetchSupabase(`/rest/v1/word_mappings?id=in.(${chunk})`, { method: 'DELETE' });
    }
    totalDeleted += idsToDelete.length;
    console.log(`Total deleted so far: ${totalDeleted}`);
  }

  console.log(`\nCleanup Finished! Total duplicate null rows deleted: ${totalDeleted}`);
}

runCleanup().catch(console.error);
