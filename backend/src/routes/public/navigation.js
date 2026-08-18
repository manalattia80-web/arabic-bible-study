/**
 * src/routes/public/navigation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Public endpoints for hierarchical Bible navigation.
 * No authentication required.
 * Results are cached in Redis for fast repeated access.
 *
 * Endpoints:
 *   GET /api/v1/testaments
 *   GET /api/v1/books?testament_id=1
 *   GET /api/v1/chapters?book_id=1
 *   GET /api/v1/verses?book_id=1&chapter_num=1
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TTL } from '../../plugins/redis.js';

export default async function navigationRoutes(fastify) {

  // ── GET /testaments ─────────────────────────────────────────────────────
  fastify.get('/testaments', {
    schema: {
      summary: 'List all testaments',
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:            { type: 'integer' },
                  name_ar:       { type: 'string' },
                  name_en:       { type: 'string' },
                  original_lang: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const cacheKey = 'nav:testaments';
    const cached   = await fastify.cache.get(cacheKey);
    if (cached) return { data: cached };

    const { data, error } = await fastify.supabase
      .from('testaments')
      .select('*')
      .order('id');

    if (error) return reply.status(500).send({ error: error.message });

    await fastify.cache.set(cacheKey, data, TTL.NAV);
    return { data };
  });

  // ── GET /books ──────────────────────────────────────────────────────────
  fastify.get('/books', {
    schema: {
      summary:     'List books, optionally filtered by testament',
      querystring: {
        type: 'object',
        properties: {
          testament_id: { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    const { testament_id } = request.query;
    const cacheKey = `nav:books:${testament_id ?? 'all'}`;
    const cached   = await fastify.cache.get(cacheKey);
    if (cached) return { data: cached };

    let query = fastify.supabase
      .from('books')
      .select('id, testament_id, name_ar, name_ar_short, name_en, name_en_short, name_original, chapter_count, sort_order')
      .order('sort_order');

    if (testament_id) query = query.eq('testament_id', testament_id);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    await fastify.cache.set(cacheKey, data, TTL.NAV);
    return { data };
  });

  // ── GET /chapters ───────────────────────────────────────────────────────
  fastify.get('/chapters', {
    schema: {
      summary:     'List chapters for a book',
      querystring: {
        type:     'object',
        required: ['book_id'],
        properties: {
          book_id: { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    const { book_id } = request.query;
    const cacheKey    = `nav:chapters:book:${book_id}`;
    const cached      = await fastify.cache.get(cacheKey);
    if (cached) return { data: cached };

    const { data, error } = await fastify.supabase
      .from('chapters')
      .select('id, book_id, number')
      .eq('book_id', book_id)
      .order('number');

    if (error) return reply.status(500).send({ error: error.message });

    await fastify.cache.set(cacheKey, data, TTL.NAV);
    return { data };
  });

  // ── GET /verses ─────────────────────────────────────────────────────────
  // Returns all verses of a chapter with both Arabic AVD and original texts.
  // This is the most-read endpoint — cached aggressively.
  fastify.get('/verses', {
    schema: {
      summary:     'List all verses in a chapter (dual text: Arabic + original)',
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
    const cacheKey = `verses:book:${book_id}:ch:${chapter_num}`;
    const cached   = await fastify.cache.get(cacheKey);
    if (cached) return { data: cached };

    const { data, error } = await fastify.supabase
      .from('verses')
      .select('id, book_id, chapter_num, verse_num, text_avd_ar, text_original, text_original_lang')
      .eq('book_id', book_id)
      .eq('chapter_num', chapter_num)
      .order('verse_num');

    if (error) return reply.status(500).send({ error: error.message });
    if (!data || data.length === 0) {
      return reply.status(404).send({
        error:   'NotFound',
        message: `No verses found for book ${book_id}, chapter ${chapter_num}`,
      });
    }

    await fastify.cache.set(cacheKey, data, TTL.VERSES);
    return {
      data,
      meta: {
        book_id,
        chapter_num,
        verse_count: data.length,
      },
    };
  });
}
