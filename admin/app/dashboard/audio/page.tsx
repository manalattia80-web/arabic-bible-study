'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { audioApi, AudioFile } from '@/lib/api';
import { useToast } from '@/lib/use-toast';

export default function AudioPage() {
  const { success, error: showError, ToastContainer } = useToast();
  const [files,    setFiles]    = useState<AudioFile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [strongsId, setStrongsId] = useState('');
  const [wordMappingId, setWordMappingId] = useState('');
  const [filterStrongsId, setFilterStrongsId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await audioApi.list(filterStrongsId ? { strongs_id: filterStrongsId } : {});
      setFiles(res.data);
    } catch { showError('Failed to load audio files'); }
    finally { setLoading(false); }
  }, [filterStrongsId, showError]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const fd = new FormData();
    fd.append('file', file);
    if (strongsId)     fd.append('strongs_id', strongsId.toUpperCase());
    if (wordMappingId) fd.append('word_mapping_id', wordMappingId);

    setUploading(true);
    try {
      const res = await audioApi.upload(fd);
      if (res.data) {
        success('Audio uploaded successfully ✓');
        setStrongsId(''); setWordMappingId('');
        load();
      } else {
        showError(res.error ?? 'Upload failed');
      }
    } catch { showError('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Delete audio file "${key}"?`)) return;
    try {
      await audioApi.delete(id);
      success('Deleted');
      load();
    } catch { showError('Delete failed'); }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  };

  return (
    <div>
      <ToastContainer />

      <div className="page-header">
        <div>
          <h1 className="page-title">♪ Audio Files</h1>
          <p className="page-desc">Upload and manage Hebrew/Greek pronunciation audio files</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem', alignItems:'start' }}>
        {/* Upload Zone */}
        <div className="card">
          <div className="card-header"><div className="card-title">Upload Audio File</div></div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Strong's ID (optional)</label>
                <input className="input font-mono" placeholder="H7225 or G3056" value={strongsId} onChange={e => setStrongsId(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Word Mapping ID (optional)</label>
                <input className="input font-mono" placeholder="UUID" value={wordMappingId} onChange={e => setWordMappingId(e.target.value)} />
              </div>
            </div>

            <div
              className={`audio-dropzone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); }}
            >
              <div className="audio-dropzone-icon">🎵</div>
              {uploading ? (
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', justifyContent:'center' }}>
                  <span className="spinner" /> Uploading...
                </div>
              ) : (
                <div className="audio-dropzone-text">
                  <strong>Click to browse</strong> or drag & drop<br/>
                  <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.25rem', display:'block' }}>MP3, WAV, OGG · Max 10 MB</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="audio/*" style={{ display:'none' }} onChange={e => handleUpload(e.target.files)} />
          </div>
        </div>

        {/* Filter / Info */}
        <div className="card">
          <div className="card-header"><div className="card-title">Filter Files</div></div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom:'1rem' }}>
              <label className="form-label">Filter by Strong's ID</label>
              <input className="input font-mono" placeholder="H7225" value={filterStrongsId} onChange={e => setFilterStrongsId(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={load}>Apply Filter</button>
            {filterStrongsId && <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStrongsId(''); }}>Clear</button>}

            <div style={{ marginTop:'1.5rem', padding:'1rem', background:'var(--bg-surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.5rem' }}>How Audio Works</div>
              <ul style={{ fontSize:'0.8125rem', color:'var(--text-secondary)', display:'flex', flexDirection:'column', gap:'0.375rem', paddingLeft:'1rem' }}>
                <li>Upload an .mp3 for a Strong's ID → all word mappings using that Strong's get the audio link automatically</li>
                <li>Or upload for a specific Word Mapping ID for per-word audio</li>
                <li>The Flutter app shows a play button next to each word in the interlinear table</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Uploaded Audio Files</div>
          <div className="card-subtitle">{files.length} files</div>
        </div>
        {loading ? (
          <div className="loading-overlay"><span className="spinner" /> Loading...</div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎵</div>
            <div className="empty-state-title">No Audio Files Yet</div>
            <div className="empty-state-desc">Upload .mp3 files above to add pronunciation audio to word mappings</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius:0, border:'none' }}>
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Strong's ID</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Preview</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8125rem', color:'var(--text-secondary)' }}>
                      {f.file_key.split('/').pop()}
                    </td>
                    <td>
                      {f.strongs_id
                        ? <span className="font-mono" style={{ color:'var(--accent-blue)', fontSize:'0.875rem' }}>{f.strongs_id}</span>
                        : <span style={{ color:'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><span className="badge badge-info">{f.mime_type.split('/')[1]}</span></td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>{formatDuration(f.duration_ms)}</td>
                    <td>
                      <audio controls src={f.file_url} style={{ height:28, width:160, filter:'invert(1) hue-rotate(180deg)' }} />
                    </td>
                    <td style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-xs" onClick={() => handleDelete(f.id, f.file_key)}>✕ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
