const fs = require('fs');

const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
const GEMINI_KEY = process.env.GEMINI_KEY;

// Fetch with json
async function fetchSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  let retries = 20;
  while(retries > 0) {
    try {
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
    } catch(err) {
      retries--;
      console.error(`Supabase fetch error: ${err.message}. Retries left: ${retries}`);
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 10000));
    }
  }
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
  return await fetchSupabase(`/rest/v1/verses?book_id=eq.${bookId}&chapter_num=eq.${chapterNum}&order=verse_num.asc&select=id,chapter_num,verse_num,text_avd_ar,text_original`);
}

async function mapChapter(bookId, chapterNum, bookName) {
  const verses = await getChapterVerses(bookId, chapterNum);
  if (verses.length === 0) {
    return 'skipped';
  }

  console.log(`\n--- Starting ${bookName} Chapter ${chapterNum} ---`);

  const toInsert = [];
  const chunkSize = 5;
  for (let i = 0; i < verses.length; i += chunkSize) {
    const chunkVerses = verses.slice(i, i + chunkSize);
    const promptVerses = chunkVerses.map(v => `Verse ${v.verse_num}: ${v.text_avd_ar}`).join('\n');
    const systemPrompt = `You are an expert in Biblical Hebrew/Aramaic and Arabic translations (Van Dyck Arabic Bible).
Map each Arabic word in these ${bookName} verses to its corresponding Hebrew/Aramaic Strong's number.
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
        const models = [
          'gemini-3.5-flash-lite',
          'gemini-3-flash-preview',
          'gemini-3.1-flash-lite',
          'gemini-3.6-flash',
          'gemini-3.8-flash',
          'gemini-3.7-flash',
          'gemini-3.5-flash',
          'gemini-flash-latest'
        ];
        let response = null;
        let lastErr = null;
        for (const model of models) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } })
            });
            if (res.ok) {
              response = res;
              console.log(`Successfully called model: ${model}`);
              break;
            } else {
              lastErr = await res.text();
            }
          } catch (e) {
            lastErr = e.message;
          }
        }
        if (!response) throw new Error(`Gemini API Error across all models: ${lastErr}`);
        
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text.trim();
        
        aiMappings = JSON.parse(text);
        break; // Success
      } catch (err) {
        console.log("ACTUAL ERROR:", err.message);
        const isQuota = err.message && (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429'));
        const is503 = err.message && err.message.includes('503');
        if (isQuota || is503) {
          console.log(`Model quota/busy error. Waiting 30s before trying again...`);
          await new Promise(r => setTimeout(r, 30000));
        } else {
          retries--;
        }
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

    const vMappings = aiMappings.filter(m => parseInt(m.verse) === parseInt(v.verse_num));
    const validStrongsWords = new Set(vMappings.filter(m => m.strongs && m.strongs !== "H0" && m.strongs !== "G0").map(m => m.word?.trim()));

    const seenVerseWords = new Set();
    let wordPosition = 1;
    for (const m of vMappings) {
        const wordClean = (m.word || '').trim();
        let sid = (m.strongs === "H0" || m.strongs === "G0") ? null : m.strongs;
        
        // Skip H0 dummy entries if this word has a valid Strong's mapping or was already mapped
        if (!sid && validStrongsWords.has(wordClean)) continue;
        if (seenVerseWords.has(wordClean + '_' + sid)) continue;
        seenVerseWords.add(wordClean + '_' + sid);

        if (sid) {
            sid = sid.replace(/^(H|G)0+([1-9])/, '$1$2');
            if (!strongsDict[sid]) sid = null;
        }
        const actualHebrewWord = sid ? strongsDict[sid] : '---';
        
        toInsert.push({
            verse_id: v.id || null,
            ar_word: wordClean,
            strongs_id: sid || null,
            ar_word_position: wordPosition || 1,
            orig_word_position: wordPosition || 1,
            orig_word: actualHebrewWord || '',
            orig_word_lang: 'hebrew',
            is_verified: true
        });
        wordPosition++;
    }
    await new Promise(r => setTimeout(r, 1000)); // Short wait between chunks
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
  return 'done';
}

const books = [
  {"id":1,"name":"Genesis","chs":50},
  {"id":2,"name":"Exodus","chs":40},
  {"id":3,"name":"Leviticus","chs":27},
  {"id":4,"name":"Numbers","chs":36},
  {"id":5,"name":"Deuteronomy","chs":34},
  {"id":6,"name":"Joshua","chs":24},
  {"id":7,"name":"Judges","chs":21},
  {"id":8,"name":"Ruth","chs":4},
  {"id":9,"name":"1 Samuel","chs":31},
  {"id":10,"name":"2 Samuel","chs":24},
  {"id":11,"name":"1 Kings","chs":22},
  {"id":12,"name":"2 Kings","chs":25},
  {"id":13,"name":"1 Chronicles","chs":29},
  {"id":14,"name":"2 Chronicles","chs":36},
  {"id":15,"name":"Ezra","chs":10},
  {"id":16,"name":"Nehemiah","chs":13},
  {"id":17,"name":"Esther","chs":10},
  {"id":18,"name":"Job","chs":42},
  {"id":19,"name":"Psalms","chs":150},
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
  
  for (const b of books) {
    console.log('=== ' + b.name.toUpperCase() + ' ===');
    for (let ch = 1; ch <= b.chs; ch++) {
      const res = await mapChapter(b.id, ch, b.name);
      if (res !== 'skipped') await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  console.log("ALL OT BOOKS FINISHED!");
}

main().catch(console.error);
