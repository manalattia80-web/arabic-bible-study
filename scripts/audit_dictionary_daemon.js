
const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
const GEMINI_KEY = 'AQ.Ab8RN6I0iKzZWyqCYBb4GB1xUErrZVwF7TIRmAPh7XWF5kLZeQ';

const BATCH_SIZE = 5; // Smaller batch size to prevent hitting output token limits
const REQUEST_DELAY_MS = 6000; // Wait 6 seconds between requests (10 reqs per minute to stay safely below 15 RPM limit)

// Sleep helper
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
          'Prefer': 'return=representation',
          ...options.headers
        }
      });
      if (!res.ok) throw new Error(`Supabase Error ${res.status}: ${await res.text()}`);
      if (options.method !== 'PATCH' && options.method !== 'POST' && res.status !== 204) {
         const text = await res.text();
         return text ? JSON.parse(text) : null;
      }
      return null;
    } catch(err) {
      retries--;
      console.error(`Supabase fetch error: ${err.message}. Retries left: ${retries}`);
      if (retries === 0) throw err;
      await sleep(10000); // 10s backoff for db
    }
  }
}

async function askGemini(entries) {
    let promptText = `You are a bilingual biblical lexicographer. Review these Strong's entries and fix the Arabic translation.
Provide accurate Arabic translations for the biblical dictionary terms. Keep definitions concise but theological.

`;
    entries.forEach(e => {
        promptText += `ID: ${e.strongs_id}\n`;
        promptText += `Original Word: ${e.original_word}\n`;
        promptText += `English Definition: ${e.definition_en}\n`;
        promptText += `KJV Usage: ${e.kjv_usage}\n\n`;
    });
    promptText += `Return ONLY a valid JSON array of objects. Format EXACTLY like this:
[{"id": "H123", "pronunciation_ar": "accurate transliteration in arabic characters with tashkeel", "definition_ar": "theological meaning in Arabic", "notes_ar": "kjv usage translated to arabic"}]
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_KEY}`;
    
    let retries = 30;
    while(retries > 0) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: 'application/json'
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                if (response.status === 429) {
                    console.log(`Gemini Rate Limit (429). Waiting 60 seconds...`);
                    await sleep(60000);
                    retries--;
                    continue;
                }
                throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            const textOutput = data.candidates[0].content.parts[0].text;
            return JSON.parse(textOutput);
        } catch (e) {
            console.error(`Gemini Fetch Error: ${e.message}`);
            retries--;
            await sleep(30000);
        }
    }
    throw new Error('Failed to get response from Gemini after 30 retries.');
}

async function runDaemon() {
    console.log('Starting Audit Dictionary Daemon...');
    
    while (true) {
        try {
            // Fetch unverified batch
            const batchAr = await fetchSupabase(`/rest/v1/strongs_ar_translations?is_verified=eq.false&limit=${BATCH_SIZE}`);
            
            if (!batchAr || batchAr.length === 0) {
                console.log('ALL DICTIONARY ENTRIES VERIFIED! Exiting daemon.');
                break;
            }

            console.log(`Processing batch of ${batchAr.length} entries...`);

            const ids = batchAr.map(b => `"${b.strongs_id}"`).join(',');
            const batchEn = await fetchSupabase(`/rest/v1/strongs_entries?strongs_id=in.(${ids})&select=strongs_id,original_word,definition_en,kjv_usage`);

            const entriesToAudit = batchAr.map(ar => {
                const en = batchEn.find(e => e.strongs_id === ar.strongs_id) || {};
                return {
                    strongs_id: ar.strongs_id,
                    id: ar.id,
                    original_word: en.original_word || '',
                    definition_en: en.definition_en || '',
                    kjv_usage: en.kjv_usage || ''
                };
            });

            const auditedList = await askGemini(entriesToAudit);

            for (const audited of auditedList) {
                const targetId = audited.id;
                await fetchSupabase(`/rest/v1/strongs_ar_translations?strongs_id=eq.${targetId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        pronunciation_ar: audited.pronunciation_ar || '',
                        definition_ar: audited.definition_ar || '',
                        notes_ar: audited.notes_ar || '',
                        is_verified: true
                    })
                });
                console.log(`[v] Verified & Updated: ${targetId}`);
            }

            console.log(`Waiting ${REQUEST_DELAY_MS/1000}s to respect rate limits...`);
            await sleep(REQUEST_DELAY_MS);

        } catch (err) {
            console.error(`FATAL ERROR IN LOOP: ${err.message}`);
            console.log(`Sleeping for 2 minutes before resuming...`);
            await sleep(120000);
        }
    }
}

runDaemon();
