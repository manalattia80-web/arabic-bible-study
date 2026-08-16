/**
 * src/routes/admin/audio.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin endpoints for managing audio pronunciation files.
 * Files are uploaded to Supabase Storage (S3-compatible).
 *
 * Endpoints:
 *   GET    /api/v1/admin/audio                       — list audio files
 *   POST   /api/v1/admin/audio/upload                — upload .mp3 file
 *   DELETE /api/v1/admin/audio/:id                   — remove audio file
 *   PATCH  /api/v1/admin/audio/link                  — link audio to word mapping
 * ─────────────────────────────────────────────────────────────────────────────
 */

import multipart  from '@fastify/multipart';
import { writeAuditLog } from '../../hooks/audit.js';

const AUDIO_BUCKET  = process.env.AUDIO_BUCKET || 'bible-audio';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default async function adminAudioRoutes(fastify) {

  // Register multipart support for file uploads
  await fastify.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE },
  });

  fastify.addHook('preHandler', fastify.verifyJWT);
  fastify.addHook('preHandler', fastify.verifyRole('super_admin', 'editor'));

  // ── GET / ──────────────────────────────────────────────────────────────
  fastify.get('/', {
    schema: {
      summary:     'List all audio files',
      querystring: {
        type: 'object',
        properties: {
          strongs_id: { type: 'string' },
          limit:      { type: 'integer', default: 50 },
          page:       { type: 'integer', default: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { strongs_id, limit = 50, page = 1 } = request.query;
    const offset = (page - 1) * limit;

    let query = fastify.supabase
      .from('audio_files')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (strongs_id) query = query.eq('strongs_id', strongs_id);

    const { data, count, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    return { data, meta: { total: count ?? 0, page, limit } };
  });

  // ── POST /upload ────────────────────────────────────────────────────────
  fastify.post('/upload', {
    schema: {
      summary: 'Upload a pronunciation audio file (.mp3) to Supabase Storage',
    },
  }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // Validate MIME type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav'];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.status(400).send({
        error: `Invalid file type: ${data.mimetype}. Allowed: mp3, ogg, wav`,
      });
    }

    // Extract metadata from form fields
    const strongsId       = data.fields.strongs_id?.value   ?? null;
    const wordMappingId   = data.fields.word_mapping_id?.value ?? null;
    const durationMs      = parseInt(data.fields.duration_ms?.value ?? '0', 10) || null;

    // Build a unique storage key
    const ext      = data.filename.split('.').pop();
    const fileKey  = strongsId
      ? `strongs/${strongsId}.${ext}`
      : `mappings/${wordMappingId ?? Date.now()}.${ext}`;

    // Read file buffer
    const fileBuffer = await data.toBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await fastify.supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileKey, fileBuffer, {
        contentType: data.mimetype,
        upsert:      true,
      });

    if (uploadError) {
      return reply.status(500).send({ error: `Storage upload failed: ${uploadError.message}` });
    }

    // Get the public URL
    const { data: urlData } = fastify.supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileKey);

    const fileUrl = urlData.publicUrl;

    // Save record to audio_files table
    const { data: record, error: dbError } = await fastify.supabase
      .from('audio_files')
      .upsert({
        strongs_id:      strongsId,
        word_mapping_id: wordMappingId,
        file_key:        fileKey,
        file_url:        fileUrl,
        mime_type:       data.mimetype,
        duration_ms:     durationMs,
        uploaded_by:     request.user.sub,
      }, { onConflict: 'file_key' })
      .select()
      .single();

    if (dbError) return reply.status(500).send({ error: dbError.message });

    // If linked to a Strong's ID, update word_mappings audio_url
    if (strongsId) {
      await fastify.supabase
        .from('word_mappings')
        .update({ audio_url: fileUrl, audio_duration_ms: durationMs })
        .eq('strongs_id', strongsId);

      // Invalidate Strong's cache
      await fastify.cache.del(`strongs:${strongsId}`);
    }

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'audio_files',
      recordId:  record.id,
      action:    'INSERT',
      newData:   record,
    });

    return reply.status(201).send({
      data: record,
      message: 'Audio file uploaded successfully',
    });
  });

  // ── DELETE /:id ────────────────────────────────────────────────────────
  fastify.delete('/:id', {
    schema: {
      summary: 'Delete an audio file from Storage and database',
      params: {
        type:       'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const { data: record } = await fastify.supabase
      .from('audio_files')
      .select('*')
      .eq('id', id)
      .single();

    if (!record) {
      return reply.status(404).send({ error: 'Audio file not found' });
    }

    // Remove from Supabase Storage
    const { error: storageError } = await fastify.supabase.storage
      .from(AUDIO_BUCKET)
      .remove([record.file_key]);

    if (storageError) {
      fastify.log.warn(`Storage delete failed for ${record.file_key}: ${storageError.message}`);
    }

    // Remove database record
    const { error: dbError } = await fastify.supabase
      .from('audio_files')
      .delete()
      .eq('id', id);

    if (dbError) return reply.status(500).send({ error: dbError.message });

    // Clear audio_url from any word_mappings pointing to this file
    await fastify.supabase
      .from('word_mappings')
      .update({ audio_url: null, audio_duration_ms: null })
      .eq('audio_url', record.file_url);

    if (record.strongs_id) {
      await fastify.cache.del(`strongs:${record.strongs_id}`);
    }

    await writeAuditLog(fastify, {
      adminId:   request.user.sub,
      tableName: 'audio_files',
      recordId:  id,
      action:    'DELETE',
      oldData:   record,
    });

    return reply.status(204).send();
  });

  // ── PATCH /link ─────────────────────────────────────────────────────────
  // Link an existing audio file URL to a specific word mapping
  fastify.patch('/link', {
    schema: {
      summary: 'Link an existing audio file to a word mapping',
      body: {
        type:     'object',
        required: ['word_mapping_id', 'audio_url'],
        properties: {
          word_mapping_id: { type: 'string', format: 'uuid' },
          audio_url:       { type: 'string', format: 'uri' },
          duration_ms:     { type: 'integer', nullable: true },
        },
      },
    },
  }, async (request, reply) => {
    const { word_mapping_id, audio_url, duration_ms } = request.body;

    const { data, error } = await fastify.supabase
      .from('word_mappings')
      .update({ audio_url, audio_duration_ms: duration_ms ?? null })
      .eq('id', word_mapping_id)
      .select('id, verse_id')
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Word mapping not found' });
    }

    await fastify.cache.del(`word-mappings:${data.verse_id}`);
    return { data };
  });
}
