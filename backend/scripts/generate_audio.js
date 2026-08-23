import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const AUDIO_DIR = path.join(process.cwd(), 'data', 'audio_files');

if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("Fetching Strong's entries without audio_url...");
    
    // Fetch entries without audio
    const { data: entries, error } = await supabase
        .from('strongs_entries')
        .select(`strongs_id, original_word, language, audio_url`)
        .is('audio_url', null)
        .limit(10); // Batch of 10 for testing. Change to larger limit later.

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    if (!entries || entries.length === 0) {
        console.log("No entries found that need audio.");
        return;
    }

    console.log(`Found ${entries.length} entries to process...`);

    for (const entry of entries) {
        try {
            console.log(`Generating audio for ${entry.strongs_id} (${entry.original_word})...`);
            
            const langCode = entry.language === 'hebrew' ? 'iw' : 'el'; 
            
            // Build the standard Google Translate TTS URL
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(entry.original_word)}&tl=${langCode}&client=tw-ob`;

            const res = await fetch(url);
            
            if (!res.ok) {
                console.error(`Failed to download audio for ${entry.strongs_id} - HTTP ${res.status}`);
                continue;
            }

            const buffer = await res.arrayBuffer();
            const filePath = path.join(AUDIO_DIR, `${entry.strongs_id}.mp3`);
            
            fs.writeFileSync(filePath, Buffer.from(buffer));
            console.log(`-> Saved to ${filePath}`);

            const { error: updateError } = await supabase
                .from('strongs_entries')
                .update({ audio_url: `/audio/${entry.strongs_id}.mp3` })
                .eq('strongs_id', entry.strongs_id);

            if (updateError) {
                console.error(`Failed to update ${entry.strongs_id} in DB:`, updateError);
            }
            
            await delay(1500); // Rate limiting pause

        } catch (e) {
            console.error(`Error processing ${entry.strongs_id}:`, e);
        }
    }

    console.log("Audio Batch complete!");
}

run();
