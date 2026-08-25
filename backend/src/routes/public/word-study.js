/**
 * src/routes/public/word-study.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Public endpoints for the Interlinear Word Study feature.
 * No authentication required.
 *
 * Endpoints:
 *   GET /api/v1/word-mappings?verse_id=uuid   — Interlinear table for a verse
 *   GET /api/v1/strongs/:strongsId            — Strong's entry with AR translation
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TTL } from '../../plugins/redis.js';

export default async function wordStudyRoutes(fastify) {

  // ── GET /word-mappings ───────────────────────────────────────────────────
  /**
   * Returns the full interlinear word table for a verse.
   * Each row maps one Arabic word to its corresponding Hebrew/Greek word,
   * with transliteration, Strong's number, morphology, and audio URL.
   */
  fastify.get('/word-mappings', {
    schema: {
      summary:     'Get word-by-word interlinear mapping for a verse',
      querystring: {
        type:     'object',
        required: ['verse_id'],
        properties: {
          verse_id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request, reply) => {
    const { verse_id } = request.query;
    const cacheKey     = `word-mappings:${verse_id}`;
    const cached       = await fastify.cache.get(cacheKey);
    if (cached) return { data: cached };

    const { data, error } = await fastify.supabase
      .from('word_mappings')
      .select('*')
      .eq('verse_id', verse_id)
      .order('ar_word_position');

    if (error) return reply.status(500).send({ error: error.message });

    if (!data || data.length === 0) {
      // Word mappings may not exist yet (admin hasn't aligned yet)
      return {
        data: [],
        meta: {
          verse_id,
          message: 'Word mappings not yet available for this verse',
        },
      };
    }

    // Sanitize nulls to empty strings to prevent Dart/Flutter type cast errors
    const sanitizedData = data.map(item => ({
      ...item,
      verse_id:            item.verse_id            ?? '',
      ar_word_normalized:  item.ar_word_normalized  ?? '',
      orig_morphology:     item.orig_morphology     ?? '',
      transliteration_ar:  item.transliteration_ar  ?? '',
      transliteration_lat: item.transliteration_lat ?? '',
      strongs_id:          item.strongs_id          ?? '',
      audio_url:           item.audio_url           ?? '',
      audio_duration_ms:   item.audio_duration_ms   ?? 0,
    }));

    // Cache for 5 minutes (admin edits will invalidate)
    await fastify.cache.set(cacheKey, sanitizedData, TTL.VERSES);

    return {
      data: sanitizedData,
      meta: {
        verse_id,
        word_count:    data.length,
        verified_count: data.filter(w => w.is_verified).length,
      },
    };
  });

  // ── GET /strongs/:strongsId ──────────────────────────────────────────────
  /**
   * Returns a Strong's dictionary entry with both English and Arabic definitions.
   * strongsId examples: H1, H7225, G3056
   */
  fastify.get('/strongs/:strongsId', {
    schema: {
      summary: 'Get a Strong\'s dictionary entry with Arabic translation',
      params:  {
        type: 'object',
        required: ['strongsId'],
        properties: {
          strongsId: { type: 'string', pattern: '^[HG]\\d+$' },
        },
      },
    },
  }, async (request, reply) => {
    const { strongsId } = request.params;
    const cacheKey      = `strongs:${strongsId}`;
    // const cached        = await fastify.cache.get(cacheKey);
    // if (cached) return { data: cached };

    // Fetch Strong's entry + Arabic translation in one join
    const { data: entry, error: entryError } = await fastify.supabase
      .from('strongs_entries')
      .select(`
        strongs_id,
        language,
        original_word,
        transliteration,
        root_word,
        pronunciation,
        audio_url,
        definition_en,
        kjv_usage,
        strongs_ar_translations (
          definition_ar,
          pronunciation_ar,
          notes_ar,
          is_verified
        )
      `)
      .eq('strongs_id', strongsId)
      .single();

    if (entryError || !entry) {
      return reply.status(404).send({
        error:   'NotFound',
        message: `Strong's entry ${strongsId} not found`,
      });
    }

    // Flatten the nested Arabic translation safely (PostgREST might return array or object)
    const trans = Array.isArray(entry.strongs_ar_translations)
      ? entry.strongs_ar_translations[0]
      : entry.strongs_ar_translations;

    const result = {
      strongs_id:      entry.strongs_id,
      language:        entry.language,
      original_word:   entry.original_word,
      transliteration: entry.transliteration,
      root_word:       entry.root_word,
      pronunciation:   entry.pronunciation,
      audio_url:       entry.audio_url,
      definition_en:   entry.definition_en,
      kjv_usage:       entry.kjv_usage,
      definition_ar:   trans?.definition_ar   ? '\u200F' + trans.definition_ar : null,
      pronunciation_ar:trans?.pronunciation_ar? '\u200F' + trans.pronunciation_ar : null,
      notes_ar:        trans?.notes_ar        ? '\u200F' + trans.notes_ar      : null,
      ar_is_verified:  trans?.is_verified     ?? false,
    };

    await fastify.cache.set(cacheKey, result, TTL.STRONGS);
    return { data: result };
  });

  // "?"? GET /strongs/:strongsId/occurrences "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
  /**
   * Returns a list of verses where a given Strong's number appears.
   */
  fastify.get('/strongs/:strongsId/occurrences', {
    schema: {
      summary: 'Get verses where a Strong\'s word appears',
      params:  {
        type: 'object',
        required: ['strongsId'],
        properties: {
          strongsId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { strongsId } = request.params;
    
    // Using Supabase to join word_mappings with verses.
    // Note: We use !inner to ensure we only get rows that match.
    // Also we fetch the book name from books table if possible.
    const { data, error } = await fastify.supabase
      .from('word_mappings')
      .select('ar_word, ar_word_position, verses!inner(id, book_id, chapter_num, verse_num, text_avd_ar, books(name_ar))')
      .eq('strongs_id', strongsId)
      .limit(30); // limit to 30 for performance

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    // Format data nicely for the mobile app
    const occurrences = data.map(item => ({
      ar_word: item.ar_word,
      ar_word_position: item.ar_word_position,
      verse_id: item.verses?.id,
      book_id: item.verses?.book_id,
      book_name_ar: item.verses?.books?.name_ar || '',
      chapter_num: item.verses?.chapter_num,
      verse_num: item.verses?.verse_num,
      text_avd_ar: item.verses?.text_avd_ar,
    }));

    // Deduplicate by verse_id, combining positions
    const uniqueMap = new Map();
    for (const occ of occurrences) {
      if (!uniqueMap.has(occ.verse_id)) {
        uniqueMap.set(occ.verse_id, {
          ...occ,
          ar_word_positions: occ.ar_word_position ? [occ.ar_word_position] : []
        });
      } else {
        if (occ.ar_word_position) {
          uniqueMap.get(occ.verse_id).ar_word_positions.push(occ.ar_word_position);
        }
      }
    }

    return { data: Array.from(uniqueMap.values()) };
  });
}
