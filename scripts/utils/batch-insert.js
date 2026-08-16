/**
 * utils/batch-insert.js
 * Utility to insert large arrays into Supabase in configurable batch sizes.
 * Handles retries, error reporting, and progress display.
 */

import { supabase } from './supabase.js';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10);
const UPSERT_MODE = process.env.UPSERT_MODE !== 'false';

/**
 * Insert or upsert rows into a Supabase table in batches.
 *
 * @param {string} tableName - The target table name
 * @param {object[]} rows - Array of row objects to insert
 * @param {object} options
 * @param {string} [options.onConflict] - Comma-separated conflict columns for upsert
 * @param {string} [options.label] - Human-readable label for progress output
 * @returns {Promise<{ inserted: number, errors: number }>}
 */
export async function batchInsert(tableName, rows, options = {}) {
  const { onConflict, label = tableName } = options;
  const total = rows.length;

  if (total === 0) {
    console.log(`  ⚠️  No rows to insert into ${label}`);
    return { inserted: 0, errors: 0 };
  }

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);

    process.stdout.write(
      `\r  📦 ${label}: batch ${batchNum}/${totalBatches} (${inserted}/${total} rows)`
    );

    let result;

    if (UPSERT_MODE && onConflict) {
      result = await supabase
        .from(tableName)
        .upsert(batch, { onConflict, ignoreDuplicates: false });
    } else {
      result = await supabase
        .from(tableName)
        .insert(batch);
    }

    if (result.error) {
      console.error(`\n  ❌ Batch ${batchNum} error in ${label}:`, result.error.message);
      errors += batch.length;

      // Log first 3 failed rows for debugging
      console.error('     First failed row:', JSON.stringify(batch[0], null, 2));
    } else {
      inserted += batch.length;
    }

    // Small delay to avoid rate limiting
    if (i + BATCH_SIZE < total) {
      await sleep(50);
    }
  }

  console.log(`\n  ✅ ${label}: ${inserted} inserted, ${errors} errors`);
  return { inserted, errors };
}

/**
 * Insert rows one-by-one with detailed error reporting.
 * Use this for small datasets where individual error context matters.
 */
export async function singleInsert(tableName, row, onConflict) {
  const query = UPSERT_MODE && onConflict
    ? supabase.from(tableName).upsert(row, { onConflict })
    : supabase.from(tableName).insert(row);

  const { data, error } = await query;
  return { data, error };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
