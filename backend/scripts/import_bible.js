// backend/scripts/import_bible.js
// ----------------------------------------------------------------------
// Script to import the full Arabic Smith-Van Dyck Bible into Supabase
// ----------------------------------------------------------------------

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using Service Key to bypass RLS policies
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function getKeys() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.log("⚠️  مفتاح الاتصال بقاعدة البيانات غير موجود.");
    console.log("يرجى إدخال البيانات التالية (تجدها في موقع Supabase أو Railway):");
    url = await question("1. الصق رابط SUPABASE_URL هنا واضغط Enter: ");
    key = await question("2. الصق مفتاح SUPABASE_SERVICE_KEY هنا واضغط Enter: ");
  }
  
  rl.close();
  return { url: url.trim(), key: key.trim() };
}

// URL to a reliable open-source JSON of the Arabic Van Dyck Bible
const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ar_svd.json';

async function importBible() {
  const { url, key } = await getKeys();

  if (!url || !key) {
    console.error('❌ خطا: يجب إدخال الرابط والمفتاح.');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log('📖 Starting Full Bible Import...');
  console.log(`⬇️ Downloading Arabic Bible data from GitHub...`);

  try {
    const response = await fetch(BIBLE_JSON_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const bibleData = await response.json();

    console.log(`✅ Downloaded ${bibleData.length} books. Beginning database insertion...`);

    // The JSON is ordered from Genesis to Revelation (Index 0 to 65)
    // Our book IDs in the database correspond exactly to 1 to 66
    for (let bookIndex = 0; bookIndex < bibleData.length; bookIndex++) {
      const bookData = bibleData[bookIndex];
      const bookId = bookIndex + 1; // 1 to 66
      
      console.log(`\n📚 Processing Book ID ${bookId} (${bookData.abbrev.toUpperCase()})...`);
      
      const chapters = bookData.chapters;
      
      for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
        const chapterNum = chapterIndex + 1;
        const verses = chapters[chapterIndex];
        
        // 1. Ensure Chapter exists
        // Generate a deterministic UUID for the chapter so we can reference it
        const chapterUuid = `00000000-0000-0000-${bookId.toString().padStart(4, '0')}-${chapterNum.toString().padStart(12, '0')}`;
        
        const { error: chapterError } = await supabase
          .from('chapters')
          .upsert({
            id: chapterUuid,
            book_id: bookId,
            number: chapterNum
          }, { onConflict: 'id' });

        if (chapterError) {
          console.error(`❌ Error inserting Chapter ${chapterNum}:`, chapterError.message);
          continue;
        }

        // 2. Prepare all verses for this chapter
        const versesToInsert = verses.map((verseText, verseIndex) => {
          const verseNum = verseIndex + 1;
          const verseUuid = `11111111-0000-0000-${bookId.toString().padStart(4, '0')}-${(chapterNum * 1000 + verseNum).toString().padStart(12, '0')}`;
          
          return {
            id: verseUuid,
            chapter_id: chapterUuid,
            book_id: bookId,
            chapter_num: chapterNum,
            verse_num: verseNum,
            text_avd_ar: verseText,
            // Original text and mappings are left null. Admins can add them later via the admin panel!
            text_original: null,
            text_original_lang: bookId <= 39 ? 'hebrew' : 'greek'
          };
        });

        // 3. Batch insert verses
        const { error: verseError } = await supabase
          .from('verses')
          .upsert(versesToInsert, { onConflict: 'id' });

        if (verseError) {
          console.error(`❌ Error inserting verses for Chapter ${chapterNum}:`, verseError.message);
        }
      }
      console.log(`✅ Finished Book ${bookId}`);
    }

    console.log('\n🎉 IMPORT COMPLETE! The entire Arabic Bible is now in your database.');
  } catch (error) {
    console.error('❌ Failed to import Bible:', error);
  }
}

importBible();
