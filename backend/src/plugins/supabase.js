/**
 * src/plugins/supabase.js
 * Registers a Supabase client as a Fastify decorator.
 * Accessible throughout the app as: fastify.supabase
 *
 * Uses the SERVICE ROLE key — this bypasses RLS, giving the backend
 * full read/write access. The backend enforces its own auth via JWT.
 */

import fp             from 'fastify-plugin';
import { createClient } from '@supabase/supabase-js';

async function supabasePlugin(fastify) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });

  // Verify connection on startup
  const { error } = await supabase.from('testaments').select('id').limit(1);
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }

  fastify.decorate('supabase', supabase);
  fastify.log.info('✅ Supabase connected');
}

export default fp(supabasePlugin, { name: 'supabase' });
