/**
 * src/routes/admin/users.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin user management + audit log viewer.
 * Most routes require super_admin role.
 *
 * Endpoints:
 *   GET   /api/v1/admin/users           — list all admin users
 *   POST  /api/v1/admin/users           — create new admin via Supabase Auth
 *   PATCH /api/v1/admin/users/:id       — update role or active status
 *   GET   /api/v1/admin/users/audit-log — view change history
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default async function adminUsersRoutes(fastify) {

  fastify.addHook('preHandler', fastify.verifyJWT);

  // ── GET / ──────────────────────────────────────────────────────────────
  // All authenticated admins can view the user list
  fastify.get('/', {
    preHandler: [fastify.verifyRole('super_admin', 'editor', 'reviewer')],
    schema: {
      summary: 'List all admin users',
    },
  }, async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('admin_users')
      .select('id, username, role, is_active, last_login_at, created_at')
      .order('created_at', { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return { data };
  });

  // ── POST / ─────────────────────────────────────────────────────────────
  // Only super_admin can create new admins
  fastify.post('/', {
    preHandler: [fastify.verifyRole('super_admin')],
    schema: {
      summary: 'Create a new admin user (via Supabase Auth)',
      body: {
        type:     'object',
        required: ['email', 'password', 'username', 'role'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          username: { type: 'string', minLength: 3 },
          role:     { type: 'string', enum: ['super_admin', 'editor', 'reviewer'] },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password, username, role } = request.body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await fastify.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already')) {
        return reply.status(409).send({ error: `User with email ${email} already exists` });
      }
      return reply.status(500).send({ error: authError.message });
    }

    // 2. Create admin profile linked to Supabase Auth user
    const { data: profile, error: profileError } = await fastify.supabase
      .from('admin_users')
      .insert({
        id:       authData.user.id,
        username,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete the Supabase Auth user
      await fastify.supabase.auth.admin.deleteUser(authData.user.id);
      return reply.status(500).send({ error: profileError.message });
    }

    return reply.status(201).send({
      data: {
        id:       profile.id,
        username: profile.username,
        email,
        role:     profile.role,
      },
    });
  });

  // ── PATCH /:id ─────────────────────────────────────────────────────────
  // Only super_admin can update roles; admins can update their own username
  fastify.patch('/:id', {
    schema: {
      summary: 'Update an admin user\'s role or active status',
      params: {
        type:       'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        properties: {
          role:      { type: 'string', enum: ['super_admin', 'editor', 'reviewer'] },
          is_active: { type: 'boolean' },
          username:  { type: 'string', minLength: 3 },
        },
        minProperties: 1,
      },
    },
  }, async (request, reply) => {
    const { id }   = request.params;
    const isSelf   = request.user.sub === id;
    const isSuper  = request.user.role === 'super_admin';

    // Only super_admin can change roles/status; regular admins can only update own username
    if (!isSuper && !isSelf) {
      return reply.status(403).send({ error: 'You can only edit your own profile' });
    }
    if (!isSuper && (request.body.role || request.body.is_active !== undefined)) {
      return reply.status(403).send({ error: 'Only super_admin can change roles or status' });
    }

    const { data, error } = await fastify.supabase
      .from('admin_users')
      .update(request.body)
      .eq('id', id)
      .select('id, username, role, is_active')
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Admin user not found' });
    }

    return { data };
  });

  // ── GET /audit-log ─────────────────────────────────────────────────────
  fastify.get('/audit-log', {
    preHandler: [fastify.verifyRole('super_admin', 'editor', 'reviewer')],
    schema: {
      summary:     'View the admin audit log',
      querystring: {
        type: 'object',
        properties: {
          admin_id:   { type: 'string', format: 'uuid' },
          table_name: { type: 'string' },
          action:     { type: 'string', enum: ['INSERT', 'UPDATE', 'DELETE'] },
          from_date:  { type: 'string', format: 'date' },
          to_date:    { type: 'string', format: 'date' },
          limit:      { type: 'integer', minimum: 1, maximum: 200, default: 50 },
          page:       { type: 'integer', minimum: 1, default: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { admin_id, table_name, action, from_date, to_date, limit = 50, page = 1 } = request.query;
    const offset = (page - 1) * limit;

    let query = fastify.supabase
      .from('audit_log')
      .select(`
        id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        created_at,
        admin_users!inner ( username, role )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (admin_id)   query = query.eq('admin_id', admin_id);
    if (table_name) query = query.eq('table_name', table_name);
    if (action)     query = query.eq('action', action);
    if (from_date)  query = query.gte('created_at', from_date);
    if (to_date)    query = query.lte('created_at', `${to_date}T23:59:59`);

    const { data, count, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });

    return {
      data,
      meta: {
        total: count ?? 0,
        page,
        limit,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    };
  });
}
