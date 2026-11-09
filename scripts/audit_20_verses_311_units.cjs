const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.resolve(__dirname, '../sqlite_dist/sqlite3.exe'))
  ? path.resolve(__dirname, '../sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const defaultDbPath = fs.existsSync(path.resolve(__dirname, '../mobile/assets/bible_study.db'))
  ? path.resolve(__dirname, '../mobile/assets/bible_study.db')
  : path.resolve(__dirname, '../bible_study.db');
const dbPath = process.env.AUDIT_DB_PATH || defaultDbPath;

function query(sql) {
  const tmpFile = path.resolve(__dirname, `temp_query_audit_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`);
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

// SBLGNT Text Parser
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

function extractSblgntVerse(bookId, ch, vs) {
  const fileName = sblgntBookMap[bookId];
  if (!fileName) return null;
  const filePath = path.join(sblgntDir, fileName);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const tokens = [];
  let idx = 1;

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;
    const tag = parts[0];
    const lineCh = parseInt(tag.substring(2, 4), 10);
    const lineVs = parseInt(tag.substring(4, 6), 10);
    if (lineCh === ch && lineVs === vs) {
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

function morphMatches(dbMorph, sourceMorph) {
  if (!dbMorph || !sourceMorph) return false;
  if (dbMorph === sourceMorph) return true;
  const normDb = dbMorph.replace(/^H/, '');
  const normSrc = sourceMorph.replace(/^H/, '');
  if (normDb === normSrc) return true;

  // Composite token match (e.g. HR against HR/Ncmsa, or Ncmsa against HR/Ncmsa)
  if (sourceMorph.includes('/')) {
    const parts = sourceMorph.split('/').map(p => p.replace(/^H/, ''));
    if (parts.includes(normDb)) return true;
  }
  return false;
}

// Helper: Match Strong's against OSHB lemma with part-of-speech integrity
function verifyHebrewStrongsAgainstLemma(strongsId, lemmaStr, morphStr, dbMorph) {
  if (!strongsId || !lemmaStr) return false;
  const numStr = strongsId.replace(/^[HG]/, '');

  // Preposition prefix H9005 (לְ): strictly requires preposition morphology on the mapped unit
  if (strongsId === 'H9005') {
    const isPrep = dbMorph === 'HR' || (dbMorph && dbMorph.startsWith('HR/')) || (dbMorph && dbMorph.startsWith('R'));
    const hasL = lemmaStr.split('/').includes('l') || lemmaStr === 'l';
    return isPrep && hasL;
  }
  // Conjunction prefix H9002 (וְ): strictly requires conjunction morphology
  if (strongsId === 'H9002') {
    const isConj = dbMorph === 'HC' || (dbMorph && dbMorph.startsWith('HC/')) || (dbMorph && dbMorph.startsWith('C'));
    const hasC = lemmaStr.split('/').includes('c') || lemmaStr === 'c';
    return isConj && hasC;
  }
  // Preposition prefix H9003 (בְּ): strictly requires preposition morphology
  if (strongsId === 'H9003') {
    const isPrep = dbMorph === 'HR' || (dbMorph && dbMorph.startsWith('HR/')) || (dbMorph && dbMorph.startsWith('R'));
    const hasB = lemmaStr.split('/').includes('b') || lemmaStr === 'b';
    return isPrep && hasB;
  }
  // Preposition prefix H9004 (כְּ): strictly requires preposition morphology
  if (strongsId === 'H9004') {
    const isPrep = dbMorph === 'HR' || (dbMorph && dbMorph.startsWith('HR/')) || (dbMorph && dbMorph.startsWith('R'));
    const hasK = lemmaStr.split('/').includes('k') || lemmaStr === 'k';
    return isPrep && hasK;
  }
  // Definite article H9009 (הַ): strictly requires article morphology
  if (strongsId === 'H9009') {
    const isArt = dbMorph === 'HTd' || (dbMorph && dbMorph.startsWith('HTd/')) || (dbMorph && dbMorph.startsWith('Td'));
    const hasD = lemmaStr.split('/').includes('d') || lemmaStr === 'd';
    return isArt && hasD;
  }

  // Preposition purity: standalone preposition (HR) cannot hold a noun Strong's number
  if (dbMorph === 'HR' && !['H9005', 'H9003', 'H9004', 'H413', 'H5921', 'H4480', 'H5973', 'H8478', 'H996', 'H310', 'H854', 'H5704'].includes(strongsId)) {
    return false;
  }

  // Content word matching (including H1980 / H3212 root equivalence)
  const parts = lemmaStr.split('/');
  for (const part of parts) {
    const cleanPart = part.replace(/\s+[a-z]$/, '').trim();
    if (cleanPart === numStr) return true;
    if ((numStr === '1980' && cleanPart === '3212') || (numStr === '3212' && cleanPart === '1980')) {
      return true;
    }
  }
  return false;
}

// Load canonical manifest directly
const manifestPath = process.env.AUDIT_MANIFEST_PATH || path.resolve(__dirname, 'batch_20_verses_manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`Cannot find manifest at ${manifestPath}`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const targetVerses = manifest.verses;

console.log(`Auditing all 20 verses (${manifest.records.length} records) directly from canonical manifest against database & sources...\n`);

const allResults = [];
let countCorrect = 0;
let countError = 0;
let countUndecided = 0;
let mismatchWithManifest = 0;

for (const v of targetVerses) {
  let sourceTokens = null;
  if (v.lang === 'hebrew' || v.lang === 'aramaic') {
    const oshbFile = v.source_file ? v.source_file.replace('.xml', '') : v.oshbFile;
    const oshbOsis = v.osis || v.oshbOsis;
    sourceTokens = extractOshbVerse(oshbFile, oshbOsis);
  } else if (v.lang === 'greek') {
    const sblgntId = v.sblgntBookId || v.book;
    sourceTokens = extractSblgntVerse(sblgntId, v.ch, v.vs);
  }

  const rawRows = query(`
    SELECT wm.id, wm.ar_word_position, wm.ar_word, wm.strongs_id, wm.orig_word, wm.orig_surface,
           wm.morph_pos, wm.orig_morphology, wm.morph_gender, wm.morph_number, wm.morph_person,
           wm.morph_stem, wm.morph_mood, wm.orig_word_position, wm.verified_locator,
           (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role, ';') 
            FROM (SELECT strongs_id, link_role FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as components,
           (SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || COALESCE(wms.orig_word_position, '') || '[' || COALESCE(wms.orig_component, '') || ':' || COALESCE(wms.orig_morphology, '') || ']', ';') 
            FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms) as components_detailed
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
    const componentsDetailed = parts[16] || '';

    // Manifest specification for this unit
    const manifestRec = manifest.records.find(r => r.verse === v.name && r.arPos === arPos);

    const locMatch = locator ? locator.match(/\.w(\d+)/) : null;
    const locWordIndex = locMatch ? parseInt(locMatch[1], 10) : null;

    const axisFindings = {
      lexical: { status: 'pass', note: '' },
      lemmaSurface: { status: 'pass', note: '' },
      morphology: { status: 'pass', note: '' },
      sourceLocator: { status: 'pass', note: '' }
    };

    // Check if manifest designates this unit as undecided / pending review
    if (manifestRec && manifestRec.overallStatus === 'غير محسوم') {
      axisFindings.lexical.status = 'undecided';
      axisFindings.lexical.note = manifestRec.axisFindings?.lexical?.note || 'Pending linguistic review';
    }

    const isSyntactic = morphPos === 'syntactic_ar' || locator?.startsWith('AR_SYNTACTIC');

    if (axisFindings.lexical.status === 'undecided') {
      // Undecided state preserved
    } else if (isSyntactic) {
      if (strongsId !== null) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = `Syntactic item has non-null Strongs: ${strongsId}`;
      }
      if (origWord !== '—' && origWord !== null && origWord !== '') {
        axisFindings.lemmaSurface.status = 'fail';
        axisFindings.lemmaSurface.note = `Syntactic item has orig_word: ${origWord}`;
      }
    } else {
      // 1. Lexical Axis: Strong's presence and accuracy against source lemma
      if (!strongsId) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = 'Missing strongs_id for content word';
      }

      // Check against manifest expected Strongs ID
      if (manifestRec && manifestRec.strongsId && strongsId !== manifestRec.strongsId) {
        axisFindings.lexical.status = 'fail';
        axisFindings.lexical.note = `Strongs ID mismatch: DB '${strongsId}' vs manifest '${manifestRec.strongsId}'`;
      }

      // Check multi-component integrity: reject missing or mismatched components, including position, surface form, and morphology
      if (manifestRec && manifestRec.components) {
        const normExpComp = manifestRec.components.trim().replace(/\r/g, '');
        if (normExpComp.includes('@w')) {
          const normDbDetailed = (componentsDetailed || '').trim().replace(/\r/g, '');
          if (normDbDetailed !== normExpComp) {
            axisFindings.lexical.status = 'fail';
            axisFindings.lexical.note = `Component detailed mismatch: DB has '${normDbDetailed}', expected '${normExpComp}'`;
          }
        } else {
          const normDbComp = (components || '').trim().replace(/\r/g, '');
          if (normDbComp !== normExpComp) {
            axisFindings.lexical.status = 'fail';
            axisFindings.lexical.note = `Components mismatch: DB has '${normDbComp}', expected '${normExpComp}'`;
          }
        }
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

      // Check against manifest expected locator
      if (manifestRec && manifestRec.locator && locator !== manifestRec.locator) {
        axisFindings.sourceLocator.status = 'fail';
        axisFindings.sourceLocator.note = `Locator mismatch: DB '${locator}' vs manifest '${manifestRec.locator}'`;
      }

      // 3. Morphology Axis: Check against manifest expected morphology
      if (manifestRec && manifestRec.origMorph && origMorph !== manifestRec.origMorph) {
        axisFindings.morphology.status = 'fail';
        axisFindings.morphology.note = `Orig morphology mismatch: DB '${origMorph}' vs manifest '${manifestRec.origMorph}'`;
      }

      // Source token checks
      if (sourceTokens && locWordIndex) {
        const sourceToken = sourceTokens.find(t => t.index === locWordIndex);
        if (!sourceToken) {
          axisFindings.sourceLocator.status = 'fail';
          axisFindings.sourceLocator.note = `Locator index ${locWordIndex} exceeds source token count (${sourceTokens.length})`;
        } else {
          if (v.lang === 'hebrew' || v.lang === 'aramaic') {
            // Check OSHB Morphology
            if (origMorph && sourceToken.morph && !morphMatches(origMorph, sourceToken.morph)) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = `Morph mismatch: DB '${origMorph}' vs Source '${sourceToken.morph}' (id: ${sourceToken.id})`;
            }
            // Check OSHB Lexical / Strongs accuracy
            if (strongsId && sourceToken.lemma) {
              const strongsOk = verifyHebrewStrongsAgainstLemma(strongsId, sourceToken.lemma, sourceToken.morph, origMorph);
              if (!strongsOk) {
                axisFindings.lexical.status = 'fail';
                axisFindings.lexical.note = `Strongs mismatch: DB '${strongsId}' does not correspond to source lemma '${sourceToken.lemma}'`;
              }
            }
          } else if (v.lang === 'greek') {
            // Check SBLGNT Morphology
            if (origMorph && sourceToken.morph && origMorph !== sourceToken.morph) {
              axisFindings.morphology.status = 'fail';
              axisFindings.morphology.note = `Morph mismatch: DB '${origMorph}' vs SBLGNT '${sourceToken.morph}'`;
            }
            // Check SBLGNT Lemma
            if (origWord && sourceToken.lemma && origWord !== sourceToken.lemma) {
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

    if (manifestRec && manifestRec.overallStatus !== overallStatus) {
      mismatchWithManifest++;
      console.warn(`[DIFF] ${v.name} pos ${arPos} (${arWord}): Audit computed '${overallStatus}', but manifest has '${manifestRec.overallStatus}' (Details: ${JSON.stringify(axisFindings)})`);
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

console.log(`\n========================================================================`);
console.log(`20-VERSE CANONICAL AUDIT SUMMARY (${allResults.length} Units Audited):`);
console.log(`  صحيح (Correct):        ${countCorrect}`);
console.log(`  خطأ (Error):           ${countError}`);
console.log(`  غير محسوم (Undecided): ${countUndecided}`);
console.log(`  نسبة الدقة الحالية:     ${((countCorrect / allResults.length) * 100).toFixed(2)}%`);
console.log(`========================================================================`);

if (mismatchWithManifest > 0) {
  console.error(`✗ Mismatch detected: ${mismatchWithManifest} units differed from canonical manifest.`);
  process.exit(1);
} else {
  console.log(`✓ 100% Deterministic Alignment: All ${allResults.length} units exactly match canonical manifest.`);
}

module.exports = {
  runAudit: () => ({ total: allResults.length, correct: countCorrect, error: countError, undecided: countUndecided }),
  allResults
};
