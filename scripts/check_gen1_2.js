const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function checkGen1_2() {
  const resV = await fetch(SUPABASE_URL + '/rest/v1/verses?book_id=eq.1&chapter_num=eq.1&verse_num=eq.2', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const verses = await resV.json();
  console.log('Verse Gen 1:2 ID:', verses[0]?.id);

  if (verses.length > 0) {
    const resM = await fetch(SUPABASE_URL + '/rest/v1/word_mappings?verse_id=eq.' + verses[0].id + '&order=ar_word_position.asc', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });
    const mappings = await resM.json();
    console.log('Mappings count:', mappings.length);
    mappings.forEach(m => {
      console.log(`Pos ${m.ar_word_position}: ar="${m.ar_word}", orig="${m.orig_word}", strongs="${m.strongs_id}"`);
    });
  }
}
checkGen1_2();
