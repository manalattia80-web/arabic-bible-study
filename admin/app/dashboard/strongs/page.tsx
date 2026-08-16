'use client';
import { useEffect, useState, useCallback } from 'react';
import { strongsArApi, StrongsArEntry } from '@/lib/api';
import { useToast } from '@/lib/use-toast';

export default function StrongsArPage() {
  const { success, error: showError, ToastContainer } = useToast();
  const [entries,  setEntries]  = useState<StrongsArEntry[]>([]);
  const [meta,     setMeta]     = useState({ total:0, page:1, limit:50 });
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState('');
  const [lang,     setLang]     = useState('');
  const [verified, setVerified] = useState('');
  const [editing,  setEditing]  = useState<Record<string, { definition_ar: string; notes_ar: string }>>({});
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newEntry, setNewEntry] = useState({ strongs_id:'', definition_ar:'', notes_ar:'' });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 50 };
      if (q)        params.q        = q;
      if (lang)     params.lang     = lang;
      if (verified) params.is_verified = verified === 'true';
      const res = await strongsArApi.list(params as Parameters<typeof strongsArApi.list>[0]);
      setEntries(res.data);
      setMeta({ ...res.meta, limit: 50 });
    } catch { showError('Failed to load translations'); }
    finally { setLoading(false); }
  }, [q, lang, verified, showError]);

  useEffect(() => { load(1); }, [load]);

  const startEdit = (e: StrongsArEntry) =>
    setEditing(p => ({ ...p, [e.strongs_id]: { definition_ar: e.definition_ar, notes_ar: e.notes_ar ?? '' } }));
  const cancelEdit = (id: string) => setEditing(p => { const n={...p}; delete n[id]; return n; });

  const saveEntry = async (strongsId: string) => {
    const patch = editing[strongsId];
    if (!patch) return;
    setSaving(p => ({ ...p, [strongsId]: true }));
    try {
      await strongsArApi.update(strongsId, patch);
      success('Saved ✓');
      cancelEdit(strongsId);
      load(meta.page);
    } catch (e: unknown) { showError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(p => ({ ...p, [strongsId]: false })); }
  };

  const verify = async (strongsId: string) => {
    try {
      await strongsArApi.verify(strongsId);
      success('Verified ✓');
      load(meta.page);
    } catch { showError('Verify failed'); }
  };

  const create = async () => {
    if (!newEntry.strongs_id || !newEntry.definition_ar) {
      showError('Strong\'s ID and Arabic definition are required'); return;
    }
    try {
      await strongsArApi.create(newEntry);
      success('Created ✓');
      setNewEntry({ strongs_id:'', definition_ar:'', notes_ar:'' });
      setShowCreate(false);
      load(1);
    } catch (e: unknown) { showError(e instanceof Error ? e.message : 'Create failed'); }
  };

  return (
    <div>
      <ToastContainer />

      <div className="page-header">
        <div>
          <h1 className="page-title">𓂀 Strong's Arabic Translations</h1>
          <p className="page-desc">Add and edit Arabic meanings for Strong's Hebrew and Greek dictionary entries</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>+ Add Translation</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div className="card-header"><div className="card-title">New Arabic Translation</div></div>
          <div className="card-body">
            <div className="grid-3" style={{ marginBottom:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Strong's ID (e.g. H7225)</label>
                <input className="input font-mono" placeholder="H7225" value={newEntry.strongs_id} onChange={e => setNewEntry(p => ({ ...p, strongs_id: e.target.value.toUpperCase() }))} />
              </div>
              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label className="form-label">Arabic Definition</label>
                <input className="input input-arabic" placeholder="المعنى بالعربية" value={newEntry.definition_ar} onChange={e => setNewEntry(p => ({ ...p, definition_ar: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:'1rem' }}>
              <label className="form-label">Notes (optional)</label>
              <textarea className="input textarea" placeholder="ملاحظات لاهوتية..." value={newEntry.notes_ar} onChange={e => setNewEntry(p => ({ ...p, notes_ar: e.target.value }))} style={{ direction:'rtl', textAlign:'right' }} />
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={create}>Create</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="search-row">
        <div className="search-input-wrapper">
          <span className="search-icon">⌕</span>
          <input className="input search-input" placeholder="Search by word, definition, or Strong's ID..."
            value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} />
        </div>
        <select className="input select" style={{ width:130 }} value={lang} onChange={e => setLang(e.target.value)}>
          <option value="">All Languages</option>
          <option value="hebrew">Hebrew</option>
          <option value="greek">Greek</option>
        </select>
        <select className="input select" style={{ width:130 }} value={verified} onChange={e => setVerified(e.target.value)}>
          <option value="">All Status</option>
          <option value="false">Pending</option>
          <option value="true">Verified</option>
        </select>
        <button className="btn btn-secondary" onClick={() => load(1)}>Search</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-subtitle">{meta.total.toLocaleString()} translations · Page {meta.page}</div>
        </div>
        {loading ? (
          <div className="loading-overlay"><span className="spinner" /> Loading...</div>
        ) : (
          <>
            <div className="table-wrapper" style={{ borderRadius:0, border:'none' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width:80 }}>ID</th>
                    <th>Language</th>
                    <th>Original Word</th>
                    <th>English Definition</th>
                    <th className="rtl">Arabic Definition</th>
                    <th>Status</th>
                    <th style={{ width:160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const ed = editing[e.strongs_id];
                    return (
                      <tr key={e.strongs_id}>
                        <td><span className="font-mono" style={{ color:'var(--accent-blue)', fontSize:'0.8125rem' }}>{e.strongs_id}</span></td>
                        <td><span className={`badge ${e.strongs_entries?.language === 'hebrew' ? 'badge-hebrew' : 'badge-greek'}`}>{e.strongs_entries?.language ?? '—'}</span></td>
                        <td>
                          <span className={e.strongs_entries?.language === 'hebrew' ? 'cell-hebrew' : 'cell-greek'} style={{ fontSize:'1rem' }}>
                            {e.strongs_entries?.original_word ?? '—'}
                          </span>
                          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{e.strongs_entries?.transliteration}</div>
                        </td>
                        <td style={{ maxWidth:220, fontSize:'0.8125rem', color:'var(--text-secondary)', lineHeight:1.5 }}>
                          {e.strongs_entries?.definition_en?.slice(0, 120)}{(e.strongs_entries?.definition_en?.length ?? 0) > 120 ? '…' : ''}
                        </td>
                        <td>
                          {ed ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                              <input className="input input-arabic" style={{ padding:'4px 8px' }} value={ed.definition_ar} onChange={ev => setEditing(p => ({ ...p, [e.strongs_id]: { ...p[e.strongs_id], definition_ar: ev.target.value } }))} />
                              <textarea className="input textarea" style={{ padding:'4px 8px', minHeight:56, direction:'rtl', textAlign:'right', fontSize:'0.8125rem' }} value={ed.notes_ar} onChange={ev => setEditing(p => ({ ...p, [e.strongs_id]: { ...p[e.strongs_id], notes_ar: ev.target.value } }))} placeholder="ملاحظات..." />
                            </div>
                          ) : (
                            <div>
                              <div className="cell-arabic" style={{ fontSize:'1rem' }}>{e.definition_ar}</div>
                              {e.notes_ar && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{e.notes_ar.slice(0,80)}</div>}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${e.is_verified ? 'badge-success' : 'badge-warning'}`}>
                            {e.is_verified ? '✓ verified' : '● pending'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                            {ed ? (
                              <>
                                <button className="btn btn-primary btn-xs" onClick={() => saveEntry(e.strongs_id)} disabled={saving[e.strongs_id]}>{saving[e.strongs_id] ? '...' : '✓ Save'}</button>
                                <button className="btn btn-ghost btn-xs" onClick={() => cancelEdit(e.strongs_id)}>✕</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-secondary btn-xs" onClick={() => startEdit(e)}>Edit</button>
                                {!e.is_verified && <button className="btn btn-success btn-xs" onClick={() => verify(e.strongs_id)}>✓ Verify</button>}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span>Showing {entries.length} of {meta.total.toLocaleString()}</span>
              <div className="pagination-btns">
                <button className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>← Prev</button>
                <button className="btn btn-secondary btn-sm" disabled={entries.length < meta.limit} onClick={() => load(meta.page + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
