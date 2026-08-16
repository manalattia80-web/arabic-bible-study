'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter }              from 'next/navigation';
import { wordMappingApi, versesAdminApi, WordMapping, Verse } from '@/lib/api';
import { useToast } from '@/lib/use-toast';

export default function WordMappingEditorPage() {
  const { verseId } = useParams<{ verseId: string }>();
  const router      = useRouter();
  const { success, error: showError, ToastContainer } = useToast();

  const [verse,    setVerse]    = useState<Verse | null>(null);
  const [mappings, setMappings] = useState<WordMapping[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<Record<string, Partial<WordMapping>>>({});
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow,   setNewRow]   = useState<Partial<WordMapping>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes] = await Promise.all([wordMappingApi.list(verseId)]);
      setMappings(mRes.data);
    } catch { showError('Failed to load word mappings'); }
    finally { setLoading(false); }
  }, [verseId, showError]);

  useEffect(() => { load(); }, [load]);

  // Inline editing helpers
  const startEdit = (m: WordMapping) => setEditing(p => ({ ...p, [m.id]: { ...m } }));
  const cancelEdit = (id: string) => setEditing(p => { const n = { ...p }; delete n[id]; return n; });
  const setField = (id: string, field: keyof WordMapping, value: string | number) =>
    setEditing(p => ({ ...p, [id]: { ...p[id], [field]: value } }));

  const saveMapping = async (id: string) => {
    const patch = editing[id];
    if (!patch) return;
    setSaving(p => ({ ...p, [id]: true }));
    try {
      await wordMappingApi.update(id, patch);
      success('Mapping saved');
      setEditing(p => { const n = { ...p }; delete n[id]; return n; });
      load();
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(p => ({ ...p, [id]: false }));
    }
  };

  const deleteMapping = async (id: string) => {
    if (!confirm('Delete this word mapping?')) return;
    try {
      await wordMappingApi.delete(id);
      success('Mapping deleted');
      load();
    } catch { showError('Delete failed'); }
  };

  const verifyMapping = async (id: string) => {
    try {
      await wordMappingApi.verify(id);
      success('Marked as verified ✓');
      load();
    } catch { showError('Verify failed'); }
  };

  const bulkVerify = async () => {
    if (!confirm('Mark ALL word mappings in this verse as verified?')) return;
    try {
      const r = await wordMappingApi.bulkVerify(verseId);
      success(`${r.data.updated_count} mappings verified`);
      load();
    } catch { showError('Bulk verify failed'); }
  };

  const addMapping = async () => {
    if (!newRow.ar_word || !newRow.orig_word) {
      showError('Arabic word and Original word are required'); return;
    }
    try {
      await wordMappingApi.create({ ...newRow, verse_id: verseId, orig_word_lang: newRow.orig_word_lang ?? 'hebrew' });
      success('Mapping added');
      setNewRow({}); setShowAddRow(false);
      load();
    } catch (e: unknown) { showError(e instanceof Error ? e.message : 'Add failed'); }
  };

  const verifiedCount = mappings.filter(m => m.is_verified).length;

  return (
    <div>
      <ToastContainer />

      {/* Back + Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
        <span style={{ color:'var(--border-light)' }}>|</span>
        <h1 className="page-title" style={{ fontSize:'1.25rem' }}>⇌ Word Mapping Editor</h1>
        {verse && (
          <span style={{ fontSize:'0.8125rem', color:'var(--primary-text)', fontFamily:'var(--font-mono)' }}>
            Book {verse.book_id} · {verse.chapter_num}:{verse.verse_num}
          </span>
        )}
      </div>

      {/* Verse display */}
      {verse && (
        <div className="verse-display">
          <div className="verse-ref">📖 {verse.chapter_num}:{verse.verse_num}</div>
          <div className="verse-text-arabic">{verse.text_avd_ar}</div>
          <div className={`verse-text-original ${verse.text_original_lang}`}>{verse.text_original}</div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)' }}>
            {mappings.length} words ·{' '}
            <span style={{ color:'var(--success)' }}>{verifiedCount} verified</span>
            {' '}· {mappings.length - verifiedCount} pending
          </span>
          {mappings.length > 0 && (
            <div style={{ width:120, height:6, background:'var(--border)', borderRadius:'var(--radius-full)', overflow:'hidden' }}>
              <div style={{ width:`${(verifiedCount/mappings.length)*100}%`, height:'100%', background:'var(--success)', borderRadius:'var(--radius-full)', transition:'width 300ms' }} />
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddRow(v => !v)}>+ Add Row</button>
          {mappings.length > 0 && <button className="btn btn-success btn-sm" onClick={bulkVerify}>✓ Verify All</button>}
        </div>
      </div>

      {/* Add Row Form */}
      {showAddRow && (
        <div className="card" style={{ marginBottom:'1rem', padding:'1rem' }}>
          <div style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.75rem', color:'var(--primary-text)' }}>+ New Word Mapping</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.75rem', marginBottom:'0.75rem' }}>
            <div className="form-group">
              <label className="form-label">AR Position</label>
              <input type="number" className="input" placeholder="1" value={newRow.ar_word_position ?? ''} onChange={e => setNewRow(p => ({ ...p, ar_word_position: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Arabic Word</label>
              <input className="input input-arabic" placeholder="الكلمة" value={newRow.ar_word ?? ''} onChange={e => setNewRow(p => ({ ...p, ar_word: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Original Word</label>
              <input className="input input-hebrew" placeholder="בְּרֵאשִׁית" value={newRow.orig_word ?? ''} onChange={e => setNewRow(p => ({ ...p, orig_word: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="input select" value={newRow.orig_word_lang ?? 'hebrew'} onChange={e => setNewRow(p => ({ ...p, orig_word_lang: e.target.value }))}>
                <option value="hebrew">Hebrew</option>
                <option value="greek">Greek</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Translit (AR)</label>
              <input className="input" placeholder="بِرِيشِيت" value={newRow.transliteration_ar ?? ''} onChange={e => setNewRow(p => ({ ...p, transliteration_ar: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Strong's ID</label>
              <input className="input font-mono" placeholder="H7225" value={newRow.strongs_id ?? ''} onChange={e => setNewRow(p => ({ ...p, strongs_id: e.target.value }))} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={addMapping}>Add Mapping</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddRow(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Mappings Table */}
      {loading ? (
        <div className="loading-overlay"><span className="spinner" /> Loading word mappings...</div>
      ) : mappings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⇌</div>
          <div className="empty-state-title">No Word Mappings Yet</div>
          <div className="empty-state-desc">Click "+ Add Row" to begin mapping Arabic words to their Hebrew/Greek counterparts</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="interlinear-table">
            <thead>
              <tr>
                <th className="pos-col">#</th>
                <th className="rtl">Arabic Word (AVD)</th>
                <th className="rtl">Original (Heb/Greek)</th>
                <th>Translit (AR)</th>
                <th>Morphology</th>
                <th>Strong's</th>
                <th>Status</th>
                <th style={{ width:160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map(m => {
                const ed = editing[m.id];
                const isEditing = !!ed;
                return (
                  <tr key={m.id}>
                    <td className="pos-col" style={{ color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.75rem', textAlign:'center' }}>
                      {m.ar_word_position}
                    </td>

                    {/* Arabic word */}
                    <td>
                      {isEditing ? (
                        <input className="input input-arabic" style={{ padding:'4px 8px', fontSize:'0.9375rem' }}
                          value={ed.ar_word ?? ''} onChange={e => setField(m.id, 'ar_word', e.target.value)} />
                      ) : (
                        <span className="cell-arabic">{m.ar_word}</span>
                      )}
                    </td>

                    {/* Original word */}
                    <td>
                      {isEditing ? (
                        <input className={`input ${m.orig_word_lang === 'hebrew' ? 'input-hebrew' : 'input-greek'}`} style={{ padding:'4px 8px' }}
                          value={ed.orig_word ?? ''} onChange={e => setField(m.id, 'orig_word', e.target.value)} />
                      ) : (
                        <span className={m.orig_word_lang === 'hebrew' ? 'cell-hebrew' : 'cell-greek'}>{m.orig_word}</span>
                      )}
                    </td>

                    {/* Transliteration */}
                    <td>
                      {isEditing ? (
                        <input className="input" style={{ padding:'4px 8px', fontSize:'0.8125rem' }}
                          value={ed.transliteration_ar ?? ''} onChange={e => setField(m.id, 'transliteration_ar', e.target.value)} />
                      ) : (
                        <span style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>{m.transliteration_ar ?? '—'}</span>
                      )}
                    </td>

                    {/* Morphology */}
                    <td>
                      {isEditing ? (
                        <input className="input" style={{ padding:'4px 8px', fontSize:'0.75rem' }}
                          value={ed.orig_morphology ?? ''} onChange={e => setField(m.id, 'orig_morphology', e.target.value)} />
                      ) : (
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{m.orig_morphology ?? '—'}</span>
                      )}
                    </td>

                    {/* Strong's */}
                    <td>
                      {isEditing ? (
                        <input className="input font-mono" style={{ padding:'4px 8px', fontSize:'0.8125rem', width:80 }}
                          value={ed.strongs_id ?? ''} onChange={e => setField(m.id, 'strongs_id', e.target.value)} />
                      ) : m.strongs_id ? (
                        <a href={`https://www.blueletterbible.org/lexicon/${m.strongs_id}`} target="_blank" rel="noreferrer" className="strongs-link" style={{ color:'var(--accent-blue)', fontFamily:'var(--font-mono)', fontSize:'0.8125rem' }}>
                          {m.strongs_id} ↗
                        </a>
                      ) : '—'}
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className={`badge ${m.is_verified ? 'badge-success' : 'badge-warning'}`}>
                        {m.is_verified ? '✓ verified' : '● pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                        {isEditing ? (
                          <>
                            <button className="btn btn-primary btn-xs" onClick={() => saveMapping(m.id)} disabled={saving[m.id]}>
                              {saving[m.id] ? '...' : '✓ Save'}
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => cancelEdit(m.id)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-secondary btn-xs" onClick={() => startEdit(m)}>Edit</button>
                            {!m.is_verified && <button className="btn btn-success btn-xs" onClick={() => verifyMapping(m.id)}>✓</button>}
                            <button className="btn btn-danger btn-xs" onClick={() => deleteMapping(m.id)}>✕</button>
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
      )}
    </div>
  );
}
