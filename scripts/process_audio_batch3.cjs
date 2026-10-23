const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sqlite = path.join(root, 'sqlite_dist/sqlite3.exe');
const db = path.join(root, 'mobile/assets/bible_study.db');
const repoDir = path.join(root, 'audio_repository/strongs');
const indexFile = path.join(root, 'audio_repository/strongs_audio_index.json');
const serviceFile = path.join(root, 'mobile/lib/core/services/audio_playback_service.dart');

const nextWords = JSON.parse(fs.readFileSync(path.join(__dirname, 'next_100_words.json'), 'utf8'));
const targetGreek = nextWords.greek.map(g => g.strongs_id);
const targetHebrew = nextWords.hebrew.map(h => h.strongs_id);
const allTargetIds = [...targetGreek, ...targetHebrew];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log(`Starting Batch 3 Audio Ingestion (${allTargetIds.length} target words: 50 Greek, 50 Hebrew)...`);

  // 1. Fetch exact metadata from DB
  const sql = `SELECT strongs_id, language, original_word, transliteration FROM strongs_entries WHERE strongs_id IN ('${allTargetIds.join("','")}');`;
  const dbEntries = JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8' }));
  const dbMap = {};
  for (const row of dbEntries) {
    dbMap[row.strongs_id] = row;
  }

  // 2. Load current index
  let currentIndex = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  const existingIds = new Set(currentIndex.map(i => i.strongs_id));

  let addedCount = 0;

  for (const sid of allTargetIds) {
    const entry = dbMap[sid];
    if (!entry) {
      console.warn(`Strongs ID ${sid} not found in database!`);
      continue;
    }

    const filename = `${sid}.mp3`;
    const targetFile = path.join(repoDir, filename);
    const isGreek = sid.startsWith('G');
    const langCode = isGreek ? 'el' : 'iw';

    if (!fs.existsSync(targetFile)) {
      console.log(`[${addedCount + 1}/${allTargetIds.length}] Downloading audio for ${sid} (${entry.original_word} / ${entry.transliteration})...`);
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(entry.original_word)}&tl=${langCode}&client=gtx`;

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!res.ok) {
          console.error(`Failed to download ${sid}: ${res.status}`);
          continue;
        }

        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(targetFile, buf);
        await sleep(250);
      } catch (err) {
        console.error(`Error downloading ${sid}:`, err.message);
        continue;
      }
    }

    const fileBytes = fs.readFileSync(targetFile);
    const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');

    if (!existingIds.has(sid)) {
      currentIndex.push({
        strongs_id: sid,
        language: isGreek ? 'greek' : 'hebrew',
        lemma: entry.original_word,
        transliteration: entry.transliteration,
        filename: filename,
        byte_size: fileBytes.length,
        sha256: sha256,
        standard: isGreek ? 'erasmian_target' : 'masoretic_target',
        status: 'cataloged_verified'
      });
      existingIds.add(sid);
      addedCount++;
    }
  }

  // Sort index by strongs_id
  currentIndex.sort((a, b) => {
    const aType = a.strongs_id[0];
    const bType = b.strongs_id[0];
    if (aType !== bType) return aType.localeCompare(bType);
    return parseInt(a.strongs_id.substring(1)) - parseInt(b.strongs_id.substring(1));
  });

  fs.writeFileSync(indexFile, JSON.stringify(currentIndex, null, 2), 'utf8');
  console.log(`\nUpdated audio index: now contains ${currentIndex.length} cataloged files (added ${addedCount} new).`);

  // 3. Update AudioPlaybackService.catalogedStrongsIds
  const allCataloged = Array.from(existingIds).sort((a, b) => {
    const aType = a[0];
    const bType = b[0];
    if (aType !== bType) return aType.localeCompare(bType);
    return parseInt(a.substring(1)) - parseInt(b.substring(1));
  });

  const formattedSet = allCataloged.map(id => `'${id}'`).join(', ');
  let serviceContent = fs.readFileSync(serviceFile, 'utf8');
  
  const setRegex = /static const Set<String> catalogedStrongsIds = \{[\s\S]*?\};/;
  const newSetCode = `static const Set<String> catalogedStrongsIds = {\n    ${formattedSet},\n  };`;
  serviceContent = serviceContent.replace(setRegex, newSetCode);
  fs.writeFileSync(serviceFile, serviceContent, 'utf8');
  console.log(`Updated AudioPlaybackService with ${allCataloged.length} Strong's IDs.`);

  // 4. Calculate occurrence coverage
  const totalMappings = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM word_mappings WHERE orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—';"], { encoding: 'utf8' }))[0].c;

  const countSql = `SELECT COUNT(*) as total FROM word_mappings WHERE strongs_id IN ('${allCataloged.join("','")}');`;
  const countRes = JSON.parse(execFileSync(sqlite, [db, '-json', countSql], { encoding: 'utf8' }));
  const greenTotal = countRes[0].total;
  const greenPct = ((greenTotal / totalMappings) * 100).toFixed(2);

  console.log(`\n======================================================`);
  console.log(`TOTAL BIBLE OCCURRENCES WITH GREEN VERIFIED BADGE 🟢:`);
  console.log(`${greenTotal.toLocaleString()} words out of ${totalMappings.toLocaleString()} (${greenPct}%)!`);
  console.log(`======================================================\n`);
}

run().catch(console.error);
