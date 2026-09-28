const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function testConcordanceSearch(q) {
  // Strip diacritics & normalize query
  const cleanQ = q.replace(/[\u064B-\u065F\u0670]/g, '').trim();

  // 1. Search word_mappings for ar_word
  const resMap = await fetch(SUPABASE_URL + '/rest/v1/word_mappings?ar_word=ilike.*' + encodeURIComponent(cleanQ) + '*&select=verse_id&limit=1000', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const mappings = await resMap.json();
  const verseIdsFromMap = Array.from(new Set(mappings.map(m => m.verse_id)));

  // 2. Search verses for text_avd_ar ilike
  const resDirect = await fetch(SUPABASE_URL + '/rest/v1/verses?text_avd_ar=ilike.*' + encodeURIComponent(q) + '*&select=id&limit=1000', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const directVerses = await resDirect.json();
  const verseIdsFromDirect = directVerses.map(v => v.id);

  // Combine unique verse IDs
  const allVerseIds = Array.from(new Set([...verseIdsFromMap, ...verseIdsFromDirect]));
  console.log(`Search '${q}': Total Unique Verses Found = ${allVerseIds.length}`);

  if (allVerseIds.length > 0) {
    const chunk = allVerseIds.slice(0, 10).map(id => `"${id}"`).join(',');
    const resV = await fetch(SUPABASE_URL + '/rest/v1/verses?id=in.(' + chunk + ')&select=id,chapter_num,verse_num,text_avd_ar,books!inner(name_ar)&order=book_id.asc,chapter_num.asc,verse_num.asc', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });
    const verses = await resV.json();
    console.log('Sample Results:');
    verses.forEach((v, i) => {
      console.log(`${i+1}. ${v.books?.name_ar} ${v.chapter_num}:${v.verse_num} -> ${v.text_avd_ar}`);
    });
  }
}

async function main() {
  await testConcordanceSearch('يسوع');
  await testConcordanceSearch('محبة');
  await testConcordanceSearch('الله');
}
main();
