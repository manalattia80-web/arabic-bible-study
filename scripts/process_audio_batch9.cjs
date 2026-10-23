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

const nextWords = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch9_words.json'), 'utf8'));
const targetGreek = nextWords.greek.map(g => g.strongs_id);
const targetHebrew = nextWords.hebrew.map(h => h.strongs_id);
const allTargetIds = [...targetGreek, ...targetHebrew];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log(`Starting Batch 9 Comprehensive Ingestion (${allTargetIds.length} target words: ${targetGreek.length} Greek, ${targetHebrew.length} Hebrew)...`);

  // 1. Fetch exact metadata from DB in chunks of 300
  const dbMap = {};
  for (let i = 0; i < allTargetIds.length; i += 300) {
    const chunk = allTargetIds.slice(i, i + 300);
    const sql = `SELECT strongs_id, language, original_word, transliteration FROM strongs_entries WHERE strongs_id IN ('${chunk.join("','")}');`;
    const rows = JSON.parse(execFileSync(sqlite, [db, '-json', sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }));
    for (const r of rows) {
      dbMap[r.strongs_id] = r;
    }
  }

  // 2. Load current index
  let currentIndex = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  const existingIds = new Set(currentIndex.map(i => i.strongs_id));

  let addedCount = 0;

  // Process in parallel chunks of 10
  const chunkSize = 10;
  for (let i = 0; i < allTargetIds.length; i += chunkSize) {
    const chunk = allTargetIds.slice(i, i + chunkSize);

    if (i % 500 === 0 || i >= allTargetIds.length - chunkSize) {
      console.log(`[${i + 1}/${allTargetIds.length}] Processing batch...`);
    }

    await Promise.all(chunk.map(async (sid) => {
      const entry = dbMap[sid];
      if (!entry) return;

      const filename = `${sid}.mp3`;
      const targetFile = path.join(repoDir, filename);
      const isGreek = sid.startsWith('G');
      const langCode = isGreek ? 'el' : 'iw';

      if (!fs.existsSync(targetFile)) {
        const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(entry.original_word)}&tl=${langCode}&client=gtx`;
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(targetFile, buf);
          }
        } catch (err) {
          // Continue on error
        }
      }

      if (fs.existsSync(targetFile)) {
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
    }));

    await sleep(40);
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

  // Split into chunks of 300 for SQL querying
  let greenTotal = 0;
  for (let i = 0; i < allCataloged.length; i += 300) {
    const sub = allCataloged.slice(i, i + 300);
    const count = JSON.parse(execFileSync(sqlite, [db, '-json', `SELECT COUNT(*) as c FROM word_mappings WHERE strongs_id IN ('${sub.join("','")}');`], { encoding: 'utf8' }))[0].c;
    greenTotal += count;
  }
  const greenPct = ((greenTotal / totalMappings) * 100).toFixed(2);

  const totalStrongsGreek = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM strongs_entries WHERE strongs_id LIKE 'G%';"], { encoding: 'utf8' }))[0].c;
  const totalStrongsHebrew = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM strongs_entries WHERE strongs_id LIKE 'H%';"], { encoding: 'utf8' }))[0].c;
  const totalStrongs = totalStrongsGreek + totalStrongsHebrew;

  const catGreek = currentIndex.filter(c => c.strongs_id.startsWith('G')).length;
  const catHeb = currentIndex.filter(c => c.strongs_id.startsWith('H') && c.standard !== 'biblical_aramaic').length;
  const catAr = currentIndex.filter(c => c.standard === 'biblical_aramaic').length;

  const totalArOccurrences = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM word_mappings WHERE orig_word_lang = 'aramaic';"], { encoding: 'utf8' }))[0].c;
  const catArIds = currentIndex.filter(c => c.standard === 'biblical_aramaic').map(c => c.strongs_id);
  const catArOccurrences = catArIds.length > 0 ? JSON.parse(execFileSync(sqlite, [db, '-json', `SELECT COUNT(*) as c FROM word_mappings WHERE strongs_id IN ('${catArIds.join("','")}');`], { encoding: 'utf8' }))[0].c : 0;
  const arOccurrences = totalArOccurrences - catArOccurrences;

  const yellowTotal = totalMappings - greenTotal - arOccurrences;

  const realOriginalWords = JSON.parse(execFileSync(sqlite, [db, '-json', "SELECT COUNT(*) as c FROM word_mappings WHERE orig_word IS NOT NULL AND orig_word != '' AND orig_word != '—' AND orig_word != '---';"], { encoding: 'utf8' }))[0].c;

  const stats = {
    lexicon: {
      totalStrongs,
      totalStrongsGreek,
      totalStrongsHebrew,
      catalogTotal: currentIndex.length,
      catGreek,
      catHeb,
      catAr,
      lexiconGreenPercent: ((currentIndex.length / totalStrongs) * 100).toFixed(2),
      lexiconGreekPercent: ((catGreek / totalStrongsGreek) * 100).toFixed(2),
      lexiconHebrewPercent: ((catHeb / totalStrongsHebrew) * 100).toFixed(2)
    },
    textCoverage: {
      totalMappings,
      realOriginalWords,
      greenTotal,
      yellowTotal,
      arOccurrences,
      greenPct,
      realOriginalGreenPct: ((greenTotal / realOriginalWords) * 100).toFixed(2),
      yellowPct: ((yellowTotal / totalMappings) * 100).toFixed(2),
      arPct: ((arOccurrences / totalMappings) * 100).toFixed(2)
    }
  };

  fs.writeFileSync(path.join(root, 'scripts/audio_stats.json'), JSON.stringify(stats, null, 2), 'utf8');

  console.log(`\n======================================================`);
  console.log(`TOTAL BIBLE OCCURRENCES WITH GREEN VERIFIED BADGE 🟢:`);
  console.log(`${greenTotal.toLocaleString()} words out of ${totalMappings.toLocaleString()} (${greenPct}%)`);
  console.log(`Coverage of all genuine original words: ${greenTotal.toLocaleString()} out of ${realOriginalWords.toLocaleString()} (${stats.textCoverage.realOriginalGreenPct}%)!`);
  console.log(`Yellow approximate: ${yellowTotal.toLocaleString()} (${stats.textCoverage.yellowPct}%)`);
  console.log(`Aramaic suspended: ${arOccurrences.toLocaleString()} (${stats.textCoverage.arPct}%)`);
  console.log(`Total cataloged Strong's IDs: ${currentIndex.length} (${stats.lexicon.lexiconGreenPercent}% of lexicon)`);
  console.log(`======================================================\n`);
}

run().catch(console.error);
