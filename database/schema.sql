-- ============================================================
-- Arabic AVD Bible Study App — Database Schema
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- PostgreSQL 16 / Supabase
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- 1. TESTAMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS testaments (
    id            SMALLINT PRIMARY KEY,
    name_ar       TEXT NOT NULL,
    name_en       TEXT NOT NULL,
    original_lang VARCHAR(10) NOT NULL CHECK (original_lang IN ('hebrew', 'greek', 'aramaic'))
);

INSERT INTO testaments VALUES
    (1, 'العهد القديم', 'Old Testament', 'hebrew'),
    (2, 'العهد الجديد', 'New Testament', 'greek')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. BOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
    id              SMALLINT PRIMARY KEY,
    testament_id    SMALLINT NOT NULL REFERENCES testaments(id),
    name_ar         TEXT NOT NULL,
    name_ar_short   TEXT,
    name_en         TEXT NOT NULL,
    name_en_short   TEXT,
    name_original   TEXT,
    chapter_count   SMALLINT NOT NULL,
    sort_order      SMALLINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_testament ON books(testament_id);

-- ============================================================
-- 3. CHAPTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id     SMALLINT NOT NULL REFERENCES books(id),
    number      SMALLINT NOT NULL,
    UNIQUE(book_id, number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_id);

-- ============================================================
-- 4. VERSES
-- ============================================================
CREATE TABLE IF NOT EXISTS verses (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id           UUID NOT NULL REFERENCES chapters(id),
    book_id              SMALLINT NOT NULL REFERENCES books(id),
    chapter_num          SMALLINT NOT NULL,
    verse_num            SMALLINT NOT NULL,
    text_avd_ar          TEXT NOT NULL,
    text_original        TEXT NOT NULL,
    text_original_lang   VARCHAR(10) NOT NULL CHECK (text_original_lang IN ('hebrew', 'greek', 'aramaic')),
    UNIQUE(book_id, chapter_num, verse_num)
);

CREATE INDEX IF NOT EXISTS idx_verses_chapter     ON verses(chapter_id);
CREATE INDEX IF NOT EXISTS idx_verses_book_ch     ON verses(book_id, chapter_num);
CREATE INDEX IF NOT EXISTS idx_verses_ar_trgm     ON verses USING GIN (text_avd_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_verses_orig_trgm   ON verses USING GIN (text_original gin_trgm_ops);

-- ============================================================
-- 5. STRONG'S DICTIONARY ENTRIES (source data — do not edit)
-- ============================================================
CREATE TABLE IF NOT EXISTS strongs_entries (
    strongs_id      VARCHAR(10) PRIMARY KEY,
    language        VARCHAR(10) NOT NULL CHECK (language IN ('hebrew', 'greek')),
    original_word   TEXT NOT NULL,
    transliteration TEXT NOT NULL,
    root_word       TEXT,
    pronunciation   TEXT,
    definition_en   TEXT NOT NULL,
    kjv_usage       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strongs_lang   ON strongs_entries(language);
CREATE INDEX IF NOT EXISTS idx_strongs_trgm   ON strongs_entries USING GIN (original_word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_strongs_def_trgm ON strongs_entries USING GIN (definition_en gin_trgm_ops);

-- ============================================================
-- 6. STRONG'S ARABIC TRANSLATIONS (admin-maintained)
-- ============================================================
CREATE TABLE IF NOT EXISTS strongs_ar_translations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strongs_id      VARCHAR(10) NOT NULL REFERENCES strongs_entries(strongs_id),
    definition_ar   TEXT NOT NULL,
    notes_ar        TEXT,
    is_verified     BOOLEAN DEFAULT FALSE,
    updated_by      UUID,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(strongs_id)
);

-- ============================================================
-- 7. WORD MAPPINGS (Heart of the Interlinear feature)
-- ============================================================
CREATE TABLE IF NOT EXISTS word_mappings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verse_id            UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    ar_word_position    SMALLINT NOT NULL,
    orig_word_position  SMALLINT NOT NULL,
    ar_word             TEXT NOT NULL,
    ar_word_normalized  TEXT,
    orig_word           TEXT NOT NULL,
    orig_word_lang      VARCHAR(10) NOT NULL CHECK (orig_word_lang IN ('hebrew', 'greek', 'aramaic')),
    orig_morphology     TEXT,
    transliteration_ar  TEXT,
    transliteration_lat TEXT,
    strongs_id          VARCHAR(10) REFERENCES strongs_entries(strongs_id),
    audio_url           TEXT,
    audio_duration_ms   INT,
    is_verified         BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(verse_id, ar_word_position, orig_word_position)
);

CREATE INDEX IF NOT EXISTS idx_wm_verse      ON word_mappings(verse_id);
CREATE INDEX IF NOT EXISTS idx_wm_strongs    ON word_mappings(strongs_id);
CREATE INDEX IF NOT EXISTS idx_wm_ar_trgm    ON word_mappings USING GIN (ar_word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_wm_orig_trgm  ON word_mappings USING GIN (orig_word gin_trgm_ops);

-- ============================================================
-- 8. AUDIO FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS audio_files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strongs_id      VARCHAR(10) REFERENCES strongs_entries(strongs_id),
    word_mapping_id UUID REFERENCES word_mappings(id),
    file_key        TEXT NOT NULL UNIQUE,
    file_url        TEXT NOT NULL,
    mime_type       VARCHAR(50) DEFAULT 'audio/mpeg',
    duration_ms     INT,
    uploaded_by     UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_strongs ON audio_files(strongs_id);

-- ============================================================
-- 9. ADMIN USERS (extended profile, linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id              UUID PRIMARY KEY,
    username        TEXT NOT NULL UNIQUE,
    role            VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('super_admin', 'editor', 'reviewer')),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id        UUID NOT NULL REFERENCES admin_users(id),
    table_name      TEXT NOT NULL,
    record_id       TEXT NOT NULL,
    action          VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data        JSONB,
    new_data        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin   ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_table   ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- 11. FOREIGN KEYS (added after tables exist)
-- ============================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_audio_uploader'
    ) THEN
        ALTER TABLE audio_files
            ADD CONSTRAINT fk_audio_uploader
            FOREIGN KEY (uploaded_by) REFERENCES admin_users(id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_strongs_ar_editor'
    ) THEN
        ALTER TABLE strongs_ar_translations
            ADD CONSTRAINT fk_strongs_ar_editor
            FOREIGN KEY (updated_by) REFERENCES admin_users(id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_audio_admin'
    ) THEN
        ALTER TABLE audio_files
            ADD CONSTRAINT fk_audio_admin
            FOREIGN KEY (uploaded_by) REFERENCES admin_users(id);
    END IF;
END $$;

-- ============================================================
-- 12. AUTO-UPDATE TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_strongs_updated ON strongs_entries;
CREATE TRIGGER trg_strongs_updated
    BEFORE UPDATE ON strongs_entries
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_strongs_ar_updated ON strongs_ar_translations;
CREATE TRIGGER trg_strongs_ar_updated
    BEFORE UPDATE ON strongs_ar_translations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_word_mapping_updated ON word_mappings;
CREATE TRIGGER trg_word_mapping_updated
    BEFORE UPDATE ON word_mappings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 13. ROW LEVEL SECURITY (Supabase RLS)
-- ============================================================
ALTER TABLE testaments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE books                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters                ENABLE ROW LEVEL SECURITY;
ALTER TABLE verses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE strongs_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE strongs_ar_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_mappings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log               ENABLE ROW LEVEL SECURITY;

-- Public read (Flutter app — anonymous users)
CREATE POLICY IF NOT EXISTS "public_read_testaments"  ON testaments              FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_books"       ON books                   FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_chapters"    ON chapters                FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_verses"      ON verses                  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_strongs"     ON strongs_entries         FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_strongs_ar"  ON strongs_ar_translations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_word_maps"   ON word_mappings           FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_audio"       ON audio_files             FOR SELECT USING (true);

-- Admin write (JWT role check)
CREATE POLICY IF NOT EXISTS "admin_all_word_maps" ON word_mappings
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('super_admin', 'editor')
    );

CREATE POLICY IF NOT EXISTS "admin_all_strongs_ar" ON strongs_ar_translations
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('super_admin', 'editor')
    );

CREATE POLICY IF NOT EXISTS "admin_all_verses" ON verses
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('super_admin', 'editor')
    );

CREATE POLICY IF NOT EXISTS "admin_read_audit" ON audit_log
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('super_admin', 'editor', 'reviewer')
    );

-- ============================================================
-- Done! Run the import scripts next.
-- ============================================================
