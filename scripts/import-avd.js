/**
 * import-avd.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses Arabic Van Dyck (AVD) USFM files and imports them into Supabase:
 *   - books table
 *   - chapters table
 *   - verses table (text_avd_ar populated; text_original left empty for now)
 *
 * Run:  node import-avd.js
 *
 * BEFORE RUNNING:
 *   1. Go to https://ebible.org/ara/
 *   2. Download the USFM zip (look for "arb" or "Arabic Van Dyck")
 *   3. Extract all .usfm files into: scripts/data/avd/
 *      Expected files: GEN.usfm, EXO.usfm, LEV.usfm ... REV.usfm
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, testConnection } from './utils/supabase.js';
import { batchInsert } from './utils/batch-insert.js';
import { BOOKS, USFM_CODE_TO_BOOK_ID } from './data/books-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVD_DIR = process.env.AVD_USFM_DIR
  ? path.resolve(process.env.AVD_USFM_DIR)
  : path.join(__dirname, 'data', 'avd');

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  AVD Arabic Bible Import (USFM → Supabase)');
  console.log('═══════════════════════════════════════════════════════════\n');

  await testConnection();

  // Verify the data directory exists
  if (!fs.existsSync(AVD_DIR)) {
    console.error(`❌ USFM directory not found: ${AVD_DIR}`);
    console.error('   Download AVD USFM files from https://ebible.org/ara/');
    console.error('   and extract them into scripts/data/avd/');
    process.exit(1);
  }

  const usfmFiles = fs.readdirSync(AVD_DIR).filter(f => f.endsWith('.usfm'));
  if (usfmFiles.length === 0) {
    console.error(`❌ No .usfm files found in ${AVD_DIR}`);
    process.exit(1);
  }

  console.log(`📁 Found ${usfmFiles.length} USFM files in ${AVD_DIR}\n`);

  // ── Step 1: Insert books ──────────────────────────────────────────────────
  console.log('📚 Step 1: Inserting books...');
  await batchInsert('books', BOOKS, {
    onConflict: 'id',
    label: 'books',
  });

  // ── Step 2: Parse USFM files and collect chapters/verses ─────────────────
  console.log('\n📖 Step 2: Parsing USFM files...');

  const allChapters = [];
  const allVerses   = [];

  // Sort files by canonical book order
  const sortedFiles = usfmFiles.sort((a, b) => {
    const idA = getBookIdFromFilename(a);
    const idB = getBookIdFromFilename(b);
    return (idA || 999) - (idB || 999);
  });

  for (const filename of sortedFiles) {
    const bookCode = path.basename(filename, '.usfm').toUpperCase();
    const bookId   = USFM_CODE_TO_BOOK_ID[bookCode];

    if (!bookId) {
      console.warn(`  ⚠️  Unknown book code in filename: ${filename} — skipping`);
      continue;
    }

    const book = BOOKS.find(b => b.id === bookId);
    const lang = book.testament_id === 1 ? 'hebrew' : 'greek';
    const filePath = path.join(AVD_DIR, filename);
    const content  = fs.readFileSync(filePath, 'utf-8');

    const { chapters, verses } = parseUsfm(content, bookId, lang);
    allChapters.push(...chapters);
    allVerses.push(...verses);

    console.log(`  ✓ ${book.name_en.padEnd(22)} — ${chapters.length} chapters, ${verses.length} verses`);
  }

  // ── Step 3: Insert chapters ───────────────────────────────────────────────
  console.log(`\n📖 Step 3: Inserting ${allChapters.length} chapters...`);
  await batchInsert('chapters', allChapters, {
    onConflict: 'book_id,number',
    label: 'chapters',
  });

  // ── Step 4: Fetch chapter UUIDs to link verses ────────────────────────────
  console.log('\n🔗 Step 4: Fetching chapter IDs...');
  const chapterMap = await buildChapterMap();

  // ── Step 5: Attach chapter UUIDs to verses ────────────────────────────────
  const verseRows = allVerses.map(v => {
    const key = `${v._book_id}:${v._chapter_num}`;
    const chapterId = chapterMap[key];
    if (!chapterId) {
      console.warn(`  ⚠️  No chapter found for ${key}`);
      return null;
    }
    const { _book_id, _chapter_num, ...rest } = v;
    return { ...rest, chapter_id: chapterId };
  }).filter(Boolean);

  // ── Step 6: Insert verses ─────────────────────────────────────────────────
  console.log(`\n📝 Step 5: Inserting ${verseRows.length} verses...`);
  await batchInsert('verses', verseRows, {
    onConflict: 'book_id,chapter_num,verse_num',
    label: 'verses',
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  DONE — AVD import complete!');
  console.log('  Next: run import-hebrew-ot.js and import-greek-nt.js');
  console.log('        to populate text_original and word_mappings');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// ─── USFM Parser ──────────────────────────────────────────────────────────────
/**
 * Minimal USFM parser that extracts chapters and verses.
 *
 * USFM markers we handle:
 *   \id   — Book code
 *   \c N  — Chapter number
 *   \v N  — Verse number (followed by verse text)
 *   \p \q \m etc. — Paragraph markers (stripped)
 */
function parseUsfm(content, bookId, lang) {
  const chapters = [];
  const verses   = [];

  let currentChapter = null;
  let currentVerseNum = null;
  let verseTextBuffer = '';

  // Normalize line endings and split
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();

    if (!line || line.startsWith('//')) continue;

    // ── Chapter marker ────────────────────────────────────────────────────
    if (line.startsWith('\\c ')) {
      // Save previous verse if any
      saveVerse(verses, bookId, currentChapter, currentVerseNum, verseTextBuffer, lang);
      verseTextBuffer = '';
      currentVerseNum = null;

      currentChapter = parseInt(line.slice(3).trim(), 10);
      if (!isNaN(currentChapter)) {
        chapters.push({
          book_id: bookId,
          number:  currentChapter,
        });
      }
      continue;
    }

    // ── Verse marker ──────────────────────────────────────────────────────
    if (line.startsWith('\\v ')) {
      // Save the previous verse
      saveVerse(verses, bookId, currentChapter, currentVerseNum, verseTextBuffer, lang);
      verseTextBuffer = '';

      // Parse "\\v NUM text..." — verse number + optional inline text
      const rest = line.slice(3);
      const spaceIdx = rest.indexOf(' ');

      if (spaceIdx === -1) {
        currentVerseNum = parseInt(rest.trim(), 10);
        verseTextBuffer = '';
      } else {
        currentVerseNum = parseInt(rest.slice(0, spaceIdx), 10);
        verseTextBuffer = stripUsfmMarkers(rest.slice(spaceIdx + 1));
      }
      continue;
    }

    // ── Continuation text (inline text on same or following lines) ────────
    if (currentVerseNum !== null && !isUsfmTag(line)) {
      verseTextBuffer += ' ' + stripUsfmMarkers(line);
    }
  }

  // Save the last verse
  saveVerse(verses, bookId, currentChapter, currentVerseNum, verseTextBuffer, lang);

  return { chapters, verses };
}

function saveVerse(verses, bookId, chapterNum, verseNum, text, lang) {
  if (!chapterNum || !verseNum || !text.trim()) return;

  verses.push({
    _book_id:          bookId,       // temp field, removed before insert
    _chapter_num:      chapterNum,   // temp field, removed before insert
    book_id:           bookId,
    chapter_num:       chapterNum,
    verse_num:         verseNum,
    text_avd_ar:       text.trim(),
    text_original:     '',           // populated by import-hebrew-ot.js / import-greek-nt.js
    text_original_lang: lang,
  });
}

/** Remove USFM inline markers like \add, \nd, \wj, etc. */
function stripUsfmMarkers(text) {
  return text
    .replace(/\\[a-zA-Z]+\*/g, '')    // closing markers like \add*
    .replace(/\\[a-zA-Z]+ /g, ' ')    // opening markers like \add
    .replace(/\\[a-zA-Z]+$/g, '')     // trailing markers
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns true if a line is a USFM tag (starts with backslash) */
function isUsfmTag(line) {
  return line.startsWith('\\');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBookIdFromFilename(filename) {
  const code = path.basename(filename, '.usfm').toUpperCase();
  return USFM_CODE_TO_BOOK_ID[code] || null;
}

/** Fetch all chapters from DB and build a lookup map: "bookId:chapterNum" → uuid */
async function buildChapterMap() {
  const map = {};
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, book_id, number')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('❌ Error fetching chapters:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    for (const ch of data) {
      map[`${ch.book_id}:${ch.number}`] = ch.id;
    }

    if (data.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`  ✅ Loaded ${Object.keys(map).length} chapter UUIDs`);
  return map;
}

// ─── Run ──────────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
