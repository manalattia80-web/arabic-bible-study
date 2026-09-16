const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
const baseUrl = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1';

async function req(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${apikey}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(baseUrl + url, opts);
  if (method === 'GET' && res.ok) return res.json();
  if (!res.ok) console.error(await res.text());
}

async function run() {
  const bookId = 8; // Ruth
  console.log('Book ' + bookId);
  const chapters = await req(`/chapters?book_id=eq.${bookId}&select=id,number`);
  if (!chapters || chapters.length === 0) return;
  
  for (const chapter of chapters) {
    const verses = await req(`/verses?chapter_id=eq.${chapter.id}&select=id,verse_num,text_original`);
    if (!verses || verses.length === 0) continue;
    
    for (const verse of verses) {
      if (verse.text_original && verse.text_original.length > 0) continue; // Already processed!

      const mappings = await req(`/word_mappings?verse_id=eq.${verse.id}&select=orig_word&order=orig_word_position.asc`);
      
      if (mappings && mappings.length > 0) {
        const text = mappings.map(m => m.orig_word).filter(w => w && w !== '---').join(' ');
        if (text) {
          await req(`/verses?id=eq.${verse.id}`, 'PATCH', { text_original: text });
        }
      }
    }
    console.log('Ch ' + chapter.number + ' done');
  }
  console.log('All done');
}
run();
