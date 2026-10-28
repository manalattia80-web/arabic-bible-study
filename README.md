# Arabic Van Dyck Bible Study

[![Build & Release APK](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml/badge.svg)](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml)
[![Latest Release](https://img.shields.io/github/v/release/manalattia80-web/arabic-bible-study?label=Release&color=brightgreen)](https://github.com/manalattia80-web/arabic-bible-study/releases/latest)
[![Database Version](https://img.shields.io/badge/SQLite%20Database-v45%20(Verified)-blue)](mobile/assets/bible_study.db)
[![Quality Gate](https://img.shields.io/badge/CI%20Quality%20Gate-76%2F76%20Passed-success)](scripts/automated_database_audit.cjs)

## Latest Verified Release: v1.0.316 (Database v45)

- **Release Package:** [Arabic Bible Study v1.0.316](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.316)
- **Database Engine:** **v45** (`bible_study_v45.db`, `targetDbVersion = 45`) — Guaranteed automatic upgrade with deferred cleanup of `bible_study_v44.db` after PRAGMA integrity verification.
- **Key Philological & Structural Enhancements:**
  1. **Canonical MorphGNT Raw Code for Ephesians 2:8 (καί):**
     - Aligned component `G2532` (`καί`, token 8) with authentic MorphGNT SBLGNT adverbial raw tag: **`D- --------`** (previously `C- --------`).
  2. **Harmonized Surface & Component for John 3:16 (Οὕτως):**
     - Corrected component surface in `word_mapping_strongs` to exact canonical form **`Οὕτως`** (matching primary `orig_surface` and SBLGNT codex).
     - Standardized component form for Acts 1:8 `λήμψεσθε`.
  3. **Methodological Transparency on Field Completeness vs Codex Proof:**
     - Acknowledged and documented that of 404,700 records in `word_mapping_strongs`, 322,958 have all three structural fields populated while 81,742 have unpopulated attributes (predominantly uninflected base entries in raw sources). Field completeness is strictly distinguished from token-by-token codex verification.
  4. **Comprehensive Automated Range & Position Quality Gates:**
     - Enforced non-null `orig_word_position` across all records bearing biblical codex locators.
     - Validated endpoint ordering (`end >= start`) on all range locators.
     - Verified bounded component ranges: all components of multi-word range locators fall strictly within `[start, end]`.
- **CI Quality Gate:** **76 / 76 Checks Passed (100%)** | 0 Failures

### Previous Release: v1.0.315 (Database v44)

- **Release Package:** [Arabic Bible Study v1.0.315](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.315)
- **Database Engine:** **v44** (`bible_study_v44.db`, `targetDbVersion = 44`) — Guaranteed automatic upgrade with deferred cleanup of `bible_study_v43.db` after PRAGMA integrity verification.
- **Key Philological & Structural Enhancements:**
  1. **John 3:16 Word Positions 1 & 2 Canonical Alignment:**
     - **«هكَذَا» (pos 2 in Arabic):** Pointed correctly to SBLGNT token 1 (`Οὕτως`, `orig_word_position = 1`, `verified_locator = SBLGNT:B43.C3.V16.w1`, `orig_morphology = D- --------`).
     - **«لأَنَّهُ» (pos 1 in Arabic):** Pointed correctly to SBLGNT token 2 (`γάρ`, `orig_word_position = 2`, `verified_locator = SBLGNT:B43.C3.V16.w2`, `orig_morphology = C- --------`).
  2. **Structured Component Fields in `word_mapping_strongs`:**
     - Added independent schema columns: `orig_word_position` (INTEGER), `orig_morphology` (TEXT), and `morph_source` (TEXT).
     - **Isaiah 53:5 (شُفِينَا):** Component 1 (`H7495`, `נִרְפָּא`, pos 10, `HVNp3ms`, `oshb_wlc`), Component 2 (`H3807a`, `לָנוּ`, pos 11, `HR/Sp1cp`, `oshb_wlc`).
     - Populated structured positions and raw morphologies for compound components (including John 3:16 `بِهِ`, Ephesians 2:8 `وَذلِكَ`, etc.).
  3. **General Automated Locator & Position Invariant Rules:**
     - Enforced across the entire 433,681 database records that single locators (`.wN`) strictly match `orig_word_position === N` (0 mismatches database-wide).
     - Reconciled residual historical locators (1 Sam 25:43 pos 5, Jer 45:5, Jer 51:64, Acts 22:30).
     - Verified multi-word range locators (`.wN1-wN2`) against composite component tables.
- **CI Quality Gate:** **73 / 73 Checks Passed (100%)** | 0 Failures

### Previous Release: v1.0.314 (Database v43)

- **Release Package:** [Arabic Bible Study v1.0.314](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.314)
- **Database Engine:** **v43** (`bible_study_v43.db`, `targetDbVersion = 43`) — Guaranteed automatic upgrade from v41/v42 with deferred cleanup of `bible_study_v42.db` after PRAGMA integrity verification.
- **Key Philological & Systemic Enhancements:**
  1. **Canonical MorphGNT SBLGNT Raw Morphology Tags:**
     - **Acts 1:8 (سَتَنَالُونَ):** Replaced Robinson tag with literal MorphGNT SBLGNT tag `V- 2FMI-P--` (Verb, 2nd Person Future Middle Indicative Plural).
     - **Acts 1:8 (حَلَّ):** Literal MorphGNT tag `V- -AAPGSN-`.
     - **Acts 1:8 (لِي):** Literal MorphGNT tag `RP ----GS--`.
     - **Hebrews 11:1 (فَهُوَ):** Replaced Robinson tag with literal MorphGNT SBLGNT tag `V- 3PAI-S--` (Verb, 3rd Person Present Active Indicative Singular).
     - **Hebrews 11:1 (يُرْجَى):** Literal MorphGNT tag `V- -PPPGPN-`.
     - **John 3:16 (هكَذَا):** Literal MorphGNT tag `D- --------`.
     - **John 3:16 (بِهِ):** Literal MorphGNT tag `RP ----ASM-`.
     - **Revelation 21:4 (وَجَعٌ):** Literal MorphGNT tag `N- ----NSM-`.
     - **Revelation 21:4 (مَضَتْ):** Literal MorphGNT tag `V- 3AAI-P--`.
  2. **1 Samuel 25:43 (فَكَانَتَا) Position Verification:**
     - Populated `orig_word_position = 6` corresponding to WLC token 6 (`וַתִּהְיֶ֧יןָ`), with strict test assertion.
  3. **Isaiah 53:5 (شُفِينَا) Raw Morphology Separation & Transparent H3807a Definition:**
     - Separated composite morphology: `word_mappings.orig_morphology = 'HVNp3ms'` (primary verb token w10 `נִרְפָּא`).
     - Preserved individual components in `word_mapping_strongs`: component 1 (`H7495`, `נִרְפָּא`), component 2 (`H3807a`, `לָנוּ`).
     - Transparently declared `H3807a` in `strongs_entries` as an internal project syntactic identifier (`معرّف نحوي داخلي للمشروع`) representing `לָנוּ` (preposition Lamed + 1cp suffix; OSHB `HR/Sp1cp`, WLC w11) to avoid numeric collision with primitive verbal root `H3807` (`כָּתַת`).
  4. **Strict Methodology on Claims & Provenance:**
     - Formally distinguished between discrete token-by-token codex-verified benchmarks and database-wide structural invariant checks.
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
