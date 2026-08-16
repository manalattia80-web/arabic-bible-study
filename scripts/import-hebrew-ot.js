/**
 * import-hebrew-ot.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses the STEPBible TAHOT (Translators Amalgamated Hebrew OT) TSV file
 * and imports word-level data into Supabase:
 *   - Populates `text_original` on each OT verse (Hebrew text)
 *   - Populates `word_mappings` for each Hebrew word with Strong's numbers
 *     and transliterations (initial draft — admins refine Arabic alignment)
 *
 * Run:  node import-hebrew-ot.js
 *
 * BEFORE RUNNING:
 *   1. Go to: https://github.com/STEPBible/STEPBible-Data
 *   2. Download: Translators Amalgamated OT (TAHOT)/TAHOT.txt
 *   3. Save as: scripts/data/hebrew/TAHOT.tsv
 *
 * TAHOT TSV Column Format (tab-separated):
 *   Col 0: Ref         e.g. "Gen.1.1#01"   (Book.Chapter.Verse#WordNum)
 *   Col 1: Hebrew      e.g. "בְּרֵאשִׁית"
 *   Col 2: Translit    e.g. "bᵊrēšîṯ"
 *   Col 3: Gloss       e.g. "In-beginning"
 *   Col 4: Morphology  e.g. "HR/Pp"
 *   Col 5: StepStrongs e.g. "H7225"
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
const TAHOT_PATH = process.env.TAHOT_TSV_PATH
  ? path.resolve(process.env.TAHOT_TSV_PATH)
  : path.join(__dirname, 'data', 'hebrew', 'TAHOT.tsv');

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Hebrew OT Import (TAHOT TSV → word_mappings)');
  console.log('═══════════════════════════════════════════════════════════\n');

  await testConnection();

  if (!fs.existsSync(TAHOT_PATH)) {
    console.error(`❌ TAHOT file not found: ${TAHOT_PATH}`);
    console.error('   Download from: github.com/STEPBible/STEPBible-Data');
    console.error('   Save as: scripts/data/hebrew/TAHOT.tsv');
    process.exit(1);
  }

  // ── Step 1: Build verse lookup map ────────────────────────────────────────
  console.log('🗺️  Step 1: Building verse lookup map (OT only)...');
  const verseMap = await buildVerseMap(1); // testament_id=1 (OT)
  console.log(`   Loaded ${Object.keys(verseMap).length} OT verse UUIDs\n`);

  // ── Step 2: Parse TAHOT and group words by verse ──────────────────────────
  console.log('📖 Step 2: Parsing TAHOT file...');
  const { verseOriginals, wordMappings } = await parseTahotFile(TAHOT_PATH, verseMap);

  // ── Step 3: Update text_original in verses table ──────────────────────────
  console.log(`\n🔤 Step 3: Updating ${Object.keys(verseOriginals).length} verse Hebrew texts...`);
  await updateVerseOriginals(verseOriginals);

  // ── Step 4: Insert word mappings ──────────────────────────────────────────
  console.log(`\n📝 Step 4: Inserting ${wordMappings.length} Hebrew word mappings...`);
  await batchInsert('word_mappings', wordMappings, {
    onConflict: 'verse_id,ar_word_position,orig_word_position',
    label: 'word_mappings (Hebrew OT)',
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  DONE — Hebrew OT word mappings imported!');
  console.log('  Note: ar_word is set to orig_word initially.');
  console.log('        Admins must align Arabic words via the Admin Panel.');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// ─── Parse TAHOT TSV ──────────────────────────────────────────────────────────
async function parseTahotFile(filePath, verseMap) {
  const verseOriginals = {};   // verseId → array of Hebrew words (to build text_original)
  const wordMappings   = [];   // flat array of word_mapping rows

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, 'utf-8'),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  let skipped = 0;
  let processed = 0;

  for await (const line of rl) {
    lineNum++;

    // Skip header / comment lines
    if (line.startsWith('#') || line.startsWith('Ref') || !line.trim()) {
      continue;
    }

    const cols = line.split('\t');
    if (cols.length < 6) continue;

    // ── Parse reference: "Gen.1.1#01" ──────────────────────────────────────
    const refFull = cols[0].trim();
    const parsed  = parseRef(refFull);
    if (!parsed) { skipped++; continue; }

    const { bookCode, chapter, verse, wordPos } = parsed;
    const bookId = STEP_CODE_TO_BOOK_ID[bookCode];
    if (!bookId) { skipped++; continue; }

    const verseKey = `${bookId}:${chapter}:${verse}`;
    const verseId  = verseMap[verseKey];
    if (!verseId) { skipped++; continue; }

    // ── Parse word data ───────────────────────────────────────────────────
    const hebrewWord    = cols[1]?.trim() || '';
    const translitLat   = cols[2]?.trim() || '';
    const morphology    = cols[4]?.trim() || null;
    const strongsRaw    = cols[5]?.trim() || '';

    // Normalize Strong's ID — may have trailing flags like "H7225a"
    const strongsId = normalizeStrongsId(strongsRaw);

    // ── Accumulate original text per verse ────────────────────────────────
    if (!verseOriginals[verseId]) verseOriginals[verseId] = [];
    verseOriginals[verseId].push(hebrewWord);

    // ── Build word_mapping row ────────────────────────────────────────────
    // ar_word is initially set to the Hebrew word.
    // Admins will update this to the actual Arabic AVD word via the Admin Panel.
    wordMappings.push({
      verse_id:           verseId,
      ar_word_position:   wordPos,   // same as orig for initial import
      orig_word_position: wordPos,
      ar_word:            hebrewWord,  // PLACEHOLDER — admin must fill Arabic word
      ar_word_normalized: null,
      orig_word:          hebrewWord,
      orig_word_lang:     'hebrew',
      orig_morphology:    morphology,
      transliteration_ar: null,        // admin fills Arabic transliteration
      transliteration_lat: translitLat,
      strongs_id:         strongsId || null,
      audio_url:          null,
      is_verified:        false,
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

  // Batch updates in groups of 50 (each is a separate DB call)
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
/**
 * Parse a TAHOT reference like "Gen.1.1#01" or "1Sa.2.3#05"
 */
function parseRef(ref) {
  // Format: BookCode.Chapter.Verse#WordPosition
  const match = ref.match(/^(\d?[A-Za-z]+)\.(\d+)\.(\d+)#(\d+)/);
  if (!match) return null;

  return {
    bookCode: match[1],
    chapter:  parseInt(match[2], 10),
    verse:    parseInt(match[3], 10),
    wordPos:  parseInt(match[4], 10),
  };
}

/**
 * Normalize a STEPBible Strong's ID to our format (e.g. "H7225a" → "H7225")
 */
function normalizeStrongsId(raw) {
  if (!raw) return null;
  // Remove trailing letter suffixes and clean up
  const cleaned = raw.replace(/[a-z]$/, '').trim();
  // STEPBible may prefix with 'H' or 'G' already
  if (/^[HG]\d+$/.test(cleaned)) return cleaned;
  return null;
}

/**
 * Build a map of "bookId:chapter:verse" → verse UUID (OT only)
 */
async function buildVerseMap(testamentId) {
  const map = {};
  let page = 0;
  const PAGE_SIZE = 1000;

  // Get all OT book IDs
  const { data: books } = await supabase
    .from('books')
    .select('id')
    .eq('testament_id', testamentId);

  const bookIds = (books || []).map(b => b.id);
  if (bookIds.length === 0) {
    console.error('❌ No OT books found. Run import-avd.js first.');
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
