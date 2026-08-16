# Data Import Scripts — Step-by-Step Guide

This directory contains Node.js scripts to populate your Supabase database with Bible data.
Run them **in order**, once each.

---

## Prerequisites

- Node.js v18 or higher
- A Supabase project with the schema applied (`database/schema.sql`)

---

## Setup

```bash
cd scripts
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_KEY` — your service role key (Settings → API)

---

## Step 0: Apply the Database Schema

Go to your **Supabase Dashboard → SQL Editor**, paste the contents of `../database/schema.sql`, and click **Run**.

---

## Step 1: Import Strong's Dictionary (Automatic)

> Downloads ~8,700 Hebrew + ~5,600 Greek entries directly from GitHub. No files to download.

```bash
npm run import:strongs
```

Expected output:
```
✅ Supabase connection OK
📖 Fetching hebrew Strong's dictionary...
  ✅ strongs_entries (hebrew): 8674 inserted, 0 errors
📖 Fetching greek Strong's dictionary...
  ✅ strongs_entries (greek): 5624 inserted, 0 errors
```

---

## Step 2: Download AVD USFM Files

1. Visit **https://ebible.org/ara/** (Arabic Van Dyck)
2. Click **"Download"** → download the USFM zip
3. Extract the zip — you'll find `.usfm` files named like `GEN.usfm`, `EXO.usfm`, etc.
4. Create the directory and copy all files:
   ```
   scripts/data/avd/GEN.usfm
   scripts/data/avd/EXO.usfm
   ... (all 66 books)
   ```

Then run:
```bash
npm run import:avd
```

Expected output:
```
✅ Supabase connection OK
📚 Step 1: Inserting books...
  ✅ books: 66 inserted, 0 errors
📖 Step 2: Parsing USFM files...
  ✓ Genesis              — 50 chapters, 1533 verses
  ✓ Exodus               — 40 chapters, 1213 verses
  ...
📝 Step 5: Inserting 31102 verses...
  ✅ verses: 31102 inserted, 0 errors
```

---

## Step 3: Download Hebrew OT Data (STEPBible TAHOT)

1. Visit **https://github.com/STEPBible/STEPBible-Data**
2. Navigate to **`Translators Amalgamated OT (TAHOT)/`**
3. Download **`TAHOT.txt`**
4. Save it as:
   ```
   scripts/data/hebrew/TAHOT.tsv
   ```

Then run:
```bash
npm run import:hebrew-ot
```

Expected output:
```
✅ Supabase connection OK
🗺️  Step 1: Building verse lookup map (OT only)...
   Loaded 23145 OT verse UUIDs
📖 Step 2: Parsing TAHOT file...
   Processed 423,500 words...
📝 Step 4: Inserting 423518 Hebrew word mappings...
  ✅ word_mappings (Hebrew OT): 423518 inserted, 0 errors
```

> **Note:** The `ar_word` column is initially set to the Hebrew word.
> Admins must update each row in the Admin Panel to map the correct Arabic AVD word.

---

## Step 4: Download Greek NT Data (STEPBible TAGNT)

1. Visit **https://github.com/STEPBible/STEPBible-Data**
2. Navigate to **`Translators Amalgamated NT (TAGNT)/`**
3. Download **`TAGNT.txt`**
4. Save it as:
   ```
   scripts/data/greek/TAGNT.tsv
   ```

Then run:
```bash
npm run import:greek-nt
```

Expected output:
```
✅ Supabase connection OK
🗺️  Step 1: Building verse lookup map (NT only)...
   Loaded 7957 NT verse UUIDs
📖 Step 2: Parsing TAGNT file...
   Processed 137,500 words...
📝 Step 4: Inserting 137741 Greek word mappings...
  ✅ word_mappings (Greek NT): 137741 inserted, 0 errors
```

---

## Run All Scripts at Once

If you have all files ready:
```bash
npm run import:all
```

---

## After Import — Verify Row Counts

Run this SQL in Supabase SQL Editor to verify:
```sql
SELECT
  (SELECT COUNT(*) FROM strongs_entries)    AS strongs,
  (SELECT COUNT(*) FROM books)              AS books,
  (SELECT COUNT(*) FROM chapters)           AS chapters,
  (SELECT COUNT(*) FROM verses)             AS verses,
  (SELECT COUNT(*) FROM word_mappings)      AS word_mappings;
```

Expected results:
| strongs | books | chapters | verses | word_mappings |
|---------|-------|----------|--------|---------------|
| ~14,298 | 66    | ~1,189   | ~31,102 | ~561,000     |

---

## Data Directory Structure

```
scripts/data/
├── avd/
│   ├── GEN.usfm
│   ├── EXO.usfm
│   └── ... (66 files total)
├── hebrew/
│   └── TAHOT.tsv
└── greek/
    └── TAGNT.tsv
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Missing SUPABASE_URL` | Copy `.env.example` to `.env` and fill credentials |
| `No .usfm files found` | Download AVD from ebible.org and put in `data/avd/` |
| `TAHOT file not found` | Download from STEPBible GitHub and save as `data/hebrew/TAHOT.tsv` |
| `No OT books found` | Run `import-avd.js` before `import-hebrew-ot.js` |
| Duplicate key errors | Normal on re-run — upsert mode handles this automatically |
