/**
 * src/routes/admin/strongs-ar.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin CRUD for strongs_ar_translations — Arabic meanings of Strong's entries.
 * All routes require JWT (editor or super_admin role).
 *
 * Endpoints:
 *   GET   /api/v1/admin/strongs-ar            — list with search + filter
 *   POST  /api/v1/admin/strongs-ar            — create Arabic translation
 *   PATCH /api/v1/admin/strongs-ar/:strongsId — update Arabic meaning
 *   POST  /api/v1/admin/strongs-ar/:strongsId/verify — mark as verified
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { writeAuditLog } from '../../hooks/audit.js';

const EDITOR_ROLES = ['super_admin', 'editor'];

export default async function adminStrongsArRoutes(fastify) {

  fastify.addHook('preHandler', fastify.verifyJWT);
  fastify.addHook('preHandler', fastify.verifyRole(...EDITOR_ROLES));

  // ── GET / ──────────────────────────────────────────────────────────────
  fastify.get('/', {
    schema: {
      summary:     'List Strong\'s Arabic translations (searchable)',
      querystring: {
        type: 'object',
        properties: {
          q:           { type: 'string' },
          lang:        { type: 'string', enum: ['hebrew', 'greek'] },
          is_verified: { type: 'boolean' },
          limit:       { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          page:        { type: 'integer', minimum: 1, default: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { q, lang, is_verified, limit = 50, page = 1 } = request.query;
    const offset = (page - 1) * limit;

    let query = fastify.supabase
      .from('strongs_ar_translations')
      .select(`
        id,
        strongs_id,
        definition_ar,
        notes_ar,
        is_verified,
        updated_at,
        strongs_entries!inner ( language, original_word, transliteration, definition_en )
      `, { count: 'exact' })
      .order('strongs_id')
      .range(offset, offset + limit - 1);

    if (is_verified !== undefined) query = query.eq('is_verified', is_verified);
    if (lang)  query = query.eq('strongs_entries.language', lang);
    if (q)     query = query.or(`definition_ar.ilike.%${q}%,strongs_entries.definition_en.ilike.%${q}%`);

    const { data, count, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    return { data, meta: { total: count ?? 0, page, limit } };
  });

  // ── POST / ─────────────────────────────────────────────────────────────
  fastify.post('/', {
    schema: {
      summary: 'Create an Arabic translation for a Strong\'s entry',
      body: {
        type:     'object',
        required: ['strongs_id', 'definition_ar'],
        properties: {
          strongs_id:   { type: 'string', pattern: '^[HG]\\d+$' },
          definition_ar:{ type: 'string', minLength: 1 },
          notes_ar:     { type: 'string', nullable: true },
        },
      },
    },
  }, async (request, reply) => {
    const { strongs_id, definition_ar, notes_ar } = request.body;

    const { data, error } = await fastify.supabase
      .from('strongs_ar_translations')
      .insert({
        strongs_id,
        definition_ar,
        notes_ar:    notes_ar ?? null,
        is_verified: false,
        updated_by:  request.user.sub,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return reply.status(409).send({
          error: `Arabic translation for ${strongs_id} already exists. Use PATCH to update.`,
        });
      }
      return reply.status(500).send({ error: error.message });
    }

    // Invalidate Strong's cache
    await fastify.cache.del(`strongs:${strongs_id}`);

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'strongs_ar_translations',
      recordId:  strongs_id,
      action:    'INSERT',
      newData:   data,
    });

    return reply.status(201).send({ data });
  });

  // ── PATCH /:strongsId ─────────────────────────────────────────────────
  fastify.patch('/:strongsId', {
    schema: {
      summary: 'Update the Arabic translation for a Strong\'s entry',
      params: {
        type:       'object',
        properties: { strongsId: { type: 'string' } },
      },
      body: {
        type: 'object',
        properties: {
          definition_ar: { type: 'string', minLength: 1 },
          notes_ar:      { type: 'string', nullable: true },
        },
      },
    },
  }, async (request, reply) => {
    const { strongsId } = request.params;

    // Fetch original for audit log
    const { data: original } = await fastify.supabase
      .from('strongs_ar_translations')
      .select('*')
      .eq('strongs_id', strongsId)
      .single();

    if (!original) {
      return reply.status(404).send({
        error: `No Arabic translation found for ${strongsId}. Use POST to create one.`,
      });
    }

    const { data, error } = await fastify.supabase
      .from('strongs_ar_translations')
      .update({
        ...request.body,
        is_verified: false,      // changes reset verification
        updated_by:  request.user.sub,
      })
      .eq('strongs_id', strongsId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    await fastify.cache.del(`strongs:${strongsId}`);

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'strongs_ar_translations',
      recordId:  strongsId,
      action:    'UPDATE',
      oldData:   original,
      newData:   data,
    });

    return { data };
  });

  // ── POST /:strongsId/verify ────────────────────────────────────────────
  fastify.post('/:strongsId/verify', {
    preHandler: [fastify.verifyRole('super_admin', 'editor', 'reviewer')],
    schema: {
      summary: 'Mark an Arabic Strong\'s translation as verified',
      params: {
        type:       'object',
        properties: { strongsId: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { strongsId } = request.params;

    const { data, error } = await fastify.supabase
      .from('strongs_ar_translations')
      .update({ is_verified: true, updated_by: request.user.sub })
      .eq('strongs_id', strongsId)
      .select('strongs_id, is_verified')
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: `Translation for ${strongsId} not found` });
    }

    await fastify.cache.del(`strongs:${strongsId}`);
    return { data };
  });
}
