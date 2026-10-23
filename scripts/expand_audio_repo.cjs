const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoDir = 'C:\\Users\\manal\\.gemini\\antigravity\\scratch\\arabic-bible-study\\audio_repository\\strongs';
const indexFile = 'C:\\Users\\manal\\.gemini\\antigravity\\scratch\\arabic-bible-study\\audio_repository\\strongs_audio_index.json';

const itemsToAdd = [
  { sid: 'G25', lang: 'greek', word: 'ἀγαπάω', standard: 'erasmian_target' },
  { sid: 'G5547', lang: 'greek', word: 'Χριστός', standard: 'erasmian_target' },
  { sid: 'H1254', lang: 'hebrew', word: 'בָּרָא', standard: 'masoretic_target' },
  { sid: 'H1567', lang: 'hebrew', word: 'גַּלְעֵד', standard: 'masoretic_target' },
  { sid: 'H996', lang: 'hebrew', word: 'בֵּין', standard: 'masoretic_target' },
  { sid: 'H3026', lang: 'aramaic', word: 'יְגַר שָׂהֲדוּתָא', standard: 'biblical_aramaic' },
  { sid: 'H3541', lang: 'hebrew', word: 'כֹּה', standard: 'masoretic_target' },
  { sid: 'H3651', lang: 'hebrew', word: 'כֵּן', standard: 'masoretic_target' },
];

async function run() {
  const currentIndex = JSON.parse(fs.readFileSync(indexFile, 'utf8'));

  for (const item of itemsToAdd) {
    const filename = `${item.sid}.mp3`;
    const targetPath = path.join(repoDir, filename);

    if (fs.existsSync(targetPath)) {
      console.log(`Already exists: ${filename}`);
      continue;
    }

    console.log(`Fetching audio for ${item.sid} (${item.word})...`);
    const langCode = item.lang === 'greek' ? 'el' : 'iw';
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(item.word)}&tl=${langCode}&client=gtx`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(targetPath, buffer);
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

        currentIndex.push({
          strongs_id: item.sid,
          language: item.lang,
          lemma: item.word,
          filename: filename,
          byte_size: buffer.length,
          sha256: sha256,
          standard: item.standard,
          status: 'verified_catalogued'
        });
        console.log(`Saved ${filename} (${buffer.length} bytes, SHA-256: ${sha256.slice(0, 16)}...)`);
      } else {
        console.error(`Failed to fetch ${item.sid}: HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(`Error fetching ${item.sid}: ${e.message}`);
    }
  }

  fs.writeFileSync(indexFile, JSON.stringify(currentIndex, null, 2), 'utf8');
  console.log(`Updated index with total ${currentIndex.length} items.`);
}

run();
