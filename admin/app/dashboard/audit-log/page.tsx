'use client';
import { useEffect, useState, useCallback } from 'react';
import { usersApi, AuditLogEntry } from '@/lib/api';
import { useToast } from '@/lib/use-toast';

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'badge-success',
  UPDATE: 'badge-info',
  DELETE: 'badge-danger',
};

const TABLE_ICONS: Record<string, string> = {
  word_mappings:          '⇌',
  strongs_ar_translations:'𓂀',
  verses:                 '✦',
  audio_files:            '♪',
};

export default function AuditLogPage() {
  const { error: showError, ToastContainer } = useToast();
  const [logs,     setLogs]     = useState<AuditLogEntry[]>([]);
  const [meta,     setMeta]     = useState({ total:0, page:1, limit:50, total_pages:1 });
  const [loading,  setLoading]  = useState(true);
  const [action,   setAction]   = useState('');
  const [tableName,setTableName]= useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await usersApi.auditLog({ action: action || undefined, table_name: tableName || undefined, page });
      setLogs(res.data);
      setMeta({ ...res.meta, limit: res.meta.limit ?? 50 });
    } catch { showError('Failed to load audit log'); }
    finally { setLoading(false); }
  }, [action, tableName, showError]);

  useEffect(() => { load(1); }, [load]);

  const fmt = (ts: string) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`;
  };

  return (
    <div>
      <ToastContainer />

      <div className="page-header">
        <div>
          <h1 className="page-title">☷ Audit Log</h1>
          <p className="page-desc">Complete history of all admin content changes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="search-row" style={{ marginBottom:'1.25rem' }}>
        <select className="input select" style={{ width:150 }} value={action} onChange={e => setAction(e.target.value)}>
          <option value="">All Actions</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select className="input select" style={{ width:200 }} value={tableName} onChange={e => setTableName(e.target.value)}>
          <option value="">All Tables</option>
          <option value="word_mappings">Word Mappings</option>
          <option value="strongs_ar_translations">Strong's Arabic</option>
          <option value="verses">Verses</option>
          <option value="audio_files">Audio Files</option>
        </select>
        <button className="btn btn-secondary" onClick={() => load(1)}>Apply</button>
        <button className="btn btn-ghost" onClick={() => { setAction(''); setTableName(''); }}>Clear</button>
        <span style={{ marginLeft:'auto', fontSize:'0.8125rem', color:'var(--text-muted)' }}>{meta.total.toLocaleString()} total changes</span>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-overlay"><span className="spinner" /> Loading audit log...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">☷</div>
            <div className="empty-state-title">No Log Entries</div>
            <div className="empty-state-desc">Admin changes will appear here as they are made</div>
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ borderRadius:0, border:'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Table</th>
                    <th>Record ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <>
                      <tr key={log.id} style={{ cursor:'pointer' }} onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        <td style={{ fontSize:'0.8125rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmt(log.created_at)}</td>
                        <td>
                          <div style={{ fontWeight:500, fontSize:'0.875rem' }}>{log.admin_users?.username ?? '—'}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{log.admin_users?.role?.replace('_',' ')}</div>
                        </td>
                        <td><span className={`badge ${ACTION_COLORS[log.action] ?? 'badge-info'}`}>{log.action}</span></td>
                        <td>
                          <span style={{ marginRight:'0.375rem' }}>{TABLE_ICONS[log.table_name] ?? '☰'}</span>
                          <span style={{ fontSize:'0.8125rem', fontFamily:'var(--font-mono)', color:'var(--text-secondary)' }}>{log.table_name}</span>
                        </td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--text-muted)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {log.record_id}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-xs">{expandedId === log.id ? '▲ Hide' : '▼ Show'}</button>
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr key={`${log.id}-details`}>
                          <td colSpan={6} style={{ background:'var(--bg-surface)', padding:'1rem 1.5rem' }}>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                              {log.old_data && (
                                <div>
                                  <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--danger)', marginBottom:'0.5rem' }}>BEFORE</div>
                                  <pre style={{ fontSize:'0.75rem', color:'var(--text-secondary)', background:'var(--bg-card)', padding:'0.75rem', borderRadius:'var(--radius)', overflow:'auto', maxHeight:200 }}>
                                    {JSON.stringify(log.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_data && (
                                <div>
                                  <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--success)', marginBottom:'0.5rem' }}>AFTER</div>
                                  <pre style={{ fontSize:'0.75rem', color:'var(--text-secondary)', background:'var(--bg-card)', padding:'0.75rem', borderRadius:'var(--radius)', overflow:'auto', maxHeight:200 }}>
                                    {JSON.stringify(log.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>Page {meta.page} of {meta.total_pages}</span>
              <div className="pagination-btns">
                <button className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>← Prev</button>
                <button className="btn btn-secondary btn-sm" disabled={meta.page >= (meta.total_pages ?? 1)} onClick={() => load(meta.page + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
