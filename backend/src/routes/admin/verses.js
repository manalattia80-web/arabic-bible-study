/**
 * src/routes/admin/verses.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin endpoints for correcting verse text discrepancies.
 * All routes require JWT (editor or super_admin role).
 *
 * Endpoints:
 *   GET   /api/v1/admin/verses?book_id=1&chapter_num=1  — list verses for editing
 *   PATCH /api/v1/admin/verses/:id                       — fix AVD or original text
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { writeAuditLog } from '../../hooks/audit.js';

export default async function adminVersesRoutes(fastify) {

  fastify.addHook('preHandler', fastify.verifyJWT);
  fastify.addHook('preHandler', fastify.verifyRole('super_admin', 'editor'));

  // ── GET / ──────────────────────────────────────────────────────────────
  fastify.get('/', {
    schema: {
      summary:     'List verses for a chapter (admin view with all fields)',
      querystring: {
        type:     'object',
        required: ['book_id', 'chapter_num'],
        properties: {
          book_id:     { type: 'integer' },
          chapter_num: { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    const { book_id, chapter_num } = request.query;

    const { data, error } = await fastify.supabase
      .from('verses')
      .select('id, book_id, chapter_num, verse_num, text_avd_ar, text_original, text_original_lang')
      .eq('book_id', book_id)
      .eq('chapter_num', chapter_num)
      .order('verse_num');

    if (error) return reply.status(500).send({ error: error.message });
    return { data };
  });

  // ── PATCH /:id ─────────────────────────────────────────────────────────
  fastify.patch('/:id', {
    schema: {
      summary: 'Correct AVD Arabic or original text for a verse',
      params: {
        type:       'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        properties: {
          text_avd_ar:       { type: 'string', minLength: 1 },
          text_original:     { type: 'string', minLength: 1 },
          text_original_lang:{ type: 'string', enum: ['hebrew', 'greek', 'aramaic'] },
        },
        minProperties: 1,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const { data: original } = await fastify.supabase
      .from('verses')
      .select('id, book_id, chapter_num, verse_num, text_avd_ar, text_original')
      .eq('id', id)
      .single();

    if (!original) {
      return reply.status(404).send({ error: 'Verse not found' });
    }

    const { data, error } = await fastify.supabase
      .from('verses')
      .update(request.body)
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    // Invalidate the chapter cache so readers see the correction immediately
    await fastify.cache.del(`verses:book:${original.book_id}:ch:${original.chapter_num}`);

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'verses',
      recordId:  id,
      action:    'UPDATE',
      oldData:   original,
      newData:   data,
    });

    return { data };
  });
}
