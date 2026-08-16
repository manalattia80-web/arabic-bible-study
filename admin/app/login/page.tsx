'use client';
import { useState, FormEvent } from 'react';
import { useRouter }           from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function LoginForm() {
  const { login }        = useAuth();
  const router           = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">📖</div>
          <div style={{ textAlign: 'center' }}>
            <div className="login-logo-ar">البحث الكتابي العربي</div>
            <div className="login-logo-en">Arabic Bible Study · Admin Panel</div>
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider" />

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.625rem' }}>
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</>
            ) : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Authorized personnel only · Arabic AVD Bible Study
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
