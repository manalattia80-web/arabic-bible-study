# Arabic Van Dyck Bible Study

[![Build & Release APK](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml/badge.svg)](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml)
[![Latest Release](https://img.shields.io/github/v/release/manalattia80-web/arabic-bible-study?label=Release&color=brightgreen)](https://github.com/manalattia80-web/arabic-bible-study/releases/latest)
[![Database Version](https://img.shields.io/badge/SQLite%20Database-v38%20(Verified)-blue)](mobile/assets/bible_study.db)
[![Quality Gate](https://img.shields.io/badge/CI%20Quality%20Gate-43%2F43%20Passed-success)](scripts/automated_database_audit.cjs)

## Latest Verified Release: v1.0.304 (Run #304)

- **GitHub Actions Run ID:** [`40506974082`](https://github.com/manalattia80-web/arabic-bible-study/actions/runs/40506974082) (Status: **Success / Completed**)
- **Release Package:** [Arabic Bible Study v1.0.304](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.304)
- **Commit:** `66132b5` (`feat: normalize primary_* roles, fix Gen 4:18 names, restore 23 placeholder words, and align NT spreadsheet loci`)
- **Published Artifacts:**
  - `arabic-bible-study-app.apk` (353.83 MB)
  - `play-store-bundle.aab` (126.84 MB)

### Automated Scientific Quality Gate Results
- **Benchmark Regression:** **43 / 43 Passed** (100%)
- **Compound Affixes & Multi-Strongs:** **8 / 8 Verified** (100%)
- **Primary Strongs Conflicts:** **0**
- **Orphan / Null / Cross-testament Anomalies:** **0**
- **SQLite Database Integrity Check (`PRAGMA integrity_check`):** **OK**
- **Key Philological Fixes in v1.0.304:**
  1. **Normalized Roles:** All 31 `primary_*` special roles unified into `primary` in `word_mapping_strongs`.
  2. **Genesis 4:18:** Corrected `عِيرَادُ` from `H5872` (Ein Gedi) to `H5897` (`עִירָד`), and `مَتُوشَائِيلَ` from `H4968` to `H4967` (`מְתוּשָׁאֵל`).
  3. **23 Missing Loci Restored:** Replaced all placeholder characters (`---`) with authentic Hebrew/Greek lemmas and inflected forms.
  4. **10 NT Spreadsheet Loci Fixed:** Realigned Romans 1:20 (`G517`), 1Cor 1:11 (`G5514`), 2Cor 1:10 (`G5082`), 2Cor 1:24 (`G4904`), Gal 2:4 (`G5569` & `G2684`), etc.

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
