/**
 * src/server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Main Fastify server entry point.
 * Registers all plugins, hooks, and routes, then starts listening.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors    from '@fastify/cors';
import jwt     from '@fastify/jwt';

import supabasePlugin from './plugins/supabase.js';
import redisPlugin    from './plugins/redis.js';
import authHook       from './hooks/auth.js';

// Public routes
import navigationRoutes from './routes/public/navigation.js';
import wordStudyRoutes  from './routes/public/word-study.js';
import searchRoutes     from './routes/public/search.js';
import importRoutes     from './routes/import.js';

// Admin routes
import adminAuthRoutes         from './routes/admin/auth.js';
import adminWordMappingRoutes  from './routes/admin/word-mappings.js';
import adminStrongsArRoutes    from './routes/admin/strongs-ar.js';
import adminVersesRoutes       from './routes/admin/verses.js';
import adminAudioRoutes        from './routes/admin/audio.js';
import adminUsersRoutes        from './routes/admin/users.js';

// ─── Create Fastify instance ──────────────────────────────────────────────────
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// ─── Register core plugins ────────────────────────────────────────────────────

// CORS — allow Flutter app and Admin Panel
await fastify.register(cors, {
  origin: true,   // Allow all origins; restrict in production to known domains
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// JWT
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
  sign: { expiresIn: process.env.JWT_EXPIRY || '8h' },
});

// Supabase client (accessible as fastify.supabase)
await fastify.register(supabasePlugin);

// Redis cache (accessible as fastify.cache) — gracefully disabled if not configured
await fastify.register(redisPlugin);

// Auth decorator (fastify.verifyJWT + fastify.verifyRole)
await fastify.register(authHook);

// ─── Global request logging ───────────────────────────────────────────────────
fastify.addHook('onRequest', async (request) => {
  request.startTime = Date.now();
});

// ─── Health check ─────────────────────────────────────────────────────────────
fastify.get('/health', async () => ({
  status:    'ok',
  timestamp: new Date().toISOString(),
  version:   '1.0.0',
}));

// ─── Public routes ────────────────────────────────────────────────────────────
await fastify.register(navigationRoutes, { prefix: '/api/v1' });
await fastify.register(wordStudyRoutes,  { prefix: '/api/v1' });
await fastify.register(searchRoutes,     { prefix: '/api/v1/search' });
await fastify.register(importRoutes,     { prefix: '/api/v1' });

// ─── Admin routes (all require JWT) ──────────────────────────────────────────
await fastify.register(adminAuthRoutes,        { prefix: '/api/v1/admin/auth' });
await fastify.register(adminWordMappingRoutes, { prefix: '/api/v1/admin/word-mappings' });
await fastify.register(adminStrongsArRoutes,   { prefix: '/api/v1/admin/strongs-ar' });
await fastify.register(adminVersesRoutes,      { prefix: '/api/v1/admin/verses' });
await fastify.register(adminAudioRoutes,       { prefix: '/api/v1/admin/audio' });
await fastify.register(adminUsersRoutes,       { prefix: '/api/v1/admin/users' });

// ─── Global error handler ─────────────────────────────────────────────────────
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;

  fastify.log.error({
    err:    error.message,
    url:    request.url,
    method: request.method,
  });

  reply.status(statusCode).send({
    error:   error.name || 'InternalServerError',
    message: statusCode < 500 ? error.message : 'An unexpected error occurred',
    statusCode,
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    error:   'NotFound',
    message: `Route ${request.method} ${request.url} not found`,
    statusCode: 404,
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`🚀 Arabic Bible API running on http://${host}:${port}`);
    fastify.log.info(`📖 Health check: http://${host}:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
