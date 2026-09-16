const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
const baseUrl = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1';

async function req(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'apikey': apikey, 'Authorization': 'Bearer ' + apikey, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(baseUrl + url, opts);
      if (method === 'GET' && res.ok) return await res.json();
      if (res.ok) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function run() {
  const bookIds = [13, 14, 15, 16];
  for (const bookId of bookIds) {
    console.log('Reconstructing Book ' + bookId);
    const chapters = await req('/chapters?book_id=eq.' + bookId + '&select=id,number');
    if (!chapters) continue;
    for (const chapter of chapters) {
      process.stdout.write(' ' + chapter.number);
      const verses = await req('/verses?chapter_id=eq.' + chapter.id + '&select=id,verse_num');
      if (!verses || verses.length === 0) continue;
      
      const verseIds = verses.map(v => v.id);
      const mappings = await req('/word_mappings?verse_id=in.(' + verseIds.join(',') + ')&order=ar_word_position.asc&select=verse_id,orig_word,strongs_id');
      if (!mappings || mappings.length === 0) continue;
      
      const mapByVerse = {};
      for (const m of mappings) {
        if (!mapByVerse[m.verse_id]) mapByVerse[m.verse_id] = [];
        if (m.strongs_id && m.orig_word && m.orig_word !== '---') {
          mapByVerse[m.verse_id].push(m.orig_word);
        }
      }
      
      const patchPromises = [];
      for (const verse of verses) {
        const words = mapByVerse[verse.id];
        if (words && words.length > 0) {
          const text_original = words.join(' ');
          patchPromises.push(req('/verses?id=eq.' + verse.id, 'PATCH', { text_original: text_original, text_original_lang: 'hebrew' }));
        }
      }
      await Promise.all(patchPromises);
    }
    console.log('\nBook ' + bookId + ' DONE!');
  }
  console.log('ALL RECONSTRUCTION COMPLETED SUCCESSFULLY!');
}
run();
