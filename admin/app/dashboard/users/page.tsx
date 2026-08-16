'use client';
import { useEffect, useState } from 'react';
import { usersApi, AdminUser }  from '@/lib/api';
import { useAuth }              from '@/lib/auth-context';
import { useToast }             from '@/lib/use-toast';

export default function UsersPage() {
  const { user: me } = useAuth();
  const { success, error: showError, ToastContainer } = useToast();
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email:'', password:'', username:'', role:'editor' });

  const load = () => {
    setLoading(true);
    usersApi.list()
      .then(r => setUsers(r.data))
      .catch(() => showError('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await usersApi.create(form);
      success('Admin user created ✓');
      setForm({ email:'', password:'', username:'', role:'editor' });
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Create failed');
    } finally { setCreating(false); }
  };

  const toggleActive = async (u: AdminUser) => {
    try {
      await usersApi.update(u.id, { is_active: !u.is_active });
      success(u.is_active ? 'User deactivated' : 'User reactivated');
      load();
    } catch { showError('Update failed'); }
  };

  const changeRole = async (u: AdminUser, role: string) => {
    try {
      await usersApi.update(u.id, { role });
      success('Role updated ✓');
      load();
    } catch { showError('Update failed'); }
  };

  const isSuperAdmin = me?.role === 'super_admin';
  const ROLE_COLORS: Record<string, string> = { super_admin:'badge-gold', editor:'badge-info', reviewer:'badge-warning' };

  return (
    <div>
      <ToastContainer />

      <div className="page-header">
        <div>
          <h1 className="page-title">⊙ Admin Users</h1>
          <p className="page-desc">Manage admin accounts and their roles</p>
        </div>
        {isSuperAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>+ Add Admin</button>
        )}
      </div>

      {/* Create form */}
      {showCreate && isSuperAdmin && (
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div className="card-header"><div className="card-title">New Admin User</div></div>
          <form className="card-body" onSubmit={createUser}>
            <div className="grid-2" style={{ marginBottom:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="input" placeholder="john_editor" required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="input" placeholder="john@example.com" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password (min 8 chars)</label>
                <input type="password" className="input" placeholder="••••••••" minLength={8} required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="input select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="reviewer">Reviewer — view only, can verify</option>
                  <option value="editor">Editor — create and edit content</option>
                  <option value="super_admin">Super Admin — full access</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                {creating ? <><span className="spinner" style={{ width:14, height:14 }} /> Creating...</> : 'Create User'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        {loading ? (
          <div className="loading-overlay"><span className="spinner" /> Loading users...</div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius:0, border:'none' }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  {isSuperAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                        <div style={{ width:32, height:32, background:'linear-gradient(135deg,var(--primary),var(--primary-dim))', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:700, color:'var(--bg-base)', flexShrink:0 }}>
                          {u.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:500, fontSize:'0.9375rem' }}>
                            {u.username}
                            {u.id === me?.id && <span className="badge badge-gold" style={{ marginLeft:'0.375rem' }}>You</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isSuperAdmin && u.id !== me?.id ? (
                        <select className="input select" style={{ padding:'2px 28px 2px 8px', fontSize:'0.8125rem', width:'auto' }}
                          value={u.role} onChange={e => changeRole(u, e.target.value)}>
                          <option value="reviewer">Reviewer</option>
                          <option value="editor">Editor</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      ) : (
                        <span className={`badge ${ROLE_COLORS[u.role] ?? 'badge-info'}`}>{u.role?.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>
                      {u.id}
                    </td>
                    {isSuperAdmin && (
                      <td>
                        {u.id !== me?.id && (
                          <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(u)}>
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role guide */}
      <div className="card" style={{ marginTop:'1.5rem' }}>
        <div className="card-header"><div className="card-title">Role Permissions</div></div>
        <div className="card-body">
          <div className="grid-3">
            {[
              { role:'Reviewer',    badge:'badge-warning', perms:['View all content','Verify word mappings','Verify Strong\'s translations','View audit log'] },
              { role:'Editor',      badge:'badge-info',    perms:['All Reviewer permissions','Create / Edit word mappings','Create / Edit Arabic Strong\'s','Upload / Delete audio files','Edit verse texts'] },
              { role:'Super Admin', badge:'badge-gold',    perms:['All Editor permissions','Create / manage admin users','Change user roles','Deactivate accounts','View full audit log'] },
            ].map(r => (
              <div key={r.role} style={{ padding:'1rem', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)' }}>
                <span className={`badge ${r.badge}`} style={{ marginBottom:'0.75rem', display:'inline-flex' }}>{r.role}</span>
                <ul style={{ display:'flex', flexDirection:'column', gap:'0.375rem', paddingLeft:'1rem' }}>
                  {r.perms.map(p => <li key={p} style={{ fontSize:'0.8125rem', color:'var(--text-secondary)' }}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
