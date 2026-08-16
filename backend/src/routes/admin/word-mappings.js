/**
 * src/routes/admin/word-mappings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin CRUD for word_mappings — the core interlinear alignment table.
 * All routes require JWT (editor or super_admin role).
 *
 * Endpoints:
 *   GET    /api/v1/admin/word-mappings?verse_id=uuid   — list mappings for verse
 *   POST   /api/v1/admin/word-mappings                 — create new mapping
 *   PATCH  /api/v1/admin/word-mappings/:id             — update a mapping
 *   DELETE /api/v1/admin/word-mappings/:id             — delete a mapping
 *   POST   /api/v1/admin/word-mappings/:id/verify      — mark as verified
 *   POST   /api/v1/admin/word-mappings/bulk-verify     — verify all in a verse
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { writeAuditLog } from '../../hooks/audit.js';

const EDITOR_ROLES = ['super_admin', 'editor'];

export default async function adminWordMappingRoutes(fastify) {

  // All routes in this file require JWT + editor role
  fastify.addHook('preHandler', fastify.verifyJWT);
  fastify.addHook('preHandler', fastify.verifyRole(...EDITOR_ROLES));

  // ── GET / ──────────────────────────────────────────────────────────────
  fastify.get('/', {
    schema: {
      summary:     'List all word mappings for a verse (admin view)',
      querystring: {
        type:     'object',
        required: ['verse_id'],
        properties: {
          verse_id:    { type: 'string', format: 'uuid' },
          is_verified: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { verse_id, is_verified } = request.query;

    let query = fastify.supabase
      .from('word_mappings')
      .select('*')
      .eq('verse_id', verse_id)
      .order('ar_word_position');

    if (is_verified !== undefined) query = query.eq('is_verified', is_verified);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    return { data };
  });

  // ── POST / ─────────────────────────────────────────────────────────────
  fastify.post('/', {
    schema: {
      summary: 'Create a new word mapping',
      body: {
        type:     'object',
        required: ['verse_id', 'ar_word_position', 'orig_word_position', 'ar_word', 'orig_word', 'orig_word_lang'],
        properties: {
          verse_id:           { type: 'string', format: 'uuid' },
          ar_word_position:   { type: 'integer' },
          orig_word_position: { type: 'integer' },
          ar_word:            { type: 'string' },
          ar_word_normalized: { type: 'string', nullable: true },
          orig_word:          { type: 'string' },
          orig_word_lang:     { type: 'string', enum: ['hebrew', 'greek', 'aramaic'] },
          orig_morphology:    { type: 'string', nullable: true },
          transliteration_ar: { type: 'string', nullable: true },
          transliteration_lat:{ type: 'string', nullable: true },
          strongs_id:         { type: 'string', nullable: true },
          audio_url:          { type: 'string', nullable: true },
        },
      },
    },
  }, async (request, reply) => {
    const row = {
      ...request.body,
      is_verified: false,
    };

    const { data, error } = await fastify.supabase
      .from('word_mappings')
      .insert(row)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return reply.status(409).send({ error: 'A mapping already exists at this position' });
      }
      return reply.status(500).send({ error: error.message });
    }

    // Invalidate verse word-mapping cache
    await fastify.cache.del(`word-mappings:${row.verse_id}`);

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'word_mappings',
      recordId:  data.id,
      action:    'INSERT',
      newData:   data,
    });

    return reply.status(201).send({ data });
  });

  // ── PATCH /:id ─────────────────────────────────────────────────────────
  fastify.patch('/:id', {
    schema: {
      summary: 'Update a word mapping',
      params: {
        type:       'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        properties: {
          ar_word:             { type: 'string' },
          ar_word_normalized:  { type: 'string', nullable: true },
          orig_word:           { type: 'string' },
          orig_morphology:     { type: 'string', nullable: true },
          transliteration_ar:  { type: 'string', nullable: true },
          transliteration_lat: { type: 'string', nullable: true },
          strongs_id:          { type: 'string', nullable: true },
          audio_url:           { type: 'string', nullable: true },
          audio_duration_ms:   { type: 'integer', nullable: true },
          ar_word_position:    { type: 'integer' },
          orig_word_position:  { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    // Fetch original for audit log
    const { data: original } = await fastify.supabase
      .from('word_mappings')
      .select('*')
      .eq('id', id)
      .single();

    if (!original) {
      return reply.status(404).send({ error: 'Word mapping not found' });
    }

    const { data, error } = await fastify.supabase
      .from('word_mappings')
      .update({ ...request.body, is_verified: false }) // changes reset verification
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    await fastify.cache.del(`word-mappings:${original.verse_id}`);

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'word_mappings',
      recordId:  id,
      action:    'UPDATE',
      oldData:   original,
      newData:   data,
    });

    return { data };
  });

  // ── DELETE /:id ────────────────────────────────────────────────────────
  fastify.delete('/:id', {
    schema: {
      summary: 'Delete a word mapping',
      params: {
        type:       'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const { data: original } = await fastify.supabase
      .from('word_mappings')
      .select('id, verse_id')
      .eq('id', id)
      .single();

    if (!original) {
      return reply.status(404).send({ error: 'Word mapping not found' });
    }

    const { error } = await fastify.supabase
      .from('word_mappings')
      .delete()
      .eq('id', id);

    if (error) return reply.status(500).send({ error: error.message });

    await fastify.cache.del(`word-mappings:${original.verse_id}`);

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'word_mappings',
      recordId:  id,
      action:    'DELETE',
      oldData:   original,
    });

    return reply.status(204).send();
  });

  // ── POST /:id/verify ───────────────────────────────────────────────────
  fastify.post('/:id/verify', {
    schema: {
      summary: 'Mark a word mapping as verified by a reviewer',
      params: {
        type:       'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const { data, error } = await fastify.supabase
      .from('word_mappings')
      .update({ is_verified: true })
      .eq('id', id)
      .select('id, verse_id, is_verified')
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Word mapping not found' });
    }

    await fastify.cache.del(`word-mappings:${data.verse_id}`);

    return { data };
  });

  // ── POST /bulk-verify ──────────────────────────────────────────────────
  // Verify all word mappings for an entire verse at once
  fastify.post('/bulk-verify', {
    schema: {
      summary: 'Mark all word mappings for a verse as verified',
      body: {
        type:     'object',
        required: ['verse_id'],
        properties: {
          verse_id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { verse_id } = request.body;

    const { data, error } = await fastify.supabase
      .from('word_mappings')
      .update({ is_verified: true })
      .eq('verse_id', verse_id)
      .select('id');

    if (error) return reply.status(500).send({ error: error.message });

    await fastify.cache.del(`word-mappings:${verse_id}`);

    return {
      data: { updated_count: data?.length ?? 0, verse_id },
    };
  });
}
