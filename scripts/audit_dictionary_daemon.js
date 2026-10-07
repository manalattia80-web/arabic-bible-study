
const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
const GEMINI_KEY = process.env.GEMINI_KEY;

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
    let promptText = `You are an expert bilingual biblical lexicographer and conservative dispensational theologian. Review these Strong's entries and provide rich, clear, and deeply accurate Arabic dictionary definitions with full Arabic diacritics (تشكيل كامل).

All theological, spiritual, and doctrinal commentary MUST strictly adhere to Conservative Dispensational Theology (الفكر التفسيري واللاهوتي التدبيري المحافظ - Conservative Dispensational Hermeneutics), maintaining a consistent literal-grammatical-historical interpretation of Scripture, explicit distinctions between Israel and the Church, unconditional biblical covenants, and conservative evangelical doctrine.

CRITICAL TERMINOLOGY RULE: Always use the biblical name "أورشليم" (Urshalim) for Jerusalem. NEVER use "القدس". All references to Jerusalem in Arabic MUST strictly be "أورشليم".

CRITICAL LANGUAGE & ELOQUENCE RULE: The Arabic text MUST be written in natural, fluent, elegant, and crystal-clear classical Arabic prose (لغة عربية فصيحة، سلسة، عذبة، ومفهومة جداً بدون تعقيد). DO NOT write literal or awkward translations of English phrases. Express root meanings, biblical context, and theological dimensions in clean, smooth, and natural Arabic sentences that are crisp, articulate, and effortless to read.

For each entry, you MUST provide a comprehensive explanation in Arabic covering:
1. المعنى المعجمي الأصلي للجذر (The root/lemma original dictionary meaning).
2. المعنى حسب التصريف والسياق الكتابي (The specific contextual and inflected meanings as the word is translated and used across Biblical passages, e.g. how it functions in different inflections/grammatical forms).
3. الأبعاد اللاهوتية والروحية (Theological, spiritual, and doctrinal significance in Scripture strictly aligned with Conservative Dispensational Theology - الفكر التدبيري المحافظ).

Entries to audit:
`;
    entries.forEach(e => {
        promptText += `ID: ${e.strongs_id}\n`;
        promptText += `Original Word: ${e.original_word}\n`;
        promptText += `English Definition: ${e.definition_en}\n`;
        promptText += `KJV Usage: ${e.kjv_usage}\n\n`;
    });

    promptText += `Return ONLY a valid JSON array of objects. Format EXACTLY like this:
[{"id": "H123", "pronunciation_ar": "نطق الكلمة باللغة العربية مع التشكيل الكامل", "definition_ar": "شرح تفصيلي باللغة العربية يشمل: (1) المعنى الأصلي للجذر، (2) المعنى حسب التصريف والسياق الكتابي في أسفار الكتاب المقدس، (3) البعد اللاهوتي والروحي بحسب الفكر التدبيري المحافظ", "notes_ar": "توزيع واستخدامات الكلمة في الكتاب المقدس مترجمة إلى العربية بوضوح"}]
`;

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
    
    let retries = 30;
    while(retries > 0) {
        let lastErr = null;
        for (const model of models) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
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

                if (response.ok) {
                    const data = await response.json();
                    const textOutput = data.candidates[0].content.parts[0].text;
                    return JSON.parse(textOutput);
                } else {
                    lastErr = await response.text();
                }
            } catch (e) {
                lastErr = e.message;
            }
        }
        console.error(`All models failed: ${lastErr?.slice(0, 100)}. Waiting 30s...`);
        retries--;
        await sleep(30000);
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
