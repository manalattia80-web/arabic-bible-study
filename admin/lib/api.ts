/**
 * lib/api.ts
 * Typed API client that wraps all backend calls.
 * Reads JWT from localStorage and injects it into every request.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? `HTTP ${res.status}`);
  }
  return json;
}

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminUser }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ data: AdminUser }>('/admin/auth/me'),
};

// ── Navigation ────────────────────────────────────────────────
export const navApi = {
  testaments: () => request<{ data: Testament[] }>('/testaments'),
  books:      (testament_id?: number) =>
    request<{ data: Book[] }>(`/books${testament_id ? `?testament_id=${testament_id}` : ''}`),
  chapters:   (book_id: number) =>
    request<{ data: Chapter[] }>(`/chapters?book_id=${book_id}`),
  verses:     (book_id: number, chapter_num: number) =>
    request<{ data: Verse[]; meta: Record<string, unknown> }>(
      `/verses?book_id=${book_id}&chapter_num=${chapter_num}`
    ),
};

// ── Word Mappings (Admin) ─────────────────────────────────────
export const wordMappingApi = {
  list: (verse_id: string, is_verified?: boolean) => {
    const q = new URLSearchParams({ verse_id });
    if (is_verified !== undefined) q.set('is_verified', String(is_verified));
    return request<{ data: WordMapping[] }>(`/admin/word-mappings?${q}`);
  },
  create: (body: Partial<WordMapping>) =>
    request<{ data: WordMapping }>('/admin/word-mappings', {
      method: 'POST', body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<WordMapping>) =>
    request<{ data: WordMapping }>(`/admin/word-mappings/${id}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<void>(`/admin/word-mappings/${id}`, { method: 'DELETE' }),
  verify: (id: string) =>
    request<{ data: WordMapping }>(`/admin/word-mappings/${id}/verify`, { method: 'POST' }),
  bulkVerify: (verse_id: string) =>
    request<{ data: { updated_count: number } }>('/admin/word-mappings/bulk-verify', {
      method: 'POST', body: JSON.stringify({ verse_id }),
    }),
};

// ── Strong's Arabic Translations (Admin) ─────────────────────
export const strongsArApi = {
  list: (params?: { q?: string; lang?: string; is_verified?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.q)            q.set('q', params.q);
    if (params?.lang)         q.set('lang', params.lang);
    if (params?.is_verified !== undefined) q.set('is_verified', String(params.is_verified));
    if (params?.page)         q.set('page', String(params.page));
    if (params?.limit)        q.set('limit', String(params.limit));
    return request<{ data: StrongsArEntry[]; meta: PaginationMeta }>(`/admin/strongs-ar?${q}`);
  },
  create: (body: { strongs_id: string; definition_ar: string; notes_ar?: string }) =>
    request<{ data: StrongsArEntry }>('/admin/strongs-ar', {
      method: 'POST', body: JSON.stringify(body),
    }),
  update: (strongsId: string, body: { definition_ar?: string; notes_ar?: string }) =>
    request<{ data: StrongsArEntry }>(`/admin/strongs-ar/${strongsId}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  verify: (strongsId: string) =>
    request<{ data: StrongsArEntry }>(`/admin/strongs-ar/${strongsId}/verify`, { method: 'POST' }),
};

// ── Verses (Admin) ────────────────────────────────────────────
export const versesAdminApi = {
  list: (book_id: number, chapter_num: number) =>
    request<{ data: Verse[] }>(`/admin/verses?book_id=${book_id}&chapter_num=${chapter_num}`),
  update: (id: string, body: Partial<Verse>) =>
    request<{ data: Verse }>(`/admin/verses/${id}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
};

// ── Audio (Admin) ─────────────────────────────────────────────
export const audioApi = {
  list: (params?: { strongs_id?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.strongs_id) q.set('strongs_id', params.strongs_id);
    if (params?.page)       q.set('page', String(params.page));
    return request<{ data: AudioFile[]; meta: PaginationMeta }>(`/admin/audio?${q}`);
  },
  upload: (formData: FormData) => {
    const token = getToken();
    return fetch(`${BASE}/admin/audio/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json());
  },
  delete: (id: string) =>
    request<void>(`/admin/audio/${id}`, { method: 'DELETE' }),
  link: (word_mapping_id: string, audio_url: string, duration_ms?: number) =>
    request<{ data: WordMapping }>('/admin/audio/link', {
      method: 'PATCH',
      body: JSON.stringify({ word_mapping_id, audio_url, duration_ms }),
    }),
};

// ── Users & Audit (Admin) ─────────────────────────────────────
export const usersApi = {
  list: () => request<{ data: AdminUser[] }>('/admin/users'),
  create: (body: { email: string; password: string; username: string; role: string }) =>
    request<{ data: AdminUser }>('/admin/users', {
      method: 'POST', body: JSON.stringify(body),
    }),
  update: (id: string, body: { role?: string; is_active?: boolean; username?: string }) =>
    request<{ data: AdminUser }>(`/admin/users/${id}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  auditLog: (params?: { admin_id?: string; table_name?: string; action?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.admin_id)   q.set('admin_id', params.admin_id);
    if (params?.table_name) q.set('table_name', params.table_name);
    if (params?.action)     q.set('action', params.action);
    if (params?.page)       q.set('page', String(params.page));
    return request<{ data: AuditLogEntry[]; meta: PaginationMeta }>(`/admin/users/audit-log?${q}`);
  },
};

// ── Types ─────────────────────────────────────────────────────
export interface Testament { id: number; name_ar: string; name_en: string; original_lang: string; }
export interface Book { id: number; testament_id: number; name_ar: string; name_en: string; name_ar_short: string; name_original?: string; chapter_count: number; }
export interface Chapter { id: string; book_id: number; number: number; }
export interface Verse { id: string; book_id: number; chapter_num: number; verse_num: number; text_avd_ar: string; text_original: string; text_original_lang: string; }
export interface WordMapping {
  id: string; verse_id: string;
  ar_word_position: number; orig_word_position: number;
  ar_word: string; ar_word_normalized?: string;
  orig_word: string; orig_word_lang: string; orig_morphology?: string;
  transliteration_ar?: string; transliteration_lat?: string;
  strongs_id?: string; audio_url?: string; audio_duration_ms?: number;
  is_verified: boolean;
}
export interface StrongsArEntry {
  id: string; strongs_id: string; definition_ar: string; notes_ar?: string;
  is_verified: boolean; updated_at: string;
  strongs_entries?: { language: string; original_word: string; transliteration: string; definition_en: string; };
}
export interface AudioFile { id: string; strongs_id?: string; word_mapping_id?: string; file_key: string; file_url: string; mime_type: string; duration_ms?: number; created_at: string; }
export interface AdminUser { id: string; username: string; email?: string; role: string; is_active?: boolean; last_login_at?: string; }
export interface AuditLogEntry { id: string; action: string; table_name: string; record_id: string; old_data?: Record<string, unknown>; new_data?: Record<string, unknown>; created_at: string; admin_users?: { username: string; role: string }; }
export interface PaginationMeta { total: number; page: number; limit: number; total_pages?: number; }
