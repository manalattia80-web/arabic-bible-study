-- add_pronunciation_to_strongs_ar.sql

ALTER TABLE strongs_ar_translations 
ADD COLUMN pronunciation_ar TEXT;

ALTER TABLE strongs_entries
ADD COLUMN audio_url TEXT;
