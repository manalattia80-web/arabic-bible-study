/**
 * import-greek-nt.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses the STEPBible TAGNT (Translators Amalgamated Greek NT) TSV file
 * and imports word-level data into Supabase:
 *   - Populates `text_original` on each NT verse (Greek text)
 *   - Populates `word_mappings` for each Greek word with Strong's numbers
 *     and transliterations (initial draft — admins refine Arabic alignment)
 *
 * Run:  node import-greek-nt.js
 *
 * BEFORE RUNNING:
 *   1. Go to: https://github.com/STEPBible/STEPBible-Data
 *   2. Download: Translators Amalgamated NT (TAGNT)/TAGNT.txt
 *   3. Save as: scripts/data/greek/TAGNT.tsv
 *
 * TAGNT TSV Column Format (tab-separated):
 *   Col 0: Ref         e.g. "Mat.1.1#01"   (Book.Chapter.Verse#WordNum)
 *   Col 1: Greek       e.g. "Βίβλος"
 *   Col 2: Translit    e.g. "Biblos"
 *   Col 3: Gloss       e.g. "book"
 *   Col 4: Morphology  e.g. "N-NFS"
 *   Col 5: StepStrongs e.g. "G976"
 *   Col 6+ Other data (ignored)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { supabase, testConnection } from './utils/supabase.js';
import { batchInsert } from './utils/batch-insert.js';
import { STEP_CODE_TO_BOOK_ID } from './data/books-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TAGNT_PATH = process.env.TAGNT_TSV_PATH
  ? path.resolve(process.env.TAGNT_TSV_PATH)
  : path.join(__dirname, 'data', 'greek', 'TAGNT.tsv');

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Greek NT Import (TAGNT TSV → word_mappings)');
  console.log('═══════════════════════════════════════════════════════════\n');

  await testConnection();

  if (!fs.existsSync(TAGNT_PATH)) {
    console.error(`❌ TAGNT file not found: ${TAGNT_PATH}`);
    console.error('   Download from: github.com/STEPBible/STEPBible-Data');
    console.error('   Save as: scripts/data/greek/TAGNT.tsv');
    process.exit(1);
  }

  // ── Step 1: Build verse lookup map ────────────────────────────────────────
  console.log('🗺️  Step 1: Building verse lookup map (NT only)...');
  const verseMap = await buildVerseMap(2); // testament_id=2 (NT)
  console.log(`   Loaded ${Object.keys(verseMap).length} NT verse UUIDs\n`);

  // ── Step 2: Parse TAGNT and group words by verse ──────────────────────────
  console.log('📖 Step 2: Parsing TAGNT file...');
  const { verseOriginals, wordMappings } = await parseTagntFile(TAGNT_PATH, verseMap);

  // ── Step 3: Update text_original in verses table ──────────────────────────
  console.log(`\n🔤 Step 3: Updating ${Object.keys(verseOriginals).length} verse Greek texts...`);
  await updateVerseOriginals(verseOriginals);

  // ── Step 4: Insert word mappings ──────────────────────────────────────────
  console.log(`\n📝 Step 4: Inserting ${wordMappings.length} Greek word mappings...`);
  await batchInsert('word_mappings', wordMappings, {
    onConflict: 'verse_id,ar_word_position,orig_word_position',
    label: 'word_mappings (Greek NT)',
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  DONE — Greek NT word mappings imported!');
  console.log('  Note: ar_word is set to Greek word initially.');
  console.log('        Admins must align Arabic words via the Admin Panel.');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// ─── Parse TAGNT TSV ──────────────────────────────────────────────────────────
async function parseTagntFile(filePath, verseMap) {
  const verseOriginals = {};   // verseId → array of Greek words
  const wordMappings   = [];   // flat array of word_mapping rows

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, 'utf-8'),
    crlfDelay: Infinity,
  });

  let skipped   = 0;
  let processed = 0;

  for await (const line of rl) {
    // Skip header / comment lines
    if (line.startsWith('#') || line.startsWith('Ref') || !line.trim()) {
      continue;
    }

    const cols = line.split('\t');
    if (cols.length < 6) continue;

    // ── Parse reference: "Mat.1.1#01" ──────────────────────────────────────
    const refFull = cols[0].trim();
    const parsed  = parseRef(refFull);
    if (!parsed) { skipped++; continue; }

    const { bookCode, chapter, verse, wordPos } = parsed;

    // Only process NT books (book_id >= 40)
    const bookId = STEP_CODE_TO_BOOK_ID[bookCode];
    if (!bookId || bookId < 40) { skipped++; continue; }

    const verseKey = `${bookId}:${chapter}:${verse}`;
    const verseId  = verseMap[verseKey];
    if (!verseId) { skipped++; continue; }

    // ── Parse word data ───────────────────────────────────────────────────
    const greekWord   = cols[1]?.trim() || '';
    const translitLat = cols[2]?.trim() || '';
    const morphology  = cols[4]?.trim() || null;
    const strongsRaw  = cols[5]?.trim() || '';

    const strongsId = normalizeStrongsId(strongsRaw);

    // ── Accumulate original text per verse ────────────────────────────────
    if (!verseOriginals[verseId]) verseOriginals[verseId] = [];
    verseOriginals[verseId].push(greekWord);

    // ── Build word_mapping row ────────────────────────────────────────────
    wordMappings.push({
      verse_id:            verseId,
      ar_word_position:    wordPos,
      orig_word_position:  wordPos,
      ar_word:             greekWord,   // PLACEHOLDER — admin must fill Arabic word
      ar_word_normalized:  null,
      orig_word:           greekWord,
      orig_word_lang:      'greek',
      orig_morphology:     morphology,
      transliteration_ar:  null,        // admin fills Arabic transliteration
      transliteration_lat: translitLat,
      strongs_id:          strongsId || null,
      audio_url:           null,
      is_verified:         false,
    });

    processed++;
    if (processed % 10000 === 0) {
      process.stdout.write(`\r   Processed ${processed.toLocaleString()} words...`);
    }
  }

  console.log(`\n   ✅ Parsed ${processed.toLocaleString()} words, skipped ${skipped}`);
  return { verseOriginals, wordMappings };
}

// ─── Update verse text_original ───────────────────────────────────────────────
async function updateVerseOriginals(verseOriginals) {
  const entries = Object.entries(verseOriginals);
  let updated = 0;
  const BATCH = 50;

  for (let i = 0; i < entries.length; i += BATCH) {
    const slice = entries.slice(i, i + BATCH);
    await Promise.all(
      slice.map(([verseId, words]) =>
        supabase
          .from('verses')
          .update({ text_original: words.join(' ') })
          .eq('id', verseId)
      )
    );
    updated += slice.length;
    process.stdout.write(`\r   Updated ${updated}/${entries.length} verses`);
  }
  console.log(`\n   ✅ Updated ${updated} verse original texts`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseRef(ref) {
  const match = ref.match(/^(\d?[A-Za-z]+)\.(\d+)\.(\d+)#(\d+)/);
  if (!match) return null;
  return {
    bookCode: match[1],
    chapter:  parseInt(match[2], 10),
    verse:    parseInt(match[3], 10),
    wordPos:  parseInt(match[4], 10),
  };
}

function normalizeStrongsId(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[a-z]$/, '').trim();
  if (/^[HG]\d+$/.test(cleaned)) return cleaned;
  return null;
}

async function buildVerseMap(testamentId) {
  const map = {};
  let page = 0;
  const PAGE_SIZE = 1000;

  const { data: books } = await supabase
    .from('books')
    .select('id')
    .eq('testament_id', testamentId);

  const bookIds = (books || []).map(b => b.id);
  if (bookIds.length === 0) {
    console.error('❌ No NT books found. Run import-avd.js first.');
    process.exit(1);
  }

  while (true) {
    const { data, error } = await supabase
      .from('verses')
      .select('id, book_id, chapter_num, verse_num')
      .in('book_id', bookIds)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Error fetching verses:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const v of data) {
      map[`${v.book_id}:${v.chapter_num}:${v.verse_num}`] = v.id;
    }

    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return map;
}

// ─── Run ──────────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
