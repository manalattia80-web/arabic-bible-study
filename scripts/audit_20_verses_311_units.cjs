const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

function query(sql) {
  const tmpFile = path.resolve(__dirname, 'temp_query_audit.sql');
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    return execSync(`"${sqlitePath}" "${dbPath}" < "${tmpFile}"`, { encoding: 'utf8' }).trim();
  } finally {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
  }
}

// OSHB XML Parser
const oshbDir = path.resolve(__dirname, 'data/oshb');
function extractOshbVerse(bookName, osisRef) {
  const filePath = path.join(oshbDir, `${bookName}.xml`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const verseRegex = new RegExp(`<verse\\s+osisID="${osisRef}"[^>]*>([\\s\\S]*?)</verse>`);
  const match = content.match(verseRegex);
  if (!match) return null;
  const verseXml = match[1];
  const words = [];
  const wordRegex = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
  let wMatch;
  let idx = 1;
  while ((wMatch = wordRegex.exec(verseXml)) !== null) {
    const attrs = wMatch[1];
    const text = wMatch[2].replace(/<[^>]+>/g, '').trim();
    const lemmaMatch = attrs.match(/lemma="([^"]+)"/);
    const morphMatch = attrs.match(/morph="([^"]+)"/);
    const idMatch = attrs.match(/id="([^"]+)"/);
    words.push({
      index: idx++,
      id: idMatch ? idMatch[1] : null,
      lemma: lemmaMatch ? lemmaMatch[1] : null,
      morph: morphMatch ? morphMatch[1] : null,
      text: text
    });
  }
  return words;
}

// SBLGNT Parser
const sblgntDir = path.resolve(__dirname, 'data/sblgnt');
const sblgntBookMap = {
  41: '62-Mk-morphgnt.txt',
  42: '63-Lk-morphgnt.txt',
  45: '66-Ro-morphgnt.txt',
  48: '69-Ga-morphgnt.txt',
  49: '70-Eph-morphgnt.txt',
  50: '71-Php-morphgnt.txt',
  52: '73-1Th-morphgnt.txt',
  60: '81-1Pe-morphgnt.txt'
};

function extractSblgntVerse(bookId, chapter, verse) {
  const fileName = sblgntBookMap[bookId];
  if (!fileName) return null;
  const filePath = path.join(sblgntDir, fileName);
  if (!fs.existsSync(filePath)) return null;
  const prefix = String(bookId - 39).padStart(2, '0') +
                 String(chapter).padStart(2, '0') +
                 String(verse).padStart(2, '0');
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');
  const tokens = [];
  let idx = 1;
  for (const line of lines) {
    if (!line.startsWith(prefix)) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 7) {
      tokens.push({
        index: idx++,
        pos: parts[1],
        parseCode: parts[2],
        morph: `${parts[1]} ${parts[2]}`,
        surfacePunct: parts[3],
        surfaceClean: parts[4],
        surfaceNorm: parts[5],
        lemma: parts[6]
      });
    }
  }
  return tokens;
}

const targetVerses = [
  // 10 Hebrew
  { book: 2, ch: 15, vs: 2, name: 'Exod 15:2', nameAr: 'الخروج ١٥:٢', lang: 'hebrew', oshbFile: 'Exod', oshbOsis: 'Exod.15.2' },
  { book: 3, ch: 26, vs: 12, name: 'Lev 26:12', nameAr: 'اللاويين ٢٦:١٢', lang: 'hebrew', oshbFile: 'Lev', oshbOsis: 'Lev.26.12' },
  { book: 5, ch: 6, vs: 5, name: 'Deut 6:5', nameAr: 'التثنية ٦:٥', lang: 'hebrew', oshbFile: 'Deut', oshbOsis: 'Deut.6.5' },
  { book: 6, ch: 1, vs: 9, name: 'Josh 1:9', nameAr: 'يشوع ١:٩', lang: 'hebrew', oshbFile: 'Josh', oshbOsis: 'Josh.1.9' },
  { book: 8, ch: 1, vs: 16, name: 'Ruth 1:16', nameAr: 'راعوث ١:١٦', lang: 'hebrew', oshbFile: 'Ruth', oshbOsis: 'Ruth.1.16' },
  { book: 11, ch: 18, vs: 21, name: '1Kgs 18:21', nameAr: '١ ملوك ١٨:٢١', lang: 'hebrew', oshbFile: '1Kgs', oshbOsis: '1Kgs.18.21' },
  { book: 20, ch: 3, vs: 5, name: 'Prov 3:5', nameAr: 'الأمثال ٣:٥', lang: 'hebrew', oshbFile: 'Prov', oshbOsis: 'Prov.3.5' },
  { book: 23, ch: 40, vs: 8, name: 'Isa 40:8', nameAr: 'إشعياء ٤٠:٨', lang: 'hebrew', oshbFile: 'Isa', oshbOsis: 'Isa.40.8' },
  { book: 33, ch: 6, vs: 8, name: 'Mic 6:8', nameAr: 'ميخا ٦:٨', lang: 'hebrew', oshbFile: 'Mic', oshbOsis: 'Mic.6.8' },
  { book: 38, ch: 4, vs: 6, name: 'Zech 4:6', nameAr: 'زكريا ٤:٦', lang: 'hebrew', oshbFile: 'Zech', oshbOsis: 'Zech.4.6' },
  // 8 Greek
  { book: 41, ch: 10, vs: 45, name: 'Mark 10:45', nameAr: 'مرقس ١٠:٤٥', lang: 'greek', sblgntBookId: 41 },
  { book: 42, ch: 15, vs: 20, name: 'Luke 15:20', nameAr: 'لوقا ١٥:٢٠', lang: 'greek', sblgntBookId: 42 },
  { book: 45, ch: 8, vs: 28, name: 'Rom 8:28', nameAr: 'رومية ٨:٢٨', lang: 'greek', sblgntBookId: 45 },
  { book: 48, ch: 5, vs: 22, name: 'Gal 5:22', nameAr: 'غلاطية ٥:٢٢', lang: 'greek', sblgntBookId: 48 },
  { book: 49, ch: 2, vs: 8, name: 'Eph 2:8', nameAr: 'أفسس ٢:٨', lang: 'greek', sblgntBookId: 49 },
  { book: 50, ch: 4, vs: 6, name: 'Phil 4:6', nameAr: 'فيلبي ٤:٦', lang: 'greek', sblgntBookId: 50 },
  { book: 52, ch: 5, vs: 23, name: '1Thess 5:23', nameAr: '١ تسالونيكي ٥:٢٣', lang: 'greek', sblgntBookId: 52 },
  { book: 60, ch: 5, vs: 7, name: '1Pet 5:7', nameAr: '١ بطرس ٥:٧', lang: 'greek', sblgntBookId: 60 },
  // 2 Aramaic
  { book: 15, ch: 5, vs: 8, name: 'Ezra 5:8', nameAr: 'عزرا ٥:٨', lang: 'aramaic', oshbFile: 'Ezra', oshbOsis: 'Ezra.5.8' },
  { book: 27, ch: 4, vs: 17, name: 'Dan 4:17', nameAr: 'دانيال ٤:١٧', lang: 'aramaic', oshbFile: 'Dan', oshbOsis: 'Dan.4.14' }
];

console.log('Auditing all 311 records across 20 verses against canonical sources...');

const allResults = [];
let countCorrect = 0;
let countError = 0;
let countUndecided = 0;

for (const v of targetVerses) {
  // Extract canonical source tokens
  let sourceTokens = null;
  if (v.oshbFile) {
    sourceTokens = extractOshbVerse(v.oshbFile, v.oshbOsis);
  } else if (v.sblgntBookId) {
    sourceTokens = extractSblgntVerse(v.sblgntBookId, v.ch, v.vs);
  }

  // Query all word_mappings for this verse
  const rawRows = query(`
    SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
           wm.morph_pos, wm.orig_morphology, wm.morph_gender, wm.morph_number, wm.morph_person,
           wm.morph_stem, wm.morph_mood, wm.orig_word_position, wm.verified_locator,
           (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role, ';') 
            FROM (SELECT strongs_id, link_role FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as components
    FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
    ORDER BY wm.ar_word_position ASC;
  `);

  const lines = rawRows.split('\n').filter(l => l.trim().length > 0);

  for (const line of lines) {
    const parts = line.split('|');
    const mappingId = parts[0];
    const arPos = parseInt(parts[1], 10);
    const arWord = parts[2];
    const strongsId = parts[3] || null;
    const origWord = parts[4] || null;
    const origSurface = parts[5] || null;
    const morphPos = parts[6] || null;
    const origMorph = parts[7] || null;
    const morphGender = parts[8] || null;
    const morphNumber = parts[9] || null;
    const morphPerson = parts[10] || null;
    const morphStem = parts[11] || null;
    const morphMood = parts[12] || null;
    const origPos = parts[13] ? parseInt(parts[13], 10) : null;
    const locator = parts[14] || null;
    const components = parts[15] || '';

    // Parse locator
    const locMatch = locator ? locator.match(/\.w(\d+)/) : null;
    const locWordIndex = locMatch ? parseInt(locMatch[1], 10) : null;

    // Check 4 axes
    const axisFindings = {
      lexical: { status: 'pass', note: '' },
      lemmaSurface: { status: 'pass', note: '' },
      morphology: { status: 'pass', note: '' },
      sourceLocator: { status: 'pass', note: '' }
    };

    const isSyntactic = morphPos === 'syntactic_ar' || locator?.startsWith('AR_SYNTACTIC');

    if (isSyntactic) {
      if (strongsId !== null) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = `Syntactic item has non-null Strongs: ${strongsId}`;
      }
      if (origWord !== '—' && origWord !== null && origWord !== '') {
        axisFindings.lemmaSurface.status = 'fail';
        axisFindings.lemmaSurface.note = `Syntactic item has orig_word: ${origWord}`;
      }
    } else {
      // 1. Lexical Axis
      if (!strongsId) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = 'Missing strongs_id for content word';
      }

      // 2. Source & Locator Axis
      if (!locator) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = 'Missing verified_locator';
      } else if (!locWordIndex) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = `Cannot parse word index from locator: ${locator}`;
      } else if (origPos !== null && origPos !== locWordIndex) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = `orig_word_position (${origPos}) != locator index (${locWordIndex})`;
      }

      // Check against source
      if (sourceTokens && locWordIndex) {
        const sourceToken = sourceTokens.find(t => t.index === locWordIndex);
        if (!sourceToken) {
          axisFindings.sourceLocator.status = 'fail';
          axisFindings.sourceLocator.note = `Locator index ${locWordIndex} exceeds source token count (${sourceTokens.length})`;
        } else {
          // Compare with source token
          if (v.oshbFile) {
            // OSHB Hebrew/Aramaic
            if (origMorph && sourceToken.morph && origMorph !== sourceToken.morph) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = `Morph mismatch: DB '${origMorph}' vs Source '${sourceToken.morph}' (id: ${sourceToken.id})`;
            }
          } else if (v.sblgntBookId) {
            // SBLGNT Greek
            if (origMorph && sourceToken.morph && origMorph !== sourceToken.morph) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = `Morph mismatch: DB '${origMorph}' vs SBLGNT '${sourceToken.morph}'`;
            }
            if (origWord && sourceToken.lemma && origWord !== sourceToken.lemma) {
              // Check lexical agreement
              axisFindings.lemmaSurface.status = 'fail';
              axisFindings.lemmaSurface.note = `Lemma mismatch: DB '${origWord}' vs SBLGNT '${sourceToken.lemma}'`;
            }
          }
        }
      }
    }

    // Determine overall status
    let overallStatus = 'صحيح';
    const hasFail = Object.values(axisFindings).some(a => a.status === 'fail');
    const hasUndecided = Object.values(axisFindings).some(a => a.status === 'undecided');

    if (hasFail) {
      overallStatus = 'خطأ';
      countError++;
    } else if (hasUndecided) {
      overallStatus = 'غير محسوم';
      countUndecided++;
    } else {
      countCorrect++;
    }

    allResults.push({
      verse: v.name,
      verseAr: v.nameAr,
      lang: v.lang,
      arPos,
      arWord,
      strongsId,
      components,
      origWord,
      origSurface,
      origMorph,
      origPos,
      locator,
      locWordIndex,
      isSyntactic,
      axisFindings,
      overallStatus
    });
  }
}

console.log(`\nAudit Completed on ${allResults.length} records:`);
console.log(`  صحيح: ${countCorrect}`);
console.log(`  خطأ: ${countError}`);
console.log(`  غير محسوم: ${countUndecided}`);

fs.writeFileSync(
  path.resolve(__dirname, 'batch_20_comprehensive_audit_311.json'),
  JSON.stringify({
    totalRecords: allResults.length,
    summary: { correct: countCorrect, error: countError, undecided: countUndecided },
    records: allResults
  }, null, 2),
  'utf8'
);
console.log('Saved detailed audit to scripts/batch_20_comprehensive_audit_311.json');
