'use client';
import { useEffect, useState } from 'react';
import { navApi } from '@/lib/api';

interface Stats { books: number; chapters: number; verses: number; }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Rough stats from navigation endpoints
    Promise.all([navApi.books(), navApi.testaments()]).then(([booksRes]) => {
      setStats({ books: booksRes.data.length, chapters: 1189, verses: 31102 });
    }).catch(() => {});
  }, []);

  const STAT_CARDS = [
    { icon: '📚', label: 'Books', value: stats?.books ?? '—', color: '#d4a017', desc: '39 OT + 27 NT' },
    { icon: '📑', label: 'Chapters', value: stats?.chapters?.toLocaleString() ?? '—', color: '#3b82f6', desc: 'Across all books' },
    { icon: '✦', label: 'Verses', value: stats?.verses?.toLocaleString() ?? '—', color: '#10b981', desc: 'Total AVD verses' },
    { icon: '🔗', label: 'Word Mappings', value: '~561K', color: '#8b5cf6', desc: 'Hebrew + Greek words' },
    { icon: '𓂀', label: 'Strong\'s Entries', value: '~14.3K', color: '#f59e0b', desc: 'Hebrew + Greek lexicon' },
    { icon: '♪', label: 'Audio Files', value: '—', color: '#14b8a6', desc: 'Pronunciation recordings' },
  ];

  const QUICK_ACTIONS = [
    { href: '/dashboard/word-mappings', label: 'Edit Word Mappings', desc: 'Align Arabic ↔ Hebrew/Greek', icon: '⇌', color: 'var(--primary)' },
    { href: '/dashboard/strongs',       label: 'Translate Strong\'s', desc: 'Add Arabic definitions',     icon: '𓂀', color: '#8b5cf6' },
    { href: '/dashboard/audio',         label: 'Upload Audio',        desc: 'Add pronunciation files',    icon: '♪', color: '#14b8a6' },
    { href: '/dashboard/verses',        label: 'Fix Verses',          desc: 'Correct text discrepancies', icon: '✦', color: '#3b82f6' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">Arabic Van Dyck Bible Study — Content Management</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'1.25rem', fontFamily:'var(--font-arabic)', color:'var(--text-arabic)' }}>
          البحث الكتابي
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid" style={{ marginBottom:'1.5rem' }}>
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-accent" style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.25rem' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Quick Actions</div>
            <div className="card-subtitle">Most common content management tasks</div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid-2">
            {QUICK_ACTIONS.map(a => (
              <a key={a.href} href={a.href} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', transition:'all 150ms', textDecoration:'none' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = a.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ width:44, height:44, background:`${a.color}1a`, border:`1px solid ${a.color}40`, borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.9375rem', color:'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize:'0.8125rem', color:'var(--text-secondary)' }}>{a.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow reminder */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Content Workflow</div>
        </div>
        <div className="card-body">
          <ol style={{ display:'flex', flexDirection:'column', gap:'0.75rem', paddingLeft:'1.25rem' }}>
            {[
              ['Import data', 'Run the Phase 0 scripts to populate the database with AVD text + word mappings'],
              ['Translate Strong\'s', 'Visit Strong\'s Arabic to add Arabic meanings for each Strong\'s entry'],
              ['Align word mappings', 'Visit Word Mappings to map each Arabic word to its Hebrew/Greek counterpart'],
              ['Upload audio', 'Visit Audio Files to upload .mp3 pronunciations linked to Strong\'s IDs'],
              ['Verify & publish', 'Mark verified mappings — the Flutter app reads only verified rows first'],
            ].map(([title, desc], i) => (
              <li key={i} style={{ fontSize:'0.875rem' }}>
                <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{title}</span>
                <span style={{ color:'var(--text-secondary)' }}> — {desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
