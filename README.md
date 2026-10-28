# Arabic Van Dyck Bible Study

[![Build & Release APK](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml/badge.svg)](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml)
[![Latest Release](https://img.shields.io/github/v/release/manalattia80-web/arabic-bible-study?label=Release&color=brightgreen)](https://github.com/manalattia80-web/arabic-bible-study/releases/latest)
[![Database Version](https://img.shields.io/badge/SQLite%20Database-v41%20(Verified)-blue)](mobile/assets/bible_study.db)
[![Quality Gate](https://img.shields.io/badge/CI%20Quality%20Gate-66%2F66%20Passed-success)](scripts/automated_database_audit.cjs)

## Latest Verified Release: v1.0.311 (Database v41)

- **Release Package:** [Arabic Bible Study v1.0.311](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.311)
- **Database Engine:** **v41** (`bible_study_v41.db`, `targetDbVersion = 41`) — Guaranteed automatic upgrade from v39/v40 with deferred cleanup of `bible_study_v40.db` after PRAGMA integrity verification.
- **Key Philological & Systemic Enhancements:**
  1. **Multi-Component Affix & Compound Linkage:**
     - **John 3:16 (بِهِ):** Linked to both G846 (αὐτόν, primary, token 19) AND prefix preposition G1519 (εἰς).
     - **Ephesians 2:8 (وَذلِكَ):** Linked to both G3778 (τοῦτο, primary, token 9) AND prefix conjunction G2532 (καί).
     - **Isaiah 53:5 (شُفِينَا):** Linked to both H7495 (נִרְפָּא, primary, token 10) AND suffix/dative H3807a (לָנוּ).
  2. **MorphGNT SBLGNT Token Position & Surface Realignment:**
     - **John 3:16 (بِهِ):** `orig_word_position = 19`, `verified_locator = 'SBLGNT:B43.C3.V16.w19'`.
     - **Acts 1:8 (لِي):** `orig_word_position = 12`, `verified_locator = 'SBLGNT:B44.C1.V8.w12'`.
     - **Ephesians 2:8 (وَذلِكَ):** `orig_word_position = 9`, `verified_locator = 'SBLGNT:B49.C2.V8.w9'`.
     - **Revelation 21:4 (وَجَعٌ):** `orig_word_position = 20`, `verified_locator = 'SBLGNT:B66.C21.V4.w20'`.
     - **Revelation 21:4 (مَضَتْ):** `orig_surface = 'ἀπῆλθαν'`, `orig_word_position = 26`, `verified_locator = 'SBLGNT:B66.C21.V4.w26'`.
  3. **Isaiah 53:5 Metadata & UI Realignment:**
     - Cleared residual `morph_source = 'syntactic_ar'` across all 5 theological words; elevated to `morph_source = 'oshb_wlc'`, `verified_source = 'OSHB'`, and `relation_type = 'primary'`.
     - Re-indexed token positions in WLC: w1 (وَهُوَ), w2 (مَجْرُوحٌ), w3 (لأَجْلِ / مَعَاصِينَا), w4 (مَسْحُوقٌ), w5 (لأَجْلِ / آثَامِنَا), w6 (تَأْدِيبُ), w7 (سَلاَمِنَا), w8 (عَلَيْهِ), w9 (وَبِحُبُرِهِ), w10 (شُفِينَا).
  4. **Self-Healing Audio Resilience:**
     - Validates audio byte streams against error/HTML pages before caching.
     - Automatically purges corrupted local cache entries on playback errors and cleanly re-fetches.
- **CI Quality Gate:** **66 / 66 Checks Passed (100%)** | 0 Failures





---

A comprehensive Arabic Bible Study application similar to the "Blue Letter Bible," based on the Arabic Van Dyck (AVD) translation. This monorepo contains the full stack: Backend API, Admin Panel, and Flutter Mobile App.

## Architecture

The project is split into four main directories:
1. `database/` - Supabase schema and RLS policies.
2. `scripts/` - Node.js scripts for importing AVD verses, Strong's dictionary, and word mappings.
3. `backend/` - Fastify REST API providing endpoints for mobile consumption and admin management.
4. `admin/` - Next.js 14 App Router Admin Panel for editing word mappings, Strong's translations, and audio files.
5. `mobile/` - Flutter iOS/Android app with dual-text reader, interlinear word study, and audio playback.

## Tech Stack
- **Database**: PostgreSQL (via Supabase) with Row Level Security (RLS) and Supabase Storage for audio.
- **Backend API**: Fastify (Node.js) with JWT Auth and Upstash Redis caching.
- **Admin Panel**: Next.js 14 (React) deployed on Vercel. Custom CSS design system.
- **Mobile App**: Flutter (Dart) using `provider` and `go_router`.

---

## 1. Local Development Setup

### Prerequisites
- Node.js (v18+)
- Flutter SDK (3.20+)
- Supabase account & project
- Upstash Redis account (optional, for backend caching)

### Database (Supabase)
1. Run the SQL script from `database/schema.sql` in your Supabase SQL Editor.
2. Enable Supabase Storage and create a public bucket named `audio`.

### Backend API
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your Supabase URL, Anon Key, Service Role Key (for admin endpoints), and JWT secret.
4. `npm run dev` (starts on `http://localhost:3001`)

### Data Import Scripts
1. `cd scripts`
2. `npm install`
3. Follow `scripts/README.md` to import the AVD Bible, Strong's lexicon, and TAHOT/TAGNT word mappings.

### Admin Panel
1. `cd admin`
2. `npm install`
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`.
4. `npm run dev` (starts on `http://localhost:3000`)
5. You can log in using the super admin account created during the data import or via the backend.

### Mobile App
1. `cd mobile`
2. (If missing native platforms) `flutter create .`
3. `flutter pub get`
4. Update the API URL in `lib/core/constants/api.dart` if testing on a physical device.
5. `flutter run`

---

## 2. Deployment Guide

### Fastify Backend (e.g. Railway)
- Connect your GitHub repo to Railway.
- Set the root directory to `backend`.
- Configure the environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, etc.).
- Ensure the start command is `npm start`.

### Admin Panel (Vercel)
- Connect repo to Vercel.
- Set root directory to `admin`.
- Configure the environment variable `NEXT_PUBLIC_API_URL` to point to your deployed Fastify backend (e.g., `https://my-backend.railway.app/api/v1`).
- Deploy.

### Mobile App (App Store & Google Play)
- Remove `android:usesCleartextTraffic="true"` from `mobile/android/app/src/main/AndroidManifest.xml`.
- Remove `NSAppTransportSecurity -> NSAllowsArbitraryLoads` from `mobile/ios/Runner/Info.plist`.
- Update `ApiConstants.baseUrl` to the production backend URL.
- Build for release: `flutter build apk` or `flutter build ipa`.

---

## Authors & License
Developed for advanced Arabic Bible study.
