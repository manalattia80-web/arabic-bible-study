/**
 * src/hooks/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Registers two Fastify decorators:
 *
 *  1. fastify.verifyJWT
 *     - Verifies the Bearer JWT in the Authorization header
 *     - Attaches decoded payload to request.user
 *     - Use as preHandler in any route that requires authentication
 *
 *  2. fastify.verifyRole(...roles)
 *     - Returns a preHandler that checks request.user.role
 *     - Use after verifyJWT for role-specific access control
 *
 * JWT Payload shape:
 *   { sub: "admin_user_uuid", username: "...", role: "super_admin|editor|reviewer" }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fp from 'fastify-plugin';

async function authPlugin(fastify) {
  /**
   * verifyJWT — validates the Authorization: Bearer <token> header.
   * Attaches the decoded payload to `request.user`.
   */
  fastify.decorate('verifyJWT', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        error:      'Unauthorized',
        message:    'Valid Bearer token required',
        statusCode: 401,
      });
    }
  });

  /**
   * verifyRole(...allowedRoles) — factory that returns a preHandler.
   *
   * Usage:
   *   preHandler: [fastify.verifyJWT, fastify.verifyRole('super_admin', 'editor')]
   */
  fastify.decorate('verifyRole', function (...allowedRoles) {
    return async function (request, reply) {
      const role = request.user?.role;
      if (!role || !allowedRoles.includes(role)) {
        reply.status(403).send({
          error:      'Forbidden',
          message:    `This action requires one of: ${allowedRoles.join(', ')}`,
          statusCode: 403,
        });
      }
    };
  });
}

export default fp(authPlugin, { name: 'auth' });
