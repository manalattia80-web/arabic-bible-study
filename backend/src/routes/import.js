export default async function importRoutes(fastify, options) {
  fastify.get('/import-bible', async (request, reply) => {
    // Start background task so we don't timeout the HTTP request
    importBibleTask(fastify.supabase).catch(err => console.error('Import failed:', err));
    return { status: 'Import started! Check Railway logs for progress.' };
  });
}

async function importBibleTask(supabase) {
  console.log('📖 Starting Full Bible Import...');
  const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ar_svd.json';
  
  try {
    const response = await fetch(BIBLE_JSON_URL);
    const bibleData = await response.json();
    console.log(`✅ Downloaded ${bibleData.length} books.`);

    for (let bookIndex = 0; bookIndex < bibleData.length; bookIndex++) {
      const bookData = bibleData[bookIndex];
      const bookId = bookIndex + 1; 
      console.log(`📚 Processing Book ID ${bookId}...`);
      
      const chapters = bookData.chapters;
      for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
        const chapterNum = chapterIndex + 1;
        const verses = chapters[chapterIndex];
        
        const chapterUuid = `00000000-0000-0000-${bookId.toString().padStart(4, '0')}-${chapterNum.toString().padStart(12, '0')}`;
        const { error: chErr } = await supabase.from('chapters').upsert({
          id: chapterUuid, book_id: bookId, number: chapterNum
        }, { onConflict: 'id' });
        
        if (chErr) {
            console.error(`Error inserting chapter:`, chErr);
            continue;
        }

        const versesToInsert = verses.map((verseText, verseIndex) => {
          const verseNum = verseIndex + 1;
          const verseUuid = `11111111-0000-0000-${bookId.toString().padStart(4, '0')}-${(chapterNum * 1000 + verseNum).toString().padStart(12, '0')}`;
          return {
            id: verseUuid, chapter_id: chapterUuid, book_id: bookId,
            chapter_num: chapterNum, verse_num: verseNum,
            text_avd_ar: verseText, text_original: null,
            text_original_lang: bookId <= 39 ? 'hebrew' : 'greek'
          };
        });

        const { error: vErr } = await supabase.from('verses').upsert(versesToInsert, { onConflict: 'id' });
        if (vErr) {
            console.error(`Error inserting verses:`, vErr);
        }
      }
      console.log(`✅ Finished Book ${bookId}`);
    }
    console.log('🎉 IMPORT COMPLETE! All 66 books added.');
  } catch (error) {
    console.error('❌ Failed to import Bible:', error);
  }
}
