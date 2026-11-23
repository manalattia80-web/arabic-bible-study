# Google Play Internal Testing Readiness Report — `v1.0.383+383`

- **Branch**: `release/play-internal-prep`
- **Verified Build Commit**: `1b10ce5` (GitHub Actions Run [`45189145505`](https://github.com/manalattia80-web/arabic-bible-study/actions/runs/45189145505))
- **Baseline Reference**: `v1.0.382+382` (`0cd8145`, GitHub Actions Baseline Audit Run [`45183593022`](https://github.com/manalattia80-web/arabic-bible-study/actions/runs/45183593022))
- **Database Integrity (Frozen `v382`)**:
  - `targetDbVersion = 382` (unchanged)
  - `totalParts = 70` (`part_00.dat` .. `part_69.dat`)
  - Reassembled `bible_study.db` SHA-256: `b91b4c188be54ad8746593158ea48a8bef8cf37c8ccec349108111274c00266e` (bitwise identical before & after; verified post-build on compressed APK via `verify_apk_asset_integrity.cjs`)

---

## 1. Before vs. After Comparison (`v1.0.382` → `v1.0.383`)

| Dimension | `v1.0.382` (Baseline) | `v1.0.383` (Play-Ready) | Change / Verdict |
| :--- | :--- | :--- | :--- |
| **Flutter / Dart** | Flutter `3.24.3` | Flutter `3.50.1` (stable) | Upgraded for API 36 & 16 KB |
| **Gradle / AGP / Kotlin / NDK** | `7.6.3` / `7.4.2` / `1.8.22` | `9.3.1` / `9.1.1` / `2.2.10` / `NDK 28.0.12433566` | Upgraded for API 36 & 16 KB |
| **`compileSdk` / `targetSdk`** | `34` / `34` (Android 14) | **`36` / `36`** (Android 16) | **Compliant** (Aug 2026 Play policy) |
| **`minSdkVersion`** | `21` (Android 5.0) | **`24`** (Android 7.0) | **Raised from 21 → 24** (Flutter `3.50.1` minimum) |
| **AAB File Size** | `~425 MB` | **`167 MB`** (`174,836,071` bytes) | **`-258 MB` (`-60.7%`)** |
| **APK File Size** | `~392 MB` | **`167 MB`** (`174,519,492` bytes) | **`-225 MB` (`-57.4%`)** |
| **`base-master.apk` (Split)** | `352 MB` (uncompressed `.dat`) | **`116 MB`** (`Defl:N` compressed `.dat`) | **`-236 MB` (`-67.0%`)** device storage saved |
| **`bundletool get-size total` (`arm64-v8a`)** | `128.81–128.99 MB` | **`126.75–126.87 MB`** | **Well below `500 MB` Play limit** |
| **`bundletool get-size total` (All ABIs)** | `121.34–129.12 MB` | **`126.36–127.11 MB`** | **Play Asset Delivery NOT required** |
| **`bundletool validate`** | Pass | **Pass** | Verified with `bundletool 1.18.3` |
| **16 KB ZIP Alignment (`-P 16`)** | — | **Pass** (`base-arm64_v8a.apk` & full APK) | Verified with `build-tools 36.0.0` |
| **16 KB ELF LOAD Alignment** | Legacy 4 KB toolchain | **Pass (`0x4000` / `0x10000`) on all 12 `.so`** | Verified with `readelf -lW` |
| **Restricted Play Permissions** | `REQUEST_INSTALL_PACKAGES`, `READ_MEDIA_IMAGES/VIDEO/AUDIO`, `READ_EXTERNAL_STORAGE` | **Removed** (`INTERNET` + `ACCESS_NETWORK_STATE` only) | **Play Policy Clean** |
| **Signing Certificate SHA-256** | `cf01f6cbfb94a557317e7e39916a5c8b325d399c740f3ea4f3e2c112b2815615` | `cf01f6cbfb94a557317e7e39916a5c8b325d399c740f3ea4f3e2c112b2815615` | **Bitwise Identical** (upgrade-safe) |

---

## 2. 16 KB Memory Page-Size Verification (`readelf -lW`)

All 64-bit (`arm64-v8a`, `x86_64`) and 32-bit (`armeabi-v7a`) native libraries inside `play-store-bundle-v383.aab` have ELF `LOAD` segment alignment `>= 0x4000` (16 KB):

| Library | `arm64-v8a` | `x86_64` | `armeabi-v7a` |
| :--- | :---: | :---: | :---: |
| `libapp.so` | `0x10000` (64 KB) | `0x10000` (64 KB) | `0x4000` (16 KB) |
| `libflutter.so` | `0x10000` (64 KB) | `0x10000` (64 KB) | `0x10000` (64 KB) |
| `libdartjni.so` | `0x4000` (16 KB) | `0x4000` (16 KB) | `0x4000` (16 KB) |
| `libdatastore_shared_counter.so` | `0x4000` (16 KB) | `0x4000` (16 KB) | `0x4000` (16 KB) |

---

## 3. Compression & Startup Impact Decision

- Removing `noCompress 'dat'` compressed `part_00.dat` by **76%** (`5,242,880 → 1,275,563` bytes) and `part_69.dat` by **45%** (`3,657,728 → 2,001,548` bytes), shrinking `base-master.apk` from **352 MB → 116 MB** and the AAB from **~425 MB → 167 MB**.
- Because actual `bundletool get-size total` download size is **`126.4–127.1 MB`** (25% of Google Play's `500 MB` compressed base-module limit), **Play Asset Delivery is unnecessary** and would only add runtime complexity.
- **Upgrade over `v382`**: Because `targetDbVersion` remains `382`, upgrading from `v382` to `v383` reuses the already-assembled `bible_study_v382.db` with zero reassembly delay, preserving user settings and search history.
- **Clean install**: `DatabaseService` streams the 70 compressed `.dat` assets through Flutter's `rootBundle.load` into a temporary file, validates SQLite integrity, and atomically activates `bible_study_v382.db`.

---

## 4. Minimum Supported Android Version Disclosure

- Upgrading from Flutter `3.24.3` to Flutter `3.50.1` (required for API 36 & 16 KB page alignment) raised `minSdkVersion` from **API 21 (Android 5.0)** to **API 24 (Android 7.0)**. Devices running Android 5.0–6.0 (API 21–23) are no longer supported by `v1.0.383+`.

---

## 5. Next Verification Step (On-Device / Play Internal Track)

- **Artifacts**: Download `play-internal-prep-v1.0.383` from GitHub Actions Run [`45189145505`](https://github.com/manalattia80-web/arabic-bible-study/actions/runs/45189145505/artifacts/14825252251) (contains `play-store-bundle-v383.aab` for Google Play Internal Testing upload and `arabic-bible-study-v383.apk` for direct on-device upgrade testing over `v1.0.382`).
- **Status**: Experimental / Internal Testing candidate; content accuracy assessment remains separate from Play packaging readiness.
