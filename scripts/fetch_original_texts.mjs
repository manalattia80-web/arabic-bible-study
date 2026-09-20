import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const OT_BOOKS = 39;
const NT_BOOKS = 66;

// Total chapters per book
const bookChapters = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4,
  28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOriginalTexts() {
  console.log('Starting to fetch original texts...');
  let updatedCount = 0;

  for (let bookId = 1; bookId <= NT_BOOKS; bookId++) {
    const translation = bookId <= OT_BOOKS ? 'WLC' : 'SBLGNT';
    const totalChapters = bookChapters[bookId - 1];
    
    for (let chapter = 1; chapter <= totalChapters; chapter++) {
      console.log(`Fetching ${translation} Book ${bookId} Chapter ${chapter}...`);
      try {
        const res = await fetch(`https://bolls.life/get-chapter/${translation}/${bookId}/${chapter}/`);
        if (!res.ok) {
          console.error(`Failed to fetch ${bookId}:${chapter} - ${res.statusText}`);
          continue;
        }
        const data = await res.json();
        
        for (const verseData of data) {
          const verseNum = verseData.verse;
          let text = verseData.text;
          
          if (translation === 'SBLGNT') {
            text = text.replace(/<[^>]+>[^<]*<\/[^>]+>/g, '')
                       .replace(/<[^>]+>/g, '')
                       .replace(/[⸀⸁⸂⸃⸄⸅]/g, '')
                       .replace(/\s+/g, ' ')
                       .trim();
          }
          
          const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/verses?book_id=eq.${bookId}&chapter_num=eq.${chapter}&verse_num=eq.${verseNum}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text_manuscript: text })
          });
          
          if (!updateRes.ok) {
            console.error(`Error updating verse ${bookId}:${chapter}:${verseNum}:`, await updateRes.text());
          } else {
            updatedCount++;
          }
        }
        
        await sleep(200);
      } catch (err) {
        console.error(`Exception on ${bookId}:${chapter}`, err);
      }
    }
  }
  
  console.log(`Finished! Updated ${updatedCount} verses.`);
}

fetchOriginalTexts();
