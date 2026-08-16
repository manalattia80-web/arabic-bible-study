'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { navApi, Book, Chapter } from '@/lib/api';

export default function WordMappingsPage() {
  const router = useRouter();
  const [books,       setBooks]       = useState<Book[]>([]);
  const [chapters,    setChapters]    = useState<Chapter[]>([]);
  const [selectedBook,    setSelectedBook]    = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses,   setVerses]   = useState<{ id: string; verse_num: number; text_avd_ar: string }[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  useEffect(() => { navApi.books().then(r => setBooks(r.data)); }, []);

  useEffect(() => {
    if (!selectedBook) { setChapters([]); setSelectedChapter(null); setVerses([]); return; }
    navApi.chapters(selectedBook).then(r => setChapters(r.data));
    setSelectedChapter(null); setVerses([]);
  }, [selectedBook]);

  useEffect(() => {
    if (!selectedBook || !selectedChapter) { setVerses([]); return; }
    setLoadingVerses(true);
    navApi.verses(selectedBook, selectedChapter)
      .then(r => setVerses(r.data))
      .finally(() => setLoadingVerses(false));
  }, [selectedBook, selectedChapter]);

  const selectedBookData = books.find(b => b.id === selectedBook);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⇌ Word Mappings</h1>
          <p className="page-desc">Select a verse to edit its word-by-word interlinear alignment</p>
        </div>
      </div>

      {/* Navigator */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="card-header"><div className="card-title">Navigate to Verse</div></div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
            {/* Book */}
            <div className="form-group">
              <label className="form-label">Book</label>
              <select className="input select" value={selectedBook ?? ''} onChange={e => setSelectedBook(Number(e.target.value) || null)}>
                <option value="">— Select Book —</option>
                <optgroup label="Old Testament">
                  {books.filter(b => b.id <= 39).map(b => <option key={b.id} value={b.id}>{b.name_ar} ({b.name_en})</option>)}
                </optgroup>
                <optgroup label="New Testament">
                  {books.filter(b => b.id >= 40).map(b => <option key={b.id} value={b.id}>{b.name_ar} ({b.name_en})</option>)}
                </optgroup>
              </select>
            </div>

            {/* Chapter */}
            <div className="form-group">
              <label className="form-label">Chapter</label>
              <select className="input select" value={selectedChapter ?? ''} onChange={e => setSelectedChapter(Number(e.target.value) || null)} disabled={!selectedBook}>
                <option value="">— Select Chapter —</option>
                {chapters.map(c => <option key={c.id} value={c.number}>Chapter {c.number}</option>)}
              </select>
            </div>

            {/* Info */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="input" style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-muted)' }}>
                {loadingVerses ? <><span className="spinner" style={{ width:16, height:16 }} /> Loading...</>
                 : verses.length > 0 ? <><span style={{ color:'var(--success)' }}>✓</span> {verses.length} verses loaded</>
                 : 'Select book & chapter'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verse List */}
      {verses.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {selectedBookData?.name_ar} {selectedChapter} — {selectedBookData?.name_en}
              </div>
              <div className="card-subtitle">{verses.length} verses · Click a verse to edit its word mappings</div>
            </div>
          </div>
          <div className="table-wrapper" style={{ borderRadius:0, border:'none' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width:60 }}>Verse</th>
                  <th className="rtl">Arabic Text (AVD)</th>
                  <th style={{ width:120 }}></th>
                </tr>
              </thead>
              <tbody>
                {verses.map(v => (
                  <tr key={v.id} style={{ cursor:'pointer' }} onClick={() => router.push(`/dashboard/word-mappings/${v.id}`)}>
                    <td style={{ color:'var(--primary-text)', fontWeight:600, fontFamily:'var(--font-mono)' }}>
                      {selectedChapter}:{v.verse_num}
                    </td>
                    <td className="cell-arabic" style={{ fontSize:'1.0625rem', lineHeight:1.7 }}>
                      {v.text_avd_ar}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); router.push(`/dashboard/word-mappings/${v.id}`); }}>
                        Edit Mapping →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedBook && (
        <div className="empty-state">
          <div className="empty-state-icon">⇌</div>
          <div className="empty-state-title">Select a Book and Chapter</div>
          <div className="empty-state-desc">Choose a Bible book and chapter above to browse verses and edit word-by-word mappings</div>
        </div>
      )}
    </div>
  );
}
