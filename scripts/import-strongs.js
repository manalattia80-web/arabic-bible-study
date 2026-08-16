/**
 * import-strongs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Downloads the complete Strong's Hebrew and Greek dictionaries from the
 * scrollmapper/bible_databases repository on GitHub, then imports them into
 * the `strongs_entries` table in Supabase.
 *
 * Run:  node import-strongs.js
 *
 * Source:
 *   Hebrew — https://raw.githubusercontent.com/scrollmapper/bible_databases/master/json/strongs/strongs-hebrew-dictionary.json
 *   Greek  — https://raw.githubusercontent.com/scrollmapper/bible_databases/master/json/strongs/strongs-greek-dictionary.json
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { supabase, testConnection } from './utils/supabase.js';
import { batchInsert } from './utils/batch-insert.js';

// ─── Data sources ─────────────────────────────────────────────────────────────
const STRONGS_SOURCES = {
  hebrew: 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/json/strongs/strongs-hebrew-dictionary.json',
  greek:  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/json/strongs/strongs-greek-dictionary.json',
};

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Strong\'s Dictionary Import');
  console.log('═══════════════════════════════════════════════════════════\n');

  await testConnection();

  let totalInserted = 0;
  let totalErrors = 0;

  for (const [language, url] of Object.entries(STRONGS_SOURCES)) {
    console.log(`\n📖 Fetching ${language} Strong's dictionary...`);
    console.log(`   Source: ${url}`);

    const rawData = await fetchJson(url);

    if (!rawData || !Array.isArray(rawData)) {
      console.error(`❌ Unexpected data format from ${url}`);
      continue;
    }

    console.log(`   Found ${rawData.length} entries`);

    const prefix = language === 'hebrew' ? 'H' : 'G';
    const rows = rawData.map(entry => mapStrongsEntry(entry, language, prefix));

    const { inserted, errors } = await batchInsert('strongs_entries', rows, {
      onConflict: 'strongs_id',
      label: `strongs_entries (${language})`,
    });

    totalInserted += inserted;
    totalErrors += errors;
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  DONE — ${totalInserted} entries imported, ${totalErrors} errors`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// ─── Map a raw scrollmapper entry to our DB row format ────────────────────────
/**
 * Scrollmapper Hebrew format:
 * {
 *   "strongs": "H1",
 *   "lemma": "אָב",
 *   "xlit": "ʼâb",
 *   "pron": "awb",
 *   "derivation": "a primitive word",
 *   "strongs_def": "father in a literal...",
 *   "kjv_def": "chief, (fore-)father..."
 * }
 */
function mapStrongsEntry(entry, language, prefix) {
  // Normalize the Strong's ID — ensure it has the correct prefix
  let rawId = String(entry.strongs || entry.id || '').trim();
  if (!rawId.startsWith(prefix)) {
    rawId = prefix + rawId.replace(/^[HGhg]/, '');
  }

  // Build the full definition — combine derivation + definition
  const derivation = (entry.derivation || '').trim();
  const strongsDef = (entry.strongs_def || entry.definition || '').trim();
  const definition_en = derivation
    ? `${strongsDef} [${derivation}]`.trim()
    : strongsDef;

  return {
    strongs_id:      rawId,
    language:        language,
    original_word:   (entry.lemma || entry.word || '').trim(),
    transliteration: (entry.xlit || entry.transliteration || '').trim(),
    root_word:       (entry.derivation || null),
    pronunciation:   (entry.pron || entry.pronunciation || null),
    definition_en:   definition_en || '(no definition available)',
    kjv_usage:       (entry.kjv_def || entry.kjv_usage || null),
  };
}

// ─── Fetch JSON from a URL ────────────────────────────────────────────────────
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.json();
}

// ─── Run ──────────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
