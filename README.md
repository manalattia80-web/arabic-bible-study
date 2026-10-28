# Arabic Van Dyck Bible Study

[![Build & Release APK](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml/badge.svg)](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml)
[![Latest Release](https://img.shields.io/github/v/release/manalattia80-web/arabic-bible-study?label=Release&color=brightgreen)](https://github.com/manalattia80-web/arabic-bible-study/releases/latest)
[![Database Version](https://img.shields.io/badge/SQLite%20Database-v42%20(Verified)-blue)](mobile/assets/bible_study.db)
[![Quality Gate](https://img.shields.io/badge/CI%20Quality%20Gate-66%2F66%20Passed-success)](scripts/automated_database_audit.cjs)

## Latest Verified Release: v1.0.312 (Database v42)

- **Release Package:** [Arabic Bible Study v1.0.312](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.312)
- **Database Engine:** **v42** (`bible_study_v42.db`, `targetDbVersion = 42`) — Guaranteed automatic upgrade from v40/v41 with deferred cleanup of `bible_study_v41.db` after PRAGMA integrity verification.
- **Key Philological & Systemic Enhancements:**
  1. **Strict Canonical Raw Morphology (OSHB WLC & MorphGNT SBLGNT):**
     - **Ephesians 2:8 (وَذلِكَ):** `orig_morphology = 'RD ----NSN-'` (Nominative Singular Neuter).
     - **Isaiah 53:5 (مَجْرُوحٌ):** `orig_morphology = 'HVOsmsa'` (Polal passive participle masculine singular absolute).
     - **Isaiah 53:5 (سَلاَمِنَا):** `orig_morphology = 'HNcmsc/Sp1cp'` (construct `c` before suffix).
     - **Isaiah 53:5 (وَبِحُبُرِهِ):** `orig_morphology = 'HC/R/Ncfsc/Sp3ms'` (construct `c` before suffix).
  2. **Scholarly Lexicon & Multi-Token Span Documentation:**
     - **Isaiah 53:5 (شُفِينَا):** Spans WLC tokens w10-w11 (`נִרְפָּא־לָֽנוּ`), `verified_locator = 'OSHB:B23.C53.V5.w10-w11'`.
     - Documented `H3807a` as an authoritative scholarly extension in `strongs_entries` for `לָנוּ` (preposition + 1cp suffix) to prevent confusion with `H3807` (`כָּתַת`).
  3. **100% Provenance & Source Reconciliation:**
     - **1 Sam 25:43 (فَكَانَتَا):** Reconciled to `morph_source = 'oshb_wlc'`, `verified_source = 'OSHB'`, `orig_morphology = 'HC/Vqw3fp'`, locator `OSHB:B9.C25.V43.w6`.
     - **Acts 1:8 (سَتَنَالُونَ):** Reconciled from `morphgnt_tr` to `morph_source = 'morphgnt_sblgnt'`, `verified_source = 'SBLGNT'`, `orig_morphology = 'V-FDI-2P'`, locator `SBLGNT:B44.C1.V8.w2`.
     - **Hebrews 11:1 (فَهُوَ):** Reconciled from `morphgnt_tr` to `morph_source = 'morphgnt_sblgnt'`, `verified_source = 'SBLGNT'`, `orig_morphology = 'V-PAI-3S'`, locator `SBLGNT:B58.C11.V1.w1`.
     - Added hard CI invariants enforcing zero conflicting source/locator pairs and zero verb records assigned to `syntactic_ar`.
  4. **Unified Persistent Audio Engine & Self-Healing:**
     - Migrated audio cache to persistent `getApplicationDocumentsDirectory() / audio_cache` to prevent OS eviction.
     - Strict multi-format byte validation checking MPEG frame sync, RIFF WAV, Ogg, and AAC ADTS headers, with automatic rejection of HTML/error bodies.
     - Universal self-healing playback helper (`_playFileWithSelfHealing`) protecting both Strong's repository audio and TTS.
- **CI Quality Gate:** **70 / 70 Checks Passed (100%)** | 0 Failures





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
