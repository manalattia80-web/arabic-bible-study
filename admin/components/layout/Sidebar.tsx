'use client';
import Link      from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth }     from '@/lib/auth-context';

const NAV_ITEMS = [
  { href: '/dashboard',                label: 'Overview',          icon: '◈', section: 'main' },
  { href: '/dashboard/word-mappings',  label: 'Word Mappings',     icon: '⇌', section: 'content' },
  { href: '/dashboard/strongs',        label: 'Strong\'s Arabic',  icon: '𓂀', section: 'content' },
  { href: '/dashboard/verses',         label: 'Verse Texts',       icon: '✦', section: 'content' },
  { href: '/dashboard/audio',          label: 'Audio Files',       icon: '♪', section: 'content' },
  { href: '/dashboard/audit-log',      label: 'Audit Log',         icon: '☷', section: 'system' },
  { href: '/dashboard/users',          label: 'Admin Users',       icon: '⊙', section: 'system' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const mainItems    = NAV_ITEMS.filter(i => i.section === 'main');
  const contentItems = NAV_ITEMS.filter(i => i.section === 'content');
  const systemItems  = NAV_ITEMS.filter(i => i.section === 'system');

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📖</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">Bible Study CMS</span>
          <span className="sidebar-logo-sub">Admin Panel</span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="sidebar-section">
        <nav className="sidebar-nav">
          {mainItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content Management */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Content</div>
        <nav className="sidebar-nav">
          {contentItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* System */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">System</div>
        <nav className="sidebar-nav">
          {systemItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* User footer */}
      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.username?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name truncate">{user.username}</div>
              <div className="sidebar-user-role">{user.role?.replace('_', ' ')}</div>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-icon btn-sm" title="Sign out">⎋</button>
          </div>
        </div>
      )}
    </aside>
  );
}
