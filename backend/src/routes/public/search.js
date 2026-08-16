/**
 * src/routes/public/search.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-text search endpoints using PostgreSQL pg_trgm GIN indexes.
 * No authentication required. Results are NOT cached (too variable).
 *
 * Endpoints:
 *   GET /api/v1/search/verses?q=text&testament_id=1&limit=20&page=1
 *   GET /api/v1/search/strongs?q=word&lang=hebrew&limit=20
 *   GET /api/v1/search/word-mappings?q=ar_word&limit=20
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MAX_LIMIT     = 100;
const DEFAULT_LIMIT = 20;

export default async function searchRoutes(fastify) {

  // ── GET /search/verses ───────────────────────────────────────────────────
  /**
   * Search Arabic or original text across all verses.
   * Uses trigram similarity for fuzzy matching.
   * Supports pagination via page/limit.
   */
  fastify.get('/verses', {
    schema: {
      summary:     'Full-text search across Bible verses',
      querystring: {
        type:     'object',
        required: ['q'],
        properties: {
          q:            { type: 'string', minLength: 2 },
          testament_id: { type: 'integer' },
          book_id:      { type: 'integer' },
          limit:        { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
          page:         { type: 'integer', minimum: 1, default: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { q, testament_id, book_id, limit = DEFAULT_LIMIT, page = 1 } = request.query;
    const offset = (page - 1) * limit;

    // Use Supabase's text search (ilike with trigrams)
    // For Arabic text: search text_avd_ar
    // Also search text_original for Greek/Hebrew scholars
    let query = fastify.supabase
      .from('verses')
      .select(`
        id,
        book_id,
        chapter_num,
        verse_num,
        text_avd_ar,
        text_original,
        text_original_lang,
        books!inner (name_ar, name_en, name_ar_short)
      `, { count: 'exact' })
      .or(`text_avd_ar.ilike.%${q}%,text_original.ilike.%${q}%`)
      .order('book_id')
      .order('chapter_num')
      .order('verse_num')
      .range(offset, offset + limit - 1);

    if (testament_id) {
      query = query.eq('books.testament_id', testament_id);
    }
    if (book_id) {
      query = query.eq('book_id', book_id);
    }

    const { data, count, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    return {
      data,
      meta: {
        query:       q,
        total:       count ?? 0,
        page,
        limit,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    };
  });

  // ── GET /search/strongs ──────────────────────────────────────────────────
  /**
   * Search Strong's dictionary by original word or English definition.
   */
  fastify.get('/strongs', {
    schema: {
      summary:     'Search Strong\'s dictionary by word or definition',
      querystring: {
        type:     'object',
        required: ['q'],
        properties: {
          q:     { type: 'string', minLength: 1 },
          lang:  { type: 'string', enum: ['hebrew', 'greek'] },
          limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
        },
      },
    },
  }, async (request, reply) => {
    const { q, lang, limit = DEFAULT_LIMIT } = request.query;

    let query = fastify.supabase
      .from('strongs_entries')
      .select(`
        strongs_id,
        language,
        original_word,
        transliteration,
        definition_en,
        strongs_ar_translations ( definition_ar )
      `)
      .or(`original_word.ilike.%${q}%,definition_en.ilike.%${q}%,transliteration.ilike.%${q}%`)
      .order('strongs_id')
      .limit(limit);

    if (lang) query = query.eq('language', lang);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    // Flatten AR translation
    const results = data.map(e => ({
      strongs_id:      e.strongs_id,
      language:        e.language,
      original_word:   e.original_word,
      transliteration: e.transliteration,
      definition_en:   e.definition_en,
      definition_ar:   e.strongs_ar_translations?.definition_ar ?? null,
    }));

    return { data: results, meta: { query: q, lang, count: results.length } };
  });

  // ── GET /search/word-mappings ────────────────────────────────────────────
  /**
   * Find all verses containing a specific Arabic or original-language word.
   * Useful for concordance-style lookups.
   */
  fastify.get('/word-mappings', {
    schema: {
      summary:     'Find all occurrences of an Arabic or original-language word',
      querystring: {
        type:     'object',
        required: ['q'],
        properties: {
          q:    { type: 'string', minLength: 1 },
          lang: { type: 'string', enum: ['hebrew', 'greek'] },
          limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
          page:  { type: 'integer', minimum: 1, default: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { q, lang, limit = DEFAULT_LIMIT, page = 1 } = request.query;
    const offset = (page - 1) * limit;

    let query = fastify.supabase
      .from('word_mappings')
      .select(`
        id,
        ar_word,
        orig_word,
        orig_word_lang,
        strongs_id,
        verse_id,
        verses!inner ( book_id, chapter_num, verse_num, text_avd_ar,
          books!inner ( name_ar, name_en )
        )
      `, { count: 'exact' })
      .or(`ar_word.ilike.%${q}%,orig_word.ilike.%${q}%`)
      .order('verse_id')
      .range(offset, offset + limit - 1);

    if (lang) query = query.eq('orig_word_lang', lang);

    const { data, count, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    return {
      data,
      meta: {
        query:       q,
        total:       count ?? 0,
        page,
        limit,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    };
  });
}
