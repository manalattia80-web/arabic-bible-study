const { spawn } = require('child_process');
const path = require('path');

const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function main() {
  const vRes = await fetch(`${SUPABASE_URL}/rest/v1/verses?book_id=eq.40&chapter_num=eq.1&verse_num=eq.1&select=id,book_id,chapter_num,verse_num,text_avd_ar,text_original`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const verses = await vRes.json();
  console.log("Verse Matthew 1:1 ->", verses[0]);

  if (verses.length > 0) {
    const verseId = verses[0].id;
    const mRes = await fetch(`${SUPABASE_URL}/rest/v1/word_mappings?verse_id=eq.${verseId}&select=id,verse_id,ar_word,orig_word,strongs_id&order=ar_word_position.asc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const mappings = await mRes.json();
    console.log(`Word Mappings for verse ${verseId} (Count: ${mappings.length}):`);
    console.dir(mappings, { depth: null });
  }

  // Check OT Genesis 1:1 as well
  const vOtRes = await fetch(`${SUPABASE_URL}/rest/v1/verses?book_id=eq.1&chapter_num=eq.1&verse_num=eq.1&select=id,book_id,chapter_num,verse_num,text_avd_ar,text_original`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const otVerses = await vOtRes.json();
  console.log("Verse Genesis 1:1 ->", otVerses[0]);

  if (otVerses.length > 0) {
    const verseId = otVerses[0].id;
    const mRes = await fetch(`${SUPABASE_URL}/rest/v1/word_mappings?verse_id=eq.${verseId}&select=id,verse_id,ar_word,orig_word,strongs_id&order=ar_word_position.asc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const mappings = await mRes.json();
    console.log(`Word Mappings for Genesis 1:1 (Count: ${mappings.length}):`);
    console.dir(mappings, { depth: null });
  }
}

main().catch(console.error);
