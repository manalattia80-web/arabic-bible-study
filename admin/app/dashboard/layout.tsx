'use client';
import { useEffect }    from 'react';
import { useRouter }    from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/Sidebar';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'0.75rem', color:'var(--text-muted)' }}>
        <span className="spinner" /> Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8125rem', color:'var(--text-muted)' }}>
            <span style={{ color:'var(--primary-text)', fontFamily:'var(--font-arabic)' }}>البحث الكتابي العربي</span>
            <span>·</span>
            <span>Arabic Van Dyck Bible Study</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span className="badge badge-gold">{user.role?.replace('_', ' ')}</span>
            <span style={{ fontSize:'0.8125rem', color:'var(--text-secondary)' }}>{user.username}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
