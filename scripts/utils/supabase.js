/**
 * utils/supabase.js
 * Shared Supabase client for all import scripts.
 * Uses the SERVICE ROLE key for full DB access (bypasses RLS).
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  console.error('   Copy .env.example to .env and fill in your credentials.');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Test the connection to Supabase.
 * Call this at the start of each import script.
 */
export async function testConnection() {
  const { data, error } = await supabase
    .from('testaments')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('   Make sure you have applied database/schema.sql to your project.');
    process.exit(1);
  }

  console.log('✅ Supabase connection OK');
}
