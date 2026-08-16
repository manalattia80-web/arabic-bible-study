'use client';
import { useEffect, useState, useCallback } from 'react';
import { navApi, versesAdminApi, Book, Chapter, Verse } from '@/lib/api';
import { useToast } from '@/lib/use-toast';

export default function VersesPage() {
  const { success, error: showError, ToastContainer } = useToast();
  const [books,    setBooks]    = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses,   setVerses]   = useState<Verse[]>([]);
  const [selectedBook,    setSelectedBook]    = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [editing,  setEditing]  = useState<Record<string, Partial<Verse>>>({});
  const [saving,   setSaving]   = useState<Record<string, boolean>>({});

  useEffect(() => { navApi.books().then(r => setBooks(r.data)); }, []);
  useEffect(() => {
    if (!selectedBook) { setChapters([]); setSelectedChapter(null); setVerses([]); return; }
    navApi.chapters(selectedBook).then(r => setChapters(r.data));
  }, [selectedBook]);

  const loadVerses = useCallback(async () => {
    if (!selectedBook || !selectedChapter) { setVerses([]); return; }
    setLoading(true);
    try {
      const r = await versesAdminApi.list(selectedBook, selectedChapter);
      setVerses(r.data);
    } catch { showError('Failed to load verses'); }
    finally { setLoading(false); }
  }, [selectedBook, selectedChapter, showError]);

  useEffect(() => { loadVerses(); }, [loadVerses]);

  const startEdit = (v: Verse) =>
    setEditing(p => ({ ...p, [v.id]: { text_avd_ar: v.text_avd_ar, text_original: v.text_original } }));
  const cancelEdit = (id: string) => setEditing(p => { const n={...p}; delete n[id]; return n; });

  const saveVerse = async (id: string) => {
    const patch = editing[id];
    if (!patch) return;
    setSaving(p => ({ ...p, [id]: true }));
    try {
      await versesAdminApi.update(id, patch);
      success('Verse saved ✓');
      cancelEdit(id);
      loadVerses();
    } catch (e: unknown) { showError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(p => ({ ...p, [id]: false })); }
  };

  const selectedBookData = books.find(b => b.id === selectedBook);

  return (
    <div>
      <ToastContainer />

      <div className="page-header">
        <div>
          <h1 className="page-title">✦ Verse Text Editor</h1>
          <p className="page-desc">Correct Arabic AVD or original Hebrew/Greek text discrepancies</p>
        </div>
      </div>

      {/* Navigator */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'1rem', alignItems:'end' }}>
            <div className="form-group">
              <label className="form-label">Book</label>
              <select className="input select" value={selectedBook ?? ''} onChange={e => setSelectedBook(Number(e.target.value) || null)}>
                <option value="">— Select Book —</option>
                <optgroup label="Old Testament">{books.filter(b=>b.id<=39).map(b=><option key={b.id} value={b.id}>{b.name_ar} ({b.name_en})</option>)}</optgroup>
                <optgroup label="New Testament">{books.filter(b=>b.id>=40).map(b=><option key={b.id} value={b.id}>{b.name_ar} ({b.name_en})</option>)}</optgroup>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Chapter</label>
              <select className="input select" value={selectedChapter ?? ''} onChange={e => setSelectedChapter(Number(e.target.value) || null)} disabled={!selectedBook}>
                <option value="">— Select Chapter —</option>
                {chapters.map(c => <option key={c.id} value={c.number}>Chapter {c.number}</option>)}
              </select>
            </div>
            <div>{loading && <span className="spinner" />}</div>
          </div>
        </div>
      </div>

      {/* Verses */}
      {verses.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">{selectedBookData?.name_ar} {selectedChapter}</div>
            <div className="card-subtitle">{verses.length} verses · Click a row to edit</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {verses.map((v, i) => {
              const ed = editing[v.id];
              return (
                <div key={v.id} style={{ padding:'1rem 1.5rem', borderBottom: i < verses.length-1 ? '1px solid var(--border)' : 'none', transition:'background 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem' }}>
                    <div style={{ flex:1 }}>
                      {/* Verse number */}
                      <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--primary-text)', fontFamily:'var(--font-mono)', marginBottom:'0.5rem' }}>
                        {selectedChapter}:{v.verse_num}
                        <span className={`badge ${v.text_original_lang === 'hebrew' ? 'badge-hebrew' : 'badge-greek'}`} style={{ marginLeft:'0.5rem' }}>{v.text_original_lang}</span>
                      </div>

                      {/* Arabic text */}
                      <div className="form-group" style={{ marginBottom:'0.5rem' }}>
                        <label className="form-label">Arabic (AVD)</label>
                        {ed ? (
                          <textarea className="input textarea input-arabic"
                            style={{ minHeight:60 }}
                            value={ed.text_avd_ar ?? ''}
                            onChange={e => setEditing(p => ({ ...p, [v.id]: { ...p[v.id], text_avd_ar: e.target.value } }))} />
                        ) : (
                          <div style={{ fontFamily:'var(--font-arabic)', fontSize:'1rem', lineHeight:1.7, direction:'rtl', textAlign:'right', color:'var(--text-arabic)', padding:'0.5rem 0' }}>
                            {v.text_avd_ar}
                          </div>
                        )}
                      </div>

                      {/* Original text */}
                      <div className="form-group">
                        <label className="form-label">Original ({v.text_original_lang})</label>
                        {ed ? (
                          <textarea className={`input textarea ${v.text_original_lang === 'hebrew' ? 'input-hebrew' : 'input-greek'}`}
                            style={{ minHeight:60 }}
                            value={ed.text_original ?? ''}
                            onChange={e => setEditing(p => ({ ...p, [v.id]: { ...p[v.id], text_original: e.target.value } }))} />
                        ) : (
                          <div style={{ fontSize:'0.9375rem', lineHeight:1.7, direction: v.text_original_lang === 'hebrew' ? 'rtl' : 'ltr', textAlign: v.text_original_lang === 'hebrew' ? 'right' : 'left', color: v.text_original_lang === 'hebrew' ? 'var(--text-hebrew)' : 'var(--text-greek)', padding:'0.5rem 0' }}>
                            {v.text_original}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem', flexShrink:0 }}>
                      {ed ? (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => saveVerse(v.id)} disabled={saving[v.id]}>
                            {saving[v.id] ? '...' : '✓ Save'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => cancelEdit(v.id)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(v)}>Edit</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !selectedBook ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <div className="empty-state-title">Select a Book and Chapter</div>
          <div className="empty-state-desc">Choose a book and chapter to browse and correct verse texts</div>
        </div>
      ) : null}
    </div>
  );
}
