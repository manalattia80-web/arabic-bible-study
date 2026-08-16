/**
 * src/routes/admin/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin authentication endpoints.
 * Uses Supabase Auth for credential verification, then issues our own
 * short-lived JWT containing the user's role.
 *
 * Endpoints:
 *   POST /api/v1/admin/auth/login   — returns JWT + user info
 *   POST /api/v1/admin/auth/logout  — clears session (client-side)
 *   GET  /api/v1/admin/auth/me      — returns current user from JWT
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default async function adminAuthRoutes(fastify) {

  // ── POST /login ──────────────────────────────────────────────────────────
  fastify.post('/login', {
    schema: {
      summary: 'Admin login — returns JWT',
      body: {
        type:     'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id:       { type: 'string' },
                username: { type: 'string' },
                email:    { type: 'string' },
                role:     { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;

    // 1. Sign in via Supabase Auth
    const { data: authData, error: authError } = await fastify.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user) {
      return reply.status(401).send({
        error:   'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const supabaseUser = authData.user;

    // 2. Fetch the admin profile (role, active status)
    const { data: profile, error: profileError } = await fastify.supabase
      .from('admin_users')
      .select('id, username, role, is_active')
      .eq('id', supabaseUser.id)
      .single();

    if (profileError || !profile) {
      return reply.status(403).send({
        error:   'Forbidden',
        message: 'This account is not registered as an admin',
      });
    }

    if (!profile.is_active) {
      return reply.status(403).send({
        error:   'Forbidden',
        message: 'Your account has been deactivated',
      });
    }

    // 3. Update last_login_at
    await fastify.supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', profile.id);

    // 4. Issue our own JWT with role embedded
    const token = fastify.jwt.sign({
      sub:      profile.id,
      username: profile.username,
      email:    supabaseUser.email,
      role:     profile.role,
    });

    return {
      token,
      user: {
        id:       profile.id,
        username: profile.username,
        email:    supabaseUser.email,
        role:     profile.role,
      },
    };
  });

  // ── POST /logout ─────────────────────────────────────────────────────────
  // JWT is stateless — client simply discards the token.
  // This endpoint exists for completeness and future session invalidation.
  fastify.post('/logout', {
    preHandler: [fastify.verifyJWT],
    schema: {
      summary: 'Admin logout (client should discard token)',
    },
  }, async (request) => {
    // Sign out from Supabase Auth session (optional, belt-and-suspenders)
    await fastify.supabase.auth.signOut();
    return { message: 'Logged out successfully' };
  });

  // ── GET /me ──────────────────────────────────────────────────────────────
  fastify.get('/me', {
    preHandler: [fastify.verifyJWT],
    schema: {
      summary: 'Get current authenticated admin user',
    },
  }, async (request, reply) => {
    const { sub } = request.user;

    const { data: profile, error } = await fastify.supabase
      .from('admin_users')
      .select('id, username, role, is_active, last_login_at, created_at')
      .eq('id', sub)
      .single();

    if (error || !profile) {
      return reply.status(404).send({ error: 'Admin user not found' });
    }

    return { data: profile };
  });
}
