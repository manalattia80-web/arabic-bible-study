import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function importRoutes(fastify, options) {
  fastify.get('/import-bible', async (request, reply) => {
    // Start background task so we don't timeout the HTTP request
    importBibleTask(fastify.supabase).catch(err => console.error('Import failed:', err));
    return { status: 'Import started! Check Railway logs for progress.' };
  });

  fastify.get('/import-strongs', async (request, reply) => {
    try {
      const result = await importStrongsTask(fastify.supabase);
      return { status: 'Success', details: result };
    } catch (err) {
      console.error('Import failed:', err);
      return { status: 'Error', message: err.message, stack: err.stack };
    }
  });

  fastify.get('/import-mappings', async (request, reply) => {
    // Run in background
    importMappingsTask(fastify.supabase).catch(err => console.error('Mappings import failed:', err));
    return { status: 'Mapping alignment started in background! Check Railway logs.' };
  });

  fastify.get('/debug-sqlite', async (request, reply) => {
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbPath = path.join(__dirname, '..', '..', 'data', 'strongs.db');
      const db = new Database(dbPath, { readonly: true });
      
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      
      const schema = {};
      for (const t of tables) {
        schema[t.name] = {
          columns: db.prepare(`PRAGMA table_info(${t.name})`).all(),
          sample: db.prepare(`SELECT * FROM ${t.name} LIMIT 3`).all()
        };
      }
      
      return { status: 'Success', schema };
    } catch (err) {
      return { status: 'Error', message: err.message, stack: err.stack };
    }
  });
}

const BOOK_PREFIXES = [
  "", "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH",
  "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS",
  "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL",
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL",
  "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
];

async function importMappingsTask(supabase) {
  console.log('🤖 Starting Smart Auto-Alignment Task...');
  
  const Database = (await import('better-sqlite3')).default;
  const dbPath = path.join(__dirname, '..', '..', 'data', 'strongs.db');
  const db = new Database(dbPath, { readonly: true });
  
  console.log('✅ Connected to strongs.db');
  
  // 1. Fetch all verses from Supabase
  const { data: verses, error } = await supabase.from('verses').select('id, book_id, chapter_num, verse_num, text_avd_ar, text_original_lang');
  if (error || !verses) throw new Error('Could not fetch verses from Supabase');
  console.log(`✅ Fetched ${verses.length} verses to align.`);

  let totalMapped = 0;
  
  // For each verse, extract words and align
  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];
    const prefix = BOOK_PREFIXES[verse.book_id];
    const legacyVerseId = `${prefix}.${verse.chapter_num}.${verse.verse_num}`;
    
    // Get all Strongs for this verse in legacy DB
    const strongsRows = db.prepare(`SELECT strongId FROM avd_verse_strongs WHERE verseId = ?`).all(legacyVerseId);
    const verseStrongs = strongsRows.map(r => r.strongId);
    
    if (verseStrongs.length === 0) continue;
    
    // Clean and split Arabic text
    // Remove diacritics and punctuation for index matching
    const cleanText = verse.text_avd_ar.replace(/[.,:;«»!؟?]/g, '');
    const words = cleanText.split(/\s+/).filter(w => w.trim().length > 0);
    
    const mappings = [];
    
    // For each word in the verse
    for (let pos = 0; pos < words.length; pos++) {
      const arWord = words[pos];
      
      // Look up this exact word in arabic_strong_index to see if it maps to any of the Strongs in this verse
      // We look for partial surface matches or exact
      const indexRows = db.prepare(`SELECT strongId FROM arabic_strong_index WHERE surface = ?`).all(arWord);
      
      let matchedStrong = null;
      for (const row of indexRows) {
        if (verseStrongs.includes(row.strongId)) {
          matchedStrong = row.strongId;
          break;
        }
      }
      
      // We map it!
      mappings.push({
        verse_id: verse.id,
        ar_word_position: pos + 1,
        orig_word_position: pos + 1, // Assume 1-to-1 sequential for display
        ar_word: arWord,
        orig_word: matchedStrong ? matchedStrong : '---', // Display Strongs ID as placeholder for orig_word if we don't have it
        orig_word_lang: verse.text_original_lang,
        strongs_id: matchedStrong || null,
        is_verified: false
      });
    }
    
    if (mappings.length > 0) {
      const { error: insErr } = await supabase.from('word_mappings').upsert(mappings, { onConflict: 'verse_id, ar_word_position, orig_word_position' });
      if (insErr) {
        console.error(`Error inserting mapping for ${legacyVerseId}:`, insErr);
      } else {
        totalMapped++;
      }
    }
    
    if (i % 1000 === 0) console.log(`🔄 Aligned ${i} verses...`);
  }
  
  console.log(`🎉 Auto-Alignment Complete! Mapped ${totalMapped} verses.`);
}

async function importStrongsTask(supabase) {
  console.log('📖 Starting Strongs Dictionary Import...');
  const dataPath = path.join(__dirname, '..', '..', 'data', 'strongs_arabic.json');
  
  if (!fs.existsSync(dataPath)) {
    throw new Error(`File not found at ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, 'utf8');
  const strongsData = JSON.parse(rawData);
  console.log(`✅ Loaded ${strongsData.length} entries from JSON.`);

  const BATCH_SIZE = 500;
  let processed = 0;
  
  for (let i = 0; i < strongsData.length; i += BATCH_SIZE) {
    const batch = strongsData.slice(i, i + BATCH_SIZE);
    
    const entriesToInsert = batch.map(item => ({
      strongs_id: item.strongId,
      language: item.language.toLowerCase() === 'hebrew' ? 'hebrew' : 'greek',
      original_word: item.originalWord,
      transliteration: item.transliteration || '',
      definition_en: item.root || ''
    }));

    const translationsToInsert = batch.map(item => ({
      strongs_id: item.strongId,
      definition_ar: item.arabicMeaning || item.directArabicWord || '',
      notes_ar: item.directArabicWord || null
    })).filter(t => t.definition_ar);

    const { error: eErr } = await supabase.from('strongs_entries').upsert(entriesToInsert, { onConflict: 'strongs_id' });
    if (eErr) throw new Error(`Error inserting entries batch ${i}: ` + eErr.message);

    if (translationsToInsert.length > 0) {
        const { error: tErr } = await supabase.from('strongs_ar_translations').upsert(translationsToInsert, { onConflict: 'strongs_id' });
        if (tErr) throw new Error(`Error inserting translations batch ${i}: ` + tErr.message);
    }
    
    processed += batch.length;
    console.log(`✅ Processed ${processed} / ${strongsData.length} entries...`);
  }
  
  console.log('🎉 IMPORT COMPLETE! All Strongs definitions added.');
  return `Successfully imported ${processed} Strongs definitions.`;
}

async function importBibleTask(supabase) {
  console.log('📖 Starting Full Bible Import...');
  const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ar_svd.json';
  
  try {
    const response = await fetch(BIBLE_JSON_URL);
    const bibleData = await response.json();
    console.log(`✅ Downloaded ${bibleData.length} books.`);

    // Define book names since they aren't fully detailed in the JSON
    const bookNames = [
      { id: 1, testament: 1, ar: "التكوين", ar_short: "تك", en: "Genesis", en_short: "Gen" },
      { id: 2, testament: 1, ar: "الخروج", ar_short: "خر", en: "Exodus", en_short: "Ex" },
      { id: 3, testament: 1, ar: "اللاويين", ar_short: "لا", en: "Leviticus", en_short: "Lev" },
      { id: 4, testament: 1, ar: "العدد", ar_short: "عد", en: "Numbers", en_short: "Num" },
      { id: 5, testament: 1, ar: "التثنية", ar_short: "تث", en: "Deuteronomy", en_short: "Deut" },
      { id: 6, testament: 1, ar: "يشوع", ar_short: "يش", en: "Joshua", en_short: "Josh" },
      { id: 7, testament: 1, ar: "القضاة", ar_short: "قض", en: "Judges", en_short: "Judg" },
      { id: 8, testament: 1, ar: "راعاث", ar_short: "را", en: "Ruth", en_short: "Ruth" },
      { id: 9, testament: 1, ar: "صموئيل الأول", ar_short: "1صم", en: "1 Samuel", en_short: "1 Sam" },
      { id: 10, testament: 1, ar: "صموئيل الثاني", ar_short: "2صم", en: "2 Samuel", en_short: "2 Sam" },
      { id: 11, testament: 1, ar: "الملوك الأول", ar_short: "1مل", en: "1 Kings", en_short: "1 Kgs" },
      { id: 12, testament: 1, ar: "الملوك الثاني", ar_short: "2مل", en: "2 Kings", en_short: "2 Kgs" },
      { id: 13, testament: 1, ar: "أخبار الأيام الأول", ar_short: "1أخ", en: "1 Chronicles", en_short: "1 Chr" },
      { id: 14, testament: 1, ar: "أخبار الأيام الثاني", ar_short: "2أخ", en: "2 Chronicles", en_short: "2 Chr" },
      { id: 15, testament: 1, ar: "عزرا", ar_short: "عز", en: "Ezra", en_short: "Ezra" },
      { id: 16, testament: 1, ar: "نحميا", ar_short: "نح", en: "Nehemiah", en_short: "Neh" },
      { id: 17, testament: 1, ar: "أستير", ar_short: "أس", en: "Esther", en_short: "Esth" },
      { id: 18, testament: 1, ar: "أيوب", ar_short: "أي", en: "Job", en_short: "Job" },
      { id: 19, testament: 1, ar: "المزامير", ar_short: "مز", en: "Psalms", en_short: "Ps" },
      { id: 20, testament: 1, ar: "الأمثال", ar_short: "أم", en: "Proverbs", en_short: "Prov" },
      { id: 21, testament: 1, ar: "الجامعة", ar_short: "جا", en: "Ecclesiastes", en_short: "Eccl" },
      { id: 22, testament: 1, ar: "نشيد الأنشاد", ar_short: "نش", en: "Song of Solomon", en_short: "Song" },
      { id: 23, testament: 1, ar: "إشعياء", ar_short: "إش", en: "Isaiah", en_short: "Isa" },
      { id: 24, testament: 1, ar: "إرميا", ar_short: "إر", en: "Jeremiah", en_short: "Jer" },
      { id: 25, testament: 1, ar: "مراثي إرميا", ar_short: "مر", en: "Lamentations", en_short: "Lam" },
      { id: 26, testament: 1, ar: "حزقيال", ar_short: "حز", en: "Ezekiel", en_short: "Ezek" },
      { id: 27, testament: 1, ar: "دانيال", ar_short: "دا", en: "Daniel", en_short: "Dan" },
      { id: 28, testament: 1, ar: "هوشع", ar_short: "هو", en: "Hosea", en_short: "Hos" },
      { id: 29, testament: 1, ar: "يوئيل", ar_short: "يؤ", en: "Joel", en_short: "Joel" },
      { id: 30, testament: 1, ar: "عاموس", ar_short: "عا", en: "Amos", en_short: "Amos" },
      { id: 31, testament: 1, ar: "عوبديا", ar_short: "عو", en: "Obadiah", en_short: "Obad" },
      { id: 32, testament: 1, ar: "يونان", ar_short: "يون", en: "Jonah", en_short: "Jonah" },
      { id: 33, testament: 1, ar: "ميخا", ar_short: "مي", en: "Micah", en_short: "Mic" },
      { id: 34, testament: 1, ar: "ناحوم", ar_short: "نا", en: "Nahum", en_short: "Nah" },
      { id: 35, testament: 1, ar: "حبقوق", ar_short: "حب", en: "Habakkuk", en_short: "Hab" },
      { id: 36, testament: 1, ar: "صفنيا", ar_short: "صف", en: "Zephaniah", en_short: "Zeph" },
      { id: 37, testament: 1, ar: "حجي", ar_short: "حج", en: "Haggai", en_short: "Hag" },
      { id: 38, testament: 1, ar: "زكريا", ar_short: "زك", en: "Zechariah", en_short: "Zech" },
      { id: 39, testament: 1, ar: "ملاخي", ar_short: "مل", en: "Malachi", en_short: "Mal" },
      { id: 40, testament: 2, ar: "متى", ar_short: "مت", en: "Matthew", en_short: "Matt" },
      { id: 41, testament: 2, ar: "مرقس", ar_short: "مر", en: "Mark", en_short: "Mark" },
      { id: 42, testament: 2, ar: "لوقا", ar_short: "لو", en: "Luke", en_short: "Luke" },
      { id: 43, testament: 2, ar: "يوحنا", ar_short: "يو", en: "John", en_short: "John" },
      { id: 44, testament: 2, ar: "أعمال الرسل", ar_short: "أع", en: "Acts", en_short: "Acts" },
      { id: 45, testament: 2, ar: "رومية", ar_short: "رو", en: "Romans", en_short: "Rom" },
      { id: 46, testament: 2, ar: "كورنثوس الأولى", ar_short: "1كو", en: "1 Corinthians", en_short: "1 Cor" },
      { id: 47, testament: 2, ar: "كورنثوس الثانية", ar_short: "2كو", en: "2 Corinthians", en_short: "2 Cor" },
      { id: 48, testament: 2, ar: "غلاطية", ar_short: "غل", en: "Galatians", en_short: "Gal" },
      { id: 49, testament: 2, ar: "أفسس", ar_short: "أف", en: "Ephesians", en_short: "Eph" },
      { id: 50, testament: 2, ar: "فيلبي", ar_short: "في", en: "Philippians", en_short: "Phil" },
      { id: 51, testament: 2, ar: "كولوسي", ar_short: "كو", en: "Colossians", en_short: "Col" },
      { id: 52, testament: 2, ar: "تسالونيكي الأولى", ar_short: "1تس", en: "1 Thessalonians", en_short: "1 Thess" },
      { id: 53, testament: 2, ar: "تسالونيكي الثانية", ar_short: "2تس", en: "2 Thessalonians", en_short: "2 Thess" },
      { id: 54, testament: 2, ar: "تيموثاوس الأولى", ar_short: "1تي", en: "1 Timothy", en_short: "1 Tim" },
      { id: 55, testament: 2, ar: "تيموثاوس الثانية", ar_short: "2تي", en: "2 Timothy", en_short: "2 Tim" },
      { id: 56, testament: 2, ar: "تيطس", ar_short: "تي", en: "Titus", en_short: "Titus" },
      { id: 57, testament: 2, ar: "فليمون", ar_short: "فل", en: "Philemon", en_short: "Phlm" },
      { id: 58, testament: 2, ar: "العبرانيين", ar_short: "عب", en: "Hebrews", en_short: "Heb" },
      { id: 59, testament: 2, ar: "يعقوب", ar_short: "يع", en: "James", en_short: "Jas" },
      { id: 60, testament: 2, ar: "بطرس الأولى", ar_short: "1بط", en: "1 Peter", en_short: "1 Pet" },
      { id: 61, testament: 2, ar: "بطرس الثانية", ar_short: "2بط", en: "2 Peter", en_short: "2 Pet" },
      { id: 62, testament: 2, ar: "يوحنا الأولى", ar_short: "1يو", en: "1 John", en_short: "1 John" },
      { id: 63, testament: 2, ar: "يوحنا الثانية", ar_short: "2يو", en: "2 John", en_short: "2 John" },
      { id: 64, testament: 2, ar: "يوحنا الثالثة", ar_short: "3يو", en: "3 John", en_short: "3 John" },
      { id: 65, testament: 2, ar: "يهوذا", ar_short: "يه", en: "Jude", en_short: "Jude" },
      { id: 66, testament: 2, ar: "الرؤيا", ar_short: "رؤ", en: "Revelation", en_short: "Rev" }
    ];

    for (let bookIndex = 0; bookIndex < bibleData.length; bookIndex++) {
      const bookData = bibleData[bookIndex];
      const bookId = bookIndex + 1; 
      const chapters = bookData.chapters;
      
      console.log(`📚 Processing Book ID ${bookId}...`);
      
      // Insert Book
      const meta = bookNames[bookIndex];
      if (meta) {
        const { error: bErr } = await supabase.from('books').upsert({
          id: meta.id,
          testament_id: meta.testament,
          name_ar: meta.ar,
          name_ar_short: meta.ar_short,
          name_en: meta.en,
          name_en_short: meta.en_short,
          chapter_count: chapters.length,
          sort_order: meta.id
        }, { onConflict: 'id' });
        
        if (bErr) console.error('Error inserting book:', bErr);
      }
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
            text_avd_ar: verseText, text_original: '',
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
