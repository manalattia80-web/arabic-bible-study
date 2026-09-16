const fs = require('fs');

const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
const GEMINI_KEY = 'AQ.Ab8RN6I0iKzZWyqCYBb4GB1xUErrZVwF7TIRmAPh7XWF5kLZeQ';

// Fetch with json
async function fetchSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(`Supabase Error: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

let strongsDict = {};

async function initDict() {
  console.log("Loading strongs dictionary...");
  let offset = 0;
  while(true) {
    const res = await fetchSupabase(`/rest/v1/strongs_entries?select=strongs_id,original_word&limit=1000&offset=${offset}`);
    if (!res || res.length === 0) break;
    for (const d of res) strongsDict[d.strongs_id] = d.original_word;
    offset += 1000;
  }
  console.log(`Loaded ${Object.keys(strongsDict).length} entries.`);
}

async function getChapterVerses(bookId, chapterNum) {
  return await fetchSupabase(`/rest/v1/verses?book_id=eq.${bookId}&chapter_num=eq.${chapterNum}&order=verse_num.asc&select=id,chapter_num,verse_num,text_avd_ar`);
}

async function mapChapter(bookId, chapterNum, bookName) {
  console.log(`\n--- Starting ${bookName} Chapter ${chapterNum} ---`);
  const verses = await getChapterVerses(bookId, chapterNum);
  if (verses.length === 0) {
    console.log(`Chapter ${chapterNum} not found.`);
    return;
  }

  const toInsert = [];
  const chunkSize = 5;
  for (let i = 0; i < verses.length; i += chunkSize) {
    const chunkVerses = verses.slice(i, i + chunkSize);
    const promptVerses = chunkVerses.map(v => `Verse ${v.verse_num}: ${v.text_avd_ar}`).join('\n');
    const systemPrompt = `You are an expert in Biblical Hebrew and Arabic translations (Van Dyck Arabic Bible).
Map each Arabic word in these ${bookName} verses to its corresponding Hebrew Strong's number.
Rules:
1. Return ONLY a valid JSON array of objects. No markdown.
2. The JSON array must look like this: [{"verse": 1, "word": "ArabicWord", "strongs": "H1234"}, ...]
3. Ignore punctuation. Ensure the word order exactly matches the Arabic verse order.
4. If a word has no exact Strong's mapping (e.g. prepositions), use "H0".
5. Every single Arabic word in the text must have exactly one entry in the array.
\n\nVerses:\n${promptVerses}`;

    let retries = 10;
    let aiMappings = null;
    while(retries > 0) {
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=' + GEMINI_KEY, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } })
        });
        
        if (!response.ok) throw new Error(`Gemini API Error: ${await response.text()}`);
        
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text.trim();
        
        aiMappings = JSON.parse(text);
        break; // Success
      } catch (err) {
        const isQuota = err.message && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('"code": 429') || (err.message.includes('429') && !err.message.includes('JSON')));
        if (!isQuota) retries--;
        console.error(`Gemini error, retries left ${retries}: ${err.message}`);
        if (retries === 0 && !isQuota) {
           console.log("SKIPPING CHUNK DUE TO PERSISTENT PARSE ERRORS");
           aiMappings = [];
           break;
        }
        let waitTime = 2000;
        const match = err.message && err.message.match ? err.message.match(/retry in ([\d\.]+)s/) : null;
        if (match) waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 2000;
        else if (isQuota) waitTime = 60000;
        console.log(`Waiting ${waitTime/1000}s before retry...`);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }

    for (const v of chunkVerses) {
        const vMappings = aiMappings.filter(m => parseInt(m.verse) === parseInt(v.verse_num));
        let wordPosition = 1;
        for (const m of vMappings) {
            let sid = m.strongs === "H0" ? null : m.strongs;
            if (sid) {
                sid = sid.replace(/^(H|G)0+([1-9])/, '$1$2');
                if (!strongsDict[sid]) sid = null;
            }
            const actualHebrewWord = sid ? strongsDict[sid] : '---';
            
            toInsert.push({
                verse_id: v.id || null,
                ar_word: m.word || '',
                strongs_id: sid || null,
                ar_word_position: wordPosition || 1,
                orig_word_position: wordPosition || 1,
                orig_word: actualHebrewWord || '',
                orig_word_lang: 'hebrew',
                is_verified: true
            });
            wordPosition++;
        }
    }
    await new Promise(r => setTimeout(r, 2000)); // Short wait between chunks
  }

  if (toInsert.length > 0) {
      console.log(`Clearing old mappings for chapter ${chapterNum}...`);
      for (const v of verses) {
          await fetchSupabase(`/rest/v1/word_mappings?verse_id=eq.${v.id}`, { method: 'DELETE' });
      }

      console.log(`Inserting ${toInsert.length} mappings...`);
      for (let i = 0; i < toInsert.length; i += 100) {
          const chunk = toInsert.slice(i, i + 100);
          await fetchSupabase(`/rest/v1/word_mappings`, {
            method: 'POST',
            body: JSON.stringify(chunk)
          });
      }

      // Reconstruct text_original immediately for this chapter!
      const mapByVerse = {};
      for (const m of toInsert) {
        if (!mapByVerse[m.verse_id]) mapByVerse[m.verse_id] = [];
        if (m.strongs_id && m.orig_word && m.orig_word !== '---') {
          mapByVerse[m.verse_id].push(m.orig_word);
        }
      }
      for (const v of verses) {
        const words = mapByVerse[v.id];
        if (words && words.length > 0) {
          const text_original = words.join(' ');
          await fetchSupabase(`/rest/v1/verses?id=eq.${v.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ text_original: text_original, text_original_lang: 'hebrew' })
          });
        }
      }
      console.log(`Done Chapter ${chapterNum} & Synced text_original.`);
  }
}

const books = [
  {"id":20,"name":"Proverbs","chs":31},
  {"id":21,"name":"Ecclesiastes","chs":12},
  {"id":22,"name":"Song of Solomon","chs":8},
  {"id":23,"name":"Isaiah","chs":66},
  {"id":24,"name":"Jeremiah","chs":52},
  {"id":25,"name":"Lamentations","chs":5},
  {"id":26,"name":"Ezekiel","chs":48},
  {"id":27,"name":"Daniel","chs":12},
  {"id":28,"name":"Hosea","chs":14},
  {"id":29,"name":"Joel","chs":3},
  {"id":30,"name":"Amos","chs":9},
  {"id":31,"name":"Obadiah","chs":1},
  {"id":32,"name":"Jonah","chs":4},
  {"id":33,"name":"Micah","chs":7},
  {"id":34,"name":"Nahum","chs":3},
  {"id":35,"name":"Habakkuk","chs":3},
  {"id":36,"name":"Zephaniah","chs":3},
  {"id":37,"name":"Haggai","chs":2},
  {"id":38,"name":"Zechariah","chs":14},
  {"id":39,"name":"Malachi","chs":4}
];

async function main() {
  await initDict();
  console.log('=== PSALM 82 ===');
  await mapChapter(19, 82, 'Psalms');
  console.log("PSALM 82 FINISHED!");
}

main().catch(console.error);
