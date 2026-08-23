import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Please add GEMINI_API_KEY to your .env file!");
    process.exit(1);
}

async function fetchFromGemini(prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
        })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("Fetching Strong's entries without Arabic pronunciation...");
    
    // We only fetch words that have an Arabic translation record but lack pronunciation_ar
    const { data: entries, error } = await supabase
        .from('strongs_ar_translations')
        .select(`
            id,
            strongs_id,
            pronunciation_ar,
            strongs_entries ( original_word, language, transliteration, pronunciation )
        `)
        .is('pronunciation_ar', null)
        .limit(10); // Batch of 10 for testing. Change to larger number for production

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    if (!entries || entries.length === 0) {
        console.log("No entries found that need Arabic pronunciation update.");
        return;
    }

    console.log(`Found ${entries.length} entries to process...`);

    for (const entry of entries) {
        const wordInfo = entry.strongs_entries;
        const originalWord = wordInfo.original_word;
        const language = wordInfo.language;
        // Even if transliteration is empty, we provide the original word
        const phonetics = wordInfo.pronunciation || wordInfo.transliteration || "";

        const prompt = `You are a linguistic expert in Biblical ${language} and Arabic.
Given the Biblical ${language} word "${originalWord}" (phonetic/transliteration: "${phonetics}"), write ONLY the phonetic pronunciation in Arabic letters. Do not add any explanation, translation, or extra text. Just the Arabic transliteration of how to pronounce the word.
Example: if the word is "רֵאשִׁית" (reshiyth), output: ريشيث`;

        try {
            console.log(`Generating for ${entry.strongs_id} (${originalWord})...`);
            let arabicPronunciation = await fetchFromGemini(prompt);
            
            // Cleanup any markdown or quotes
            arabicPronunciation = arabicPronunciation.replace(/`/g, '').replace(/"/g, '').trim();

            console.log(`-> ${arabicPronunciation}`);

            const { error: updateError } = await supabase
                .from('strongs_ar_translations')
                .update({ pronunciation_ar: arabicPronunciation })
                .eq('strongs_id', entry.strongs_id);

            if (updateError) {
                console.error(`Failed to update ${entry.strongs_id} in DB:`, updateError);
            }
            
            // Rate limiting pause (Gemini free tier has limits, adjust as needed)
            await delay(2000); 

        } catch (e) {
            console.error(`Error processing ${entry.strongs_id}:`, e);
        }
    }

    console.log("Batch complete!");
}

run();
