# Arabic Van Dyck Bible Study

[![Build & Release APK](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml/badge.svg)](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml)
[![Latest Release](https://img.shields.io/github/v/release/manalattia80-web/arabic-bible-study?label=Release&color=brightgreen)](https://github.com/manalattia80-web/arabic-bible-study/releases/latest)
[![Database Version](https://img.shields.io/badge/SQLite%20Database-v40%20(Verified)-blue)](mobile/assets/bible_study.db)
[![Quality Gate](https://img.shields.io/badge/CI%20Quality%20Gate-48%2F48%20Passed-success)](scripts/automated_database_audit.cjs)

## Latest Verified Release: v1.0.309 (Database v40)

- **Release Package:** [Arabic Bible Study v1.0.309](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.309)
- **Database Engine:** **v40** (guaranteed safe upgrade from v38/v39 on client devices with PRAGMA integrity check and deferred cleanup)
- **Key Philological & Lexical Fixes:**
  1. **Matthew 17:20 Alignment to MorphGNT SBLGNT:** "لهذا" aligned to Greek token 22 (`τούτῳ`, `RD ----DSN-`, `SBLGNT:B40.C17.V20.w22`), separating raw source morphology from unified app grammar `D-DSN` and correcting original token order to 22.
  2. **Genesis 3:6 Morphology:** "للنظر" morphological fields updated to Hifil Infinitive Construct (`HR/Vhc`), removing obsolete qal/wayyiqtol and gender/person attributes of "فرأت".
  3. **Genesis 3:18 Provenance:** "لك" verification locator aligned to OSHB Westminster Leningrad Codex (`OSHB:B1.C3.V18.w4`, `HR/Sp2ms`).
  4. **Genesis 3:6 Lexicon:** "للعيون" corrected to `H5869` (`עַיִן` / eye). "بهجة" aligned to `H8378` (`תַּאֲוָה`).
  5. **Colossians 1:23:** "على" classified as `syntactic_ar`.
  6. **Jeremiah 52:4:** "وبنوا" purified to 100% Hebrew script `וַיִּבְנוּ`.
  7. **Job 31:14:** "حين" corrected to `H3588` (`כִּי`) instead of `מִן`.
  8. **Judges 7:9 & Genesis 41:46:** Obsolete orphan multi-mappings cleaned up.
- **CI Quality Gate:** **48 / 48 Benchmark Loci Passed (100%)** | 0 Integrity Errors

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
