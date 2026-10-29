# Arabic Van Dyck Bible Study

[![Build & Release APK](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml/badge.svg)](https://github.com/manalattia80-web/arabic-bible-study/actions/workflows/build-apk.yml)
[![Latest Release](https://img.shields.io/github/v/release/manalattia80-web/arabic-bible-study?label=Release&color=brightgreen)](https://github.com/manalattia80-web/arabic-bible-study/releases/latest)
[![Database Version](https://img.shields.io/badge/SQLite%20Database-v49%20(Verified)-blue)](mobile/assets/bible_study.db)
[![Quality Gate](https://img.shields.io/badge/CI%20Quality%20Gate-Passed%20(0%20Failures)-success)](scripts/automated_database_audit.cjs)

## Latest Verified Release: v1.0.320 (Database v49)

- **Release Package:** [Arabic Bible Study v1.0.320](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.320)
- **Database Engine:** **v49** (`bible_study_v49.db`, `targetDbVersion = 49`) — Guaranteed automatic upgrade with deferred cleanup of `bible_study_v48.db` after PRAGMA integrity verification.
- **Key Enhancements in v1.0.320 (Database v49):**
  1. **Flexible Multi-Component Strong's Schema Evolution:**
     - Migrated `word_mapping_strongs` primary key from `(mapping_id, strongs_id)` to `PRIMARY KEY (mapping_id, link_order)` with explicit index `idx_wms_mapping_strongs(mapping_id, strongs_id)`.
     - Overcomes the relational bottleneck where multi-word original codex tokens sharing a single Strong's lexeme were previously blocked by uniqueness constraints.
  2. **Daniel 3:30 «عَبْدَنَغُوَ» Lexical & Token Re-mapping:**
     - Removed erroneous Strong's `H5049` (נֶגֶד: opposite/before) from token «نغو».
     - Both original words (w6 `וַעֲבֵ֥ד` pos 6, role 'primary', `AC/Np` and w7 `נְגֹ֖ו` pos 7, role 'compound', `ANp`) now correctly reference the unified Aramaic entry **`H5665`** (`עֲבֵד נְגוֹ`).
     - Similarly unified Amos 1:4 «بَنْهَدَدَ» across w7 (`בֶּן־`) and w8 (`הֲדָֽד׃`) under **`H1130`** (`בֶּן־הֲדַד`).
  3. **Strict Canonical MorphGNT SBLGNT Raw Tagging:**
     - Standardized the raw morphology tag for enclitic pronoun `με` in John 14:19 («يَرَانِي» w6, «فَتَرَوْنَنِي» w12) to **`RP ----AS--`**, matching the authentic literal MorphGNT SBLGNT codex standard.
  4. **Fully Portable & Idempotent Harmonization Engine:**
     - Eliminated static UUID literals from database scripts, adopting robust dynamic relational lookups `(SELECT id FROM word_mappings WHERE ...)`.
  5. **100% CI Automated Quality Gate Pass:**
     - All 8 comprehensive validation suites verified with **0 failures**.

### Previous Release: v1.0.319 (Database v48)

- **Release Package:** [Arabic Bible Study v1.0.319](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.319)
- **Database Engine:** **v48** (`bible_study_v48.db`, `targetDbVersion = 48`) — Guaranteed automatic upgrade with deferred cleanup of `bible_study_v47.db` after PRAGMA integrity verification.
- **Key Enhancements in v1.0.319 (Database v48):**
  1. **Full Primary Component Synchronization Across Full Database:**
     - 100% harmonization between `word_mappings` and primary entries in `word_mapping_strongs` across all 404,700 records (0 mismatches in `orig_word_position`, `strongs_id`, `orig_morphology`, and `morph_source`).
     - Fixed all 53 position mismatches identified in independent audit (Gen 7:3, 1 Sam 19:15, Prov 15:6, Amos 1:4, Dan 3:30, John 14:19, Acts 6:8, Rom 9:23, Heb 10:18).
  2. **Source Provenance Harmonization:**
     - Restored authentic `oshb_wlc` provenance to Hebrew/Aramaic prefix words: «ثُمَّ», «عَلَى», «لِكَيْ» (1 Sam 19:15), «وَفِي» (Prov 15:6), «فِي» (Dan 3:30).
     - Standardized Arabic translation additions without Greek token counterparts (e.g. Acts 6:8 «فَإِذْ», «كَانَ») so they do not falsely claim `morphgnt_sblgnt` codex provenance.
  3. **Complete Composite Token Deconstruction & Greek Clitic Representation:**
     - Dan 3:30 «وَعَبْدَنَغُوَ»: Fully decomposed into w6 (`וַעֲבֵ֥ד`, H5665, `AC/Np`) and w7 (`נְגֹ֖ו`, H5049, `ANp`).
     - Dan 3:30 «شَدْرَخَ»: Standardized to Aramaic entry `H7715`, `AR/Np`.
     - 1 Sam 19:15 «أَقْتُلَهُ»: Clarified infinitive construct properties (`HVhc`), clearing inherited personal agreement from verbal fields.
     - John 14:19 «يَرَانِي» and «فَتَرَوْنَنِي»: Explicit secondary component representation for enclitic pronoun `με` (G3165, `RP ----1AS-`, tokens 6 and 12).
     - Romans 9:23 «مَجْدِهِ»: Explicit secondary component for pronoun `αὐτοῦ` (G846, `RP ----GSM-`, token 8).
     - Romans 9:23 «لِلْمَجْدِ»: Explicit secondary component for preposition `εἰς` (G1519, token 14).
     - Romans 9:23 «وَلِكَيْ»: Explicit secondary component for conjunction `καὶ` (G2532, token 1).
     - Acts 6:8 «وَقُوَّةً،» and «وَآيَاتٍ»: Explicit secondary component for conjunction `καὶ` (G2532, tokens 5 and 9).
  4. **Strict CI Quality Gates Enforced:**
     - Zero mismatches between `word_mappings` and primary `word_mapping_strongs` enforced as a blocking gate.
     - Component completeness gate enforced for all composite locators.

### Previous Release: v1.0.318 (Database v47)

- **Release Package:** [Arabic Bible Study v1.0.318](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.318)
- **Database Engine:** **v47** (`bible_study_v47.db`, `targetDbVersion = 47`) — Guaranteed automatic upgrade with deferred cleanup of `bible_study_v46.db` after PRAGMA integrity verification.
- **Key Philological, Morphological & Alignment Harmonization Across 10-Verse Independent Audit & Benchmarks:**
  1. **Proverbs 15:6 Exhaustive Attribute Purity & Codex Alignment:**
     - «كَنْزٌ»: Classified strictly as `noun` (`HNcmsa`, masculine singular absolute), clearing all obsolete verbal attributes.
     - «كَدَرٌ»: Exact OSHB Niphal participle raw tag **`HVNrfsa`** (`morph_pos = 'participle'`, `morph_stem = 'niphal'`, `morph_tense = 'participle'`, feminine singular absolute), clearing proper noun fields.
     - «وَفِي»: Aligned with compound conjunction/preposition prefix `וּ/בִ` in `וּבִתְבוּאַ֖ת` (`H9003`, `HC/R`, token 5, `OSHB:B20.C15.V6.w5`).
  2. **Daniel 3:30 Verb Property Cleanup & Abednego Compound Range:**
     - «قَدَّمَ»: Correctly classified as Aramaic `verb` (`AVhp3ms`, Hafel perfect 3ms), clearing inherited noun fields.
     - «وَعَبْدَنَغُوَ»: Expanded to full codex range locator **`OSHB:B27.C3.V30.w6-w7`** (`וַעֲבֵ֥ד נְגֹ֖ו`) with structured components for w6 (`וַעֲבֵ֥ד`, `AC/Ncmpc`) and w7 (`נְגֹ֖ו`, `Np`).
     - «الْمَلِكُ»: Corrected token position to **w2** (`מַלְכָּ֗א`, `OSHB:B27.C3.V30.w2`).
     - «فِي»: Aligned with preposition prefix `בִּ` in `בִּמְدִינַ֥ת` (`H9003`, `AR`, token 8).
  3. **John 14:19 True Greek Codex Positions & Full Conjugation:**
     - «سَتَحْيَوْنَ»: Aligned to genuine MorphGNT SBLGNT position **w18** (`SBLGNT:B43.C14.V19.w18`, `ζήσετε`, `V- 2FAI-P--`, future active indicative 2nd person plural), eliminating internal Arabic ordering distortion.
     - «أَنَا»: Aligned to position **w14** (`SBLGNT:B43.C14.V19.w14`, `ἐγὼ`, exact raw tag **`RP ----NS--`**, nominative singular 1st person).
     - Full verse alignment synchronized: w1 `ἔτι`, w2 `μικρὸν`, w5 `κόσμος`, w7 `οὐκέτι`, w8 `θεωρεῖ`, w9 `ὑμεῖς`, w10 `δὲ`, w11 `θεωρεῖτέ`, w13 `ὅτι`, w15 `ζῶ`, w17 `ὑμεῖς`, w18 `ζήσετε`.
  4. **James 1:17 (تَغْيِيرٌ) Grammatical Category Realignment:**
     - Reclassified as `noun` (`G3883`, `παραλλαγὴ`, `N- ----NSF-`, nominative feminine singular, token 20), clearing all stale verbal attributes.
  5. **1 Samuel 19:15 Strict Codex Source Tagging & Structural Purity:**
     - «الْفِرَاشِ»: Canonical OSHB raw tag **`HRd/Ncfsa`** (`H4296`, token 11, `OSHB:B9.C19.V15.w11`).
     - «ثُمَّ», «عَلَى», «لِكَيْ»: Transparently mapped to respective source prefixes (vav `H9002`, bet `H9003`, lamed `H9005`) with all stale verbal/nominal properties scrubbed.
  6. **Complete Alignment across Genesis 7:3, Amos 1:4, and Acts 6:8:**
     - Gen 7:3: All 14 words reconciled with WLC source tokens w1–w13 (including «أَيْضًا» at w1 `גַּם`).
     - Amos 1:4: Reconciled with OSHB tokens w1–w8 (including compound name «بَنْهَدَدَ» spanning w7–w8).
     - Acts 6:8: Reconciled with SBLGNT / TR tokens w1–w14 (including «اسْتِفَانُوسُ» at w1 `Στέφανος`, and TR reading «إِيمَانًا» at w4 `πίστεως`).
  7. **Lexical Metadata Transparency:**
     - Documented extended lexical identifiers `H9002`, `H9003`, and `H9005` in `strongs_entries` to distinguish them clearly from core Strong's numeric roots.
  8. **Independent CI Quality Gate:**
     - Assertions verify discrete values strictly against codex source benchmarks rather than self-referential script writes.

### Previous Release: v1.0.317 (Database v46)

- **Release Package:** [Arabic Bible Study v1.0.317](https://github.com/manalattia80-web/arabic-bible-study/releases/tag/v1.0.317)
- **Database Engine:** **v46** (`bible_study_v46.db`, `targetDbVersion = 46`) — Guaranteed automatic upgrade with deferred cleanup of `bible_study_v45.db` after PRAGMA integrity verification.
- **Key Philological & Systemic Enhancements Across 10-Verse Independent Sample & Benchmark Verses:**
  1. **Proverbs 15:6 Root Disambiguation:**
     - «كَنْزٌ»: Replaced erroneous `H2425` (חָיָה) with authentic **`H2633`** (`חֹסֶן`, `HNcmsa`, token 3, `OSHB:B20.C15.V6.w3`).
     - «كَدَرٌ»: Replaced proper noun `H5912` (עָכָן Achan) with authentic root **`H5916`** (`עָכַר`, surface `נֶעְכָּֽרֶת׃`, `HVNp3fs`, token 7, `OSHB:B20.C15.V6.w7`).
  2. **Daniel 3:30 Aramaic Lexicon & Proper Noun Restoration:**
     - «قَدَّمَ»: Replaced Hebrew `H6700` (צוּרִיאֵל) with authentic Aramaic verb **`H6744`** (`צְלַח`, surface `הַצְלַ֛ח`, `AVhp3ms`, token 3, `OSHB:B27.C3.V30.w3`).
     - «وَعَبْدَنَغُوَ»: Restored authentic Aramaic proper noun **`H5665`** (`עֲבֵד נְגוֹ`, surface `וַעֲבֵ֥ד נְגֹ֖ו`, `AC/Np`, token 6, `OSHB:B27.C3.V30.w6`).
  3. **Jeremiah 51:22 Triple Verb Restoration:**
     - «وَأَسْحَقُ»: Restored authentic root **`H5310`** (`נָפַץ`, surface `וְנִפַּצְתִּ֤י`, `HC/Vpq1cs`) across all three occurrences (tokens w1, w5, w9).
  4. **John 14:19 Grammatical Person Alignment:**
     - «سَتَحْيَوْنَ»: Corrected surface from 1st person `ζῶ` to 2nd person plural future **`ζήσετε`** (`G2198`, `V- 2FAI-P--`, token 14, `SBLGNT:B43.C14.V19.w14`).
  5. **Romans 9:23 Verbal Compound Unification:**
     - «سَبَقَ فَأَعَدَّهَا»: Unified into single Greek verb **`G4282`** (`προετοιμάζω`, surface `προητοίμασεν`, `V- 3AAI-S--`, token 13, `SBLGNT:B45.C9.V23.w13`), eliminating spurious TR entries.
  6. **Hebrews 10:18 Verbless Clause Implied Copula:**
     - «تَكُونُ» & «يَكُونُ»: Correctly classified as Arabic implied copula (`syntactic_ar`, `relation_type = 'copula_implied'`, `orig_word_position = NULL`), removing false audible Greek verb links.
  7. **1 Samuel 19:15 Systemic Realignment:**
     - Restored **`H4296`** (`בַמִּטָּ֛ה`, token 11) for «الْفِرَاشِ» and **`H4191`** (`לַהֲמִתֹֽו׃`, token 13) for «أَقْتُلَهُ».
  8. **James 1:17 & Micah 6:8 Benchmark Integration:**
     - James 1:17 «تَغْيِيرٌ» -> **`G3883`** (`παραλλαγὴ`, `N- ----NSF-`, token 20); «ظِلُّ» -> **`G644`** (`ἀποσκίασμα`, `N- ----NSN-`, token 23).
     - Micah 6:8 «مَا» -> **`H4100`** (`מַה־`, `HTi`, token 4).
- **CI Quality Gate:** **87 / 87 Checks Passed (100%)** | 0 Failures

### Previous Release: v1.0.316 (Database v45)

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
