/**
 * scripts/whole_verse_general_repair_engine.cjs
 *
 * Whole-Verse General Alignment & Morphology Suggestion/Repair Engine (v1.1)
 *
 * Rules derived STRICTLY from the 65 already-adjudicated verses (B20 + R1 + R2 + R3 = 1,053 records).
 * Zero rules or exceptions tailored to Round 4B or any unseen holdout sample.
 *
 * Architectural Guarantees (v1.1 Hardened):
 *   1. Read-only first (--mode propose); --mode apply requires --out-db (isolated copy, never mutates production DB).
 *   2. Independent Strong's & Lexicon Verification BEFORE granting AUTO_PROPOSED_HIGH_CONFIDENCE:
 *        - Loads `strongs_entries` independently from SQLite.
 *        - Greek: rejects stored strongs_id if its lexicon lemma contradicts SBLGNT tok.lemma (e.g. G1 != ὑπεράνω).
 *        - Hebrew/Aramaic: derives orig_word strictly from strongs_entries for OSHB strongsId, AND rejects to
 *          PENDING_REVIEW if stored orig_word has a conflicting consonantal root (e.g. בַּיִת vs הָיָה).
 *   3. Never re-derives morphology before locking a unique, lexically verified source token link.
 *   4. Strict Duplicate-Occurrence Guard: any token whose surface or lemma/Strong's occurs >1 time in the verse is
 *      STRICTLY demoted to PENDING_REVIEW with all competing occurrences listed in `alternatives`.
 *   5. Whole-Verse Reserved-Token & Bijectivity Guard:
 *        - Pre-registers ALL tokens reserved by preserved `compound_phrase` rows, preserved `morphgnt_tr` rows,
 *          and ALL secondary `word_mapping_strongs` components (`link_order > 1`) across the verse.
 *        - Any proposal targeting a reserved token or colliding with another proposal is STRICTLY demoted to PENDING_REVIEW.
 *   6. Outputs complete before/after diff JSONL when applying to an isolated DB copy.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const {
  loadAllSources,
  deriveCanonicalMorphFields,
  getBhsChapterVerse,
  OT_BOOK_MAP,
  TR_BOOK_OSIS_MAP
} = require('./full_66_books_audit_helpers.cjs');

const repoRoot = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const sqlitePath = isWin && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';

const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sqlVal = v => (v === null || v === undefined || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

function canonGreek(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,·;:'"«»\[\]()—\-]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .trim();
}

function canonSemiticConsonants(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[^\u05D0-\u05EA]/g, '')
    .trim();
}

function cleanTrSurface(s) {
  return String(s || '').replace(/[.,·;]+$/g, '').trim();
}

function extractOshbRootStrongs(tok) {
  if (!tok) return null;
  if (tok.strongsId) return tok.strongsId;
  const raw = String(tok.lemmaRaw || tok.lemma || '');
  const nums = raw.match(/\d{1,4}/g);
  if (!nums || nums.length === 0) return null;
  return `H${parseInt(nums[nums.length - 1], 10)}`;
}

function loadStrongsLexicon(dbPath) {
  const raw = execFileSync(sqlitePath, [dbPath], {
    input: 'SELECT strongs_id, COALESCE(original_word, \'\') FROM strongs_entries;',
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  }).replace(/\r/g, '').trim();
  const map = new Map();
  for (const line of raw.split('\n')) {
    if (!line) continue;
    const idx = line.indexOf('|');
    if (idx < 0) continue;
    map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return map;
}

function evaluateVerse(verseInfo, dbRows, sources, strongsLexicon = null) {
  const { book, ch, vs, lang, name } = verseInfo;
  const isGreek = lang === 'greek';

  let tokens = [];
  let edition = '';
  let morphSource = '';
  let locPrefix = '';

  if (isGreek) {
    const sbl = sources.sblByBook[book] ? sources.sblByBook[book].get(`${ch}:${vs}`) : null;
    const trOsis = TR_BOOK_OSIS_MAP[book];
    const tr = trOsis && sources.trByOsis ? sources.trByOsis.get(`${trOsis}:${ch}:${vs}`) : null;
    if (!sbl || !sbl.length) {
      return { verse: name, book, ch, vs, lang, skipped: 'NO_SBLGNT_SOURCE', proposals: [] };
    }
    tokens = sbl.map(t => ({
      index: t.index,
      surface: t.surfaceClean,
      surfaceCanon: canonGreek(t.surfaceClean),
      lemma: t.lemma,
      lemmaCanon: canonGreek(t.lemma),
      morph: t.morph,
      strongsId: null,
      isTr: false
    }));
    if (tr && tr.length) {
      const trBySurf = new Map();
      for (const tt of tr) {
        const sc = canonGreek(cleanTrSurface(tt.surface));
        if (!trBySurf.has(sc)) trBySurf.set(sc, []);
        trBySurf.get(sc).push(tt);
      }
      for (const t of tokens) {
        const hits = trBySurf.get(t.surfaceCanon) || [];
        if (hits.length === 1 && hits[0].strongsId && canonGreek(hits[0].lemma) === t.lemmaCanon) {
          t.trCrossStrongsId = hits[0].strongsId;
        }
      }
    }
    edition = 'SBLGNT';
    morphSource = 'morphgnt_sblgnt';
    locPrefix = `SBLGNT:B${book}.C${ch}.V${vs}`;
  } else {
    const bName = OT_BOOK_MAP[book];
    const [bhsCh, bhsVs] = getBhsChapterVerse(book, ch, vs);
    const osis = `${bName}.${bhsCh}.${bhsVs}`;
    const oshb = sources.oshbByBook[book] ? sources.oshbByBook[book].get(osis) : null;
    if (!oshb || !oshb.length) {
      return { verse: name, book, ch, vs, lang, skipped: `NO_OSHB_SOURCE:${osis}`, proposals: [] };
    }
    tokens = oshb.map(t => {
      const rootSid = extractOshbRootStrongs(t);
      const surf = t.text || t.surface || '';
      return {
        index: t.index,
        surface: surf,
        surfaceCanon: canonSemiticConsonants(surf),
        lemma: t.lemma || '',
        lemmaCanon: rootSid || '',
        morph: t.morph,
        strongsId: rootSid,
        isTr: false
      };
    });
    edition = 'OSHB';
    morphSource = 'oshb_wlc';
    locPrefix = `OSHB:B${book}.C${bhsCh}.V${bhsVs}`;
  }

  // Occurrence frequency tables across the ENTIRE verse (strict anti-collision guard)
  const surfFreq = new Map();
  const lexFreq = new Map();
  for (const t of tokens) {
    surfFreq.set(t.surfaceCanon, (surfFreq.get(t.surfaceCanon) || 0) + 1);
    if (t.lemmaCanon) lexFreq.set(t.lemmaCanon, (lexFreq.get(t.lemmaCanon) || 0) + 1);
  }

  // Pre-register ALL tokens reserved by preserved special rows (compound_phrase, morphgnt_tr)
  // AND all secondary word_mapping_strongs components (link_order > 1) across the verse!
  const reservedPrimaryByToken = new Map();   // tokenIndex -> array of arPos
  const reservedSecondaryByToken = new Map(); // tokenIndex -> array of arPos
  for (const r of dbRows) {
    const isCompound = r.relationType === 'compound_phrase';
    const isVerifiedTr = r.morphSource === 'morphgnt_tr' && r.verifiedLocator && r.verifiedLocator.startsWith('TR:') && r.origMorph;
    if ((isCompound || isVerifiedTr) && r.origPos !== null && r.origPos !== undefined) {
      if (!reservedPrimaryByToken.has(r.origPos)) reservedPrimaryByToken.set(r.origPos, []);
      reservedPrimaryByToken.get(r.origPos).push(r.arPos);
    }
    for (const secPos of (r.secondaryPositions || [])) {
      if (secPos !== null && secPos !== undefined) {
        if (!reservedSecondaryByToken.has(secPos)) reservedSecondaryByToken.set(secPos, []);
        reservedSecondaryByToken.get(secPos).push(r.arPos);
      }
    }
  }

  const rawProposals = [];
  const targetClaims = new Map(); // tokenIndex -> array of arPos

  for (const r of dbRows) {
    const current = {
      arPos: r.arPos,
      arWord: r.arWord,
      strongsId: r.strongsId || null,
      origWord: r.origWord || null,
      origSurface: r.origSurface || null,
      origPos: r.origPos,
      origMorph: r.origMorph || null,
      morphPos: r.morphPos || null,
      morphStem: r.morphStem || null,
      morphTense: r.morphTense || null,
      morphVoice: r.morphVoice || null,
      morphMood: r.morphMood || null,
      morphPerson: r.morphPerson || null,
      morphNumber: r.morphNumber || null,
      morphGender: r.morphGender || null,
      morphCase: r.morphCase || null,
      verifiedLocator: r.verifiedLocator || null,
      verifiedSource: r.verifiedSource || null,
      morphSource: r.morphSource || null,
      relationType: r.relationType || null
    };

    if (r.verifiedSource === 'syntactic_ar' || r.relationType === 'syntactic_ar' || r.relationType === 'compound_phrase') {
      rawProposals.push({
        id: r.id,
        arPos: r.arPos,
        arWord: r.arWord,
        status: 'PRESERVED_SPECIAL_RELATION',
        ruleId: r.relationType === 'compound_phrase' ? 'SKIP_COMPOUND_PHRASE' : 'SKIP_SYNTACTIC_AR',
        current,
        proposed: null,
        evidence: { note: 'Preserved special relation_type / syntactic_ar untouched; token reserved in conflict map.' },
        alternatives: []
      });
      continue;
    }

    if (r.morphSource === 'morphgnt_tr' && r.verifiedLocator && r.verifiedLocator.startsWith('TR:') && r.origMorph) {
      rawProposals.push({
        id: r.id,
        arPos: r.arPos,
        arWord: r.arWord,
        status: 'PRESERVED_VERIFIED_TR',
        ruleId: 'SKIP_VERIFIED_TR',
        current,
        proposed: null,
        evidence: { note: 'Preserved verified morphgnt_tr row untouched; token reserved in conflict map.' },
        alternatives: []
      });
      continue;
    }

    const rSurfCanon = isGreek ? canonGreek(r.origSurface) : canonSemiticConsonants(r.origSurface);
    const rLexCanon = isGreek ? canonGreek(r.origWord) : (r.strongsId || '');

    const surfMatches = rSurfCanon ? tokens.filter(t => t.surfaceCanon === rSurfCanon) : [];
    const lexMatches = rLexCanon ? tokens.filter(t => t.lemmaCanon === rLexCanon) : [];
    const bothMatches = surfMatches.filter(t => t.lemmaCanon === rLexCanon);

    const alternatives = Array.from(new Set([...bothMatches, ...surfMatches, ...lexMatches])).map(t => ({
      w: t.index,
      surface: t.surface,
      lemma: t.lemma,
      strongsId: t.strongsId || t.trCrossStrongsId || null,
      morph: t.morph,
      surfOccurrencesInVerse: surfFreq.get(t.surfaceCanon) || 0,
      lexOccurrencesInVerse: lexFreq.get(t.lemmaCanon) || 0
    }));

    let chosen = null;
    let ruleId = null;
    let rejectReason = null;

    if (bothMatches.length === 1) {
      const t = bothMatches[0];
      const sCount = surfFreq.get(t.surfaceCanon) || 0;
      const lCount = lexFreq.get(t.lemmaCanon) || 0;
      if (sCount > 1 || lCount > 1) {
        rejectReason = `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
      } else {
        chosen = t;
        ruleId = (r.origPos === t.index) ? 'RULE_G3_UNIQUE_LOCKED_DERIVED_MORPH' : 'RULE_G1_UNIQUE_BIJECTIVE_RELOC';
      }
    } else if (bothMatches.length > 1) {
      rejectReason = `REJECT_MULTIPLE_BOTH_MATCHES(count=${bothMatches.length})`;
    } else if (surfMatches.length === 1 && rSurfCanon.length >= 3) {
      const t = surfMatches[0];
      const sCount = surfFreq.get(t.surfaceCanon) || 0;
      const lCount = lexFreq.get(t.lemmaCanon) || 0;
      if (sCount === 1 && lCount === 1) {
        chosen = t;
        ruleId = 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK';
      } else {
        rejectReason = `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
      }
    } else if (lexMatches.length === 1 && !isGreek && r.strongsId && r.strongsId.startsWith('H')) {
      const t = lexMatches[0];
      const lCount = lexFreq.get(t.lemmaCanon) || 0;
      const sCount = surfFreq.get(t.surfaceCanon) || 0;
      if (lCount === 1 && sCount === 1) {
        chosen = t;
        ruleId = (r.origPos === t.index) ? 'RULE_G3_UNIQUE_LOCKED_DERIVED_MORPH' : 'RULE_G1B_UNIQUE_OSHB_ROOT_RELOC';
      } else {
        rejectReason = `REJECT_DUPLICATE_OCCURRENCE_IN_VERSE(surfCount=${sCount},lexCount=${lCount})`;
      }
    } else {
      rejectReason = `PENDING_NO_UNAMBIGUOUS_MATCH(both=${bothMatches.length},surf=${surfMatches.length},lex=${lexMatches.length})`;
    }

    if (!chosen) {
      rawProposals.push({
        id: r.id,
        arPos: r.arPos,
        arWord: r.arWord,
        status: 'PENDING_REVIEW',
        ruleId: rejectReason,
        current,
        proposed: null,
        evidence: { edition, tokenCount: tokens.length, reason: rejectReason },
        alternatives
      });
      continue;
    }

    // INDEPENDENT LEXICAL VERIFICATION OF BOTH strongs_id AND orig_word BEFORE HIGH-CONFIDENCE!
    let targetStrongs = null;
    let targetOrigWord = null;
    let lexReject = null;

    if (isGreek) {
      targetOrigWord = chosen.lemma;
      const candidateSid = (ruleId === 'RULE_G2_UNIQUE_INFLECTED_SURFACE_LOCK')
        ? (chosen.trCrossStrongsId || r.strongsId)
        : (r.strongsId || chosen.trCrossStrongsId);

      if (!candidateSid) {
        lexReject = 'REJECT_MISSING_GREEK_STRONGS';
      } else if (!strongsLexicon) {
        lexReject = 'REJECT_NO_STRONGS_LEXICON_LOADED';
      } else {
        const lexWord = strongsLexicon.get(candidateSid);
        if (!lexWord) {
          lexReject = `REJECT_UNKNOWN_STRONGS_ID(${candidateSid})`;
        } else if (canonGreek(lexWord) !== chosen.lemmaCanon) {
          lexReject = `REJECT_STORED_STRONGS_LEXICON_MISMATCH(${candidateSid}:${lexWord}!=${chosen.lemma})`;
        } else {
          targetStrongs = candidateSid;
        }
      }
    } else {
      targetStrongs = chosen.strongsId;
      if (!targetStrongs) {
        lexReject = 'REJECT_MISSING_OSHB_STRONGS';
      } else if (!strongsLexicon || !strongsLexicon.get(targetStrongs)) {
        lexReject = `REJECT_MISSING_LEXICON_LEMMA(${targetStrongs})`;
      } else {
        const lexLemma = strongsLexicon.get(targetStrongs);
        const storedCons = canonSemiticConsonants(r.origWord);
        const lexCons = canonSemiticConsonants(lexLemma);
        // Reject if stored orig_word has an explicitly conflicting consonantal root (e.g. בַּיִת vs הָיָה)
        if (storedCons.length >= 2 && lexCons.length >= 2 && storedCons !== lexCons) {
          lexReject = `REJECT_STORED_LEMMA_CONFLICTS_WITH_LEXICON(stored=${r.origWord},lexicon=${lexLemma},strongs=${targetStrongs})`;
        } else {
          targetOrigWord = lexLemma;
        }
      }
    }

    if (lexReject) {
      rawProposals.push({
        id: r.id,
        arPos: r.arPos,
        arWord: r.arWord,
        status: 'PENDING_REVIEW',
        ruleId: lexReject,
        current,
        proposed: null,
        evidence: {
          edition,
          tokenIndex: chosen.index,
          tokenSurface: chosen.surface,
          tokenLemma: chosen.lemma,
          reason: lexReject
        },
        alternatives
      });
      continue;
    }

    if (!targetClaims.has(chosen.index)) targetClaims.set(chosen.index, []);
    targetClaims.get(chosen.index).push(r.arPos);

    const d = deriveCanonicalMorphFields(lang, chosen.morph, false, {
      morphPos: r.morphPos,
      morphNumber: r.morphNumber
    });
    let finalMorphPos = (isGreek && chosen.morph.startsWith('N-')) ? 'noun' : d.morphPos;
    if (isGreek && chosen.morph.startsWith('RI') && (r.morphPos === 'pronoun' || targetStrongs === 'G5100')) {
      finalMorphPos = 'pronoun';
    }
    const targetLocator = `${locPrefix}.w${chosen.index}`;

    const proposed = {
      strongsId: targetStrongs,
      origWord: targetOrigWord,
      origSurface: chosen.surface,
      origPos: chosen.index,
      origMorph: chosen.morph,
      morphPos: finalMorphPos,
      morphStem: d.morphStem,
      morphTense: d.morphTense,
      morphVoice: d.morphVoice,
      morphMood: d.morphMood,
      morphPerson: d.morphPerson,
      morphNumber: d.morphNumber,
      morphGender: d.morphGender,
      morphCase: d.morphCase,
      verifiedLocator: targetLocator,
      verifiedSource: morphSource,
      morphSource: morphSource
    };

    const isAlreadyCanonical =
      current.strongsId === proposed.strongsId &&
      current.origWord === proposed.origWord &&
      current.origSurface === proposed.origSurface &&
      current.origPos === proposed.origPos &&
      current.origMorph === proposed.origMorph &&
      current.morphPos === proposed.morphPos &&
      current.morphStem === proposed.morphStem &&
      current.morphTense === proposed.morphTense &&
      current.morphVoice === proposed.morphVoice &&
      current.morphMood === proposed.morphMood &&
      current.morphPerson === proposed.morphPerson &&
      current.morphNumber === proposed.morphNumber &&
      current.morphGender === proposed.morphGender &&
      current.morphCase === proposed.morphCase &&
      current.verifiedLocator === proposed.verifiedLocator &&
      current.verifiedSource === proposed.verifiedSource &&
      current.morphSource === proposed.morphSource &&
      r.hasCleanPrimaryWms;

    rawProposals.push({
      id: r.id,
      arPos: r.arPos,
      arWord: r.arWord,
      status: isAlreadyCanonical ? 'ALREADY_CANONICAL' : 'AUTO_PROPOSED_HIGH_CONFIDENCE',
      ruleId: isAlreadyCanonical ? 'NO_CHANGE_ALREADY_CANONICAL' : ruleId,
      targetTokenIndex: chosen.index,
      current,
      proposed,
      evidence: {
        edition,
        tokenIndex: chosen.index,
        tokenSurface: chosen.surface,
        tokenLemma: chosen.lemma,
        tokenMorph: chosen.morph,
        verifiedLexiconLemma: strongsLexicon.get(targetStrongs),
        surfOccurrencesInVerse: surfFreq.get(chosen.surfaceCanon) || 0,
        lexOccurrencesInVerse: lexFreq.get(chosen.lemmaCanon) || 0
      },
      alternatives
    });
  }

  // Whole-verse reserved-token & bijectivity pass:
  // Demote ANY proposal colliding with reserved compound_phrase/TR primary tokens, secondary components, or peer claims!
  for (const p of rawProposals) {
    if (p.status === 'AUTO_PROPOSED_HIGH_CONFIDENCE' || p.status === 'ALREADY_CANONICAL') {
      const reservedPrim = reservedPrimaryByToken.get(p.targetTokenIndex) || [];
      if (reservedPrim.length > 0) {
        p.status = 'PENDING_REVIEW';
        p.ruleId = `CONFLICT_RESERVED_PRIMARY_TOKEN(w${p.targetTokenIndex},reservedBy=${reservedPrim.join(',')})`;
        p.proposed = null;
        p.evidence.reservedByPrimary = reservedPrim;
        continue;
      }
      const reservedSec = (reservedSecondaryByToken.get(p.targetTokenIndex) || []).filter(ap => ap !== p.arPos);
      if (reservedSec.length > 0) {
        p.status = 'PENDING_REVIEW';
        p.ruleId = `CONFLICT_RESERVED_SECONDARY_TOKEN(w${p.targetTokenIndex},reservedBy=${reservedSec.join(',')})`;
        p.proposed = null;
        p.evidence.reservedBySecondary = reservedSec;
        continue;
      }
      const claimers = targetClaims.get(p.targetTokenIndex) || [];
      if (claimers.length > 1) {
        p.status = 'PENDING_REVIEW';
        p.ruleId = `CONFLICT_SHARED_TARGET_TOKEN(w${p.targetTokenIndex},claimers=${claimers.join(',')})`;
        p.proposed = null;
        p.evidence.conflictClaimers = claimers;
      }
    }
  }

  return { verse: name, book, ch, vs, lang, edition, tokenCount: tokens.length, proposals: rawProposals };
}

function loadVerseRows(dbPath, book, ch, vs) {
  const raw = execFileSync(sqlitePath, [dbPath], {
    input: `
      SELECT json_object(
        'id', wm.id,
        'arPos', wm.ar_word_position,
        'arWord', wm.ar_word,
        'strongsId', wm.strongs_id,
        'origWord', wm.orig_word,
        'origSurface', wm.orig_surface,
        'origPos', wm.orig_word_position,
        'origMorph', wm.orig_morphology,
        'morphPos', wm.morph_pos,
        'morphStem', wm.morph_stem,
        'morphTense', wm.morph_tense,
        'morphVoice', wm.morph_voice,
        'morphMood', wm.morph_mood,
        'morphPerson', wm.morph_person,
        'morphNumber', wm.morph_number,
        'morphGender', wm.morph_gender,
        'morphCase', wm.morph_case,
        'verifiedLocator', wm.verified_locator,
        'verifiedSource', wm.verified_source,
        'morphSource', wm.morph_source,
        'relationType', wm.relation_type,
        'wmsCount', (SELECT COUNT(*) FROM word_mapping_strongs wms WHERE wms.mapping_id = wm.id),
        'secondaryPositions', COALESCE((
          SELECT json_group_array(wms.orig_word_position)
          FROM word_mapping_strongs wms
          WHERE wms.mapping_id = wm.id AND wms.link_order > 1 AND wms.orig_word_position IS NOT NULL
        ), '[]'),
        'hasCleanPrimaryWms', (
          SELECT COUNT(*) FROM word_mapping_strongs wms
          WHERE wms.mapping_id = wm.id AND wms.link_order = 1 AND wms.link_role = 'primary'
            AND wms.strongs_id = wm.strongs_id AND wms.orig_word_position = wm.orig_word_position
            AND wms.orig_morphology = wm.orig_morphology AND wms.morph_source = wm.morph_source
        )
      )
      FROM word_mappings wm
      JOIN verses vr ON wm.verse_id = vr.id
      WHERE vr.book_id = ${book} AND vr.chapter_num = ${ch} AND vr.verse_num = ${vs}
      ORDER BY wm.ar_word_position ASC;
    `,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  }).replace(/\r/g, '').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(l => {
    const obj = JSON.parse(l);
    obj.hasCleanPrimaryWms = obj.hasCleanPrimaryWms > 0;
    obj.secondaryPositions = typeof obj.secondaryPositions === 'string'
      ? JSON.parse(obj.secondaryPositions)
      : (obj.secondaryPositions || []);
    return obj;
  });
}

function applyProposalsToIsolatedDb(srcDbPath, outDbPath, verseResults, diffOutPath) {
  if (path.resolve(srcDbPath) === path.resolve(outDbPath)) {
    throw new Error('SAFETY ABORT: --out-db must be an isolated copy, NEVER the source/production DB!');
  }
  fs.mkdirSync(path.dirname(outDbPath), { recursive: true });
  fs.copyFileSync(srcDbPath, outDbPath);

  const sql = ['BEGIN TRANSACTION;'];
  const diffLines = [];

  for (const vr of verseResults) {
    for (const p of vr.proposals) {
      if (p.status !== 'AUTO_PROPOSED_HIGH_CONFIDENCE' || !p.proposed) continue;
      const pr = p.proposed;
      sql.push(`
        UPDATE word_mappings
        SET strongs_id = ${sqlVal(pr.strongsId)},
            orig_word = ${sqlVal(pr.origWord)},
            orig_surface = ${sqlVal(pr.origSurface)},
            orig_word_position = ${pr.origPos},
            orig_morphology = ${sqlVal(pr.origMorph)},
            morph_pos = ${sqlVal(pr.morphPos)},
            morph_stem = ${sqlVal(pr.morphStem)},
            morph_tense = ${sqlVal(pr.morphTense)},
            morph_voice = ${sqlVal(pr.morphVoice)},
            morph_mood = ${sqlVal(pr.morphMood)},
            morph_person = ${sqlVal(pr.morphPerson)},
            morph_number = ${sqlVal(pr.morphNumber)},
            morph_gender = ${sqlVal(pr.morphGender)},
            morph_case = ${sqlVal(pr.morphCase)},
            verified_locator = ${sqlVal(pr.verifiedLocator)},
            verified_source = ${sqlVal(pr.verifiedSource)},
            morph_source = ${sqlVal(pr.morphSource)}
        WHERE id = ${sqlVal(p.id)};
      `.trim());

      sql.push(`DELETE FROM word_mapping_strongs WHERE mapping_id = ${sqlVal(p.id)} AND link_order = 1;`);
      sql.push(`
        INSERT INTO word_mapping_strongs (mapping_id, strongs_id, link_order, link_role, orig_component, orig_word_position, orig_morphology, morph_source)
        VALUES (${sqlVal(p.id)}, ${sqlVal(pr.strongsId)}, 1, 'primary', ${sqlVal(pr.origSurface)}, ${pr.origPos}, ${sqlVal(pr.origMorph)}, ${sqlVal(pr.morphSource)});
      `.trim());

      diffLines.push(JSON.stringify({
        verse: vr.verse,
        lang: vr.lang,
        mappingId: p.id,
        arPos: p.arPos,
        arWord: p.arWord,
        ruleId: p.ruleId,
        before: p.current,
        after: pr,
        evidence: p.evidence
      }));
    }
  }

  sql.push('COMMIT;');
  const tmpSql = path.join(repoRoot, 'scratch/tmp_general_engine_apply.sql');
  fs.mkdirSync(path.dirname(tmpSql), { recursive: true });
  fs.writeFileSync(tmpSql, sql.join('\n') + '\n', 'utf8');

  execFileSync(sqlitePath, [outDbPath], { input: `.read ${tmpSql.replace(/\\/g, '/')}\n`, encoding: 'utf8' });
  const integrity = execFileSync(sqlitePath, [outDbPath], { input: 'PRAGMA integrity_check;', encoding: 'utf8' }).trim();
  if (integrity !== 'ok') throw new Error(`Isolated DB integrity_check failed: ${integrity}`);

  if (diffOutPath) {
    fs.mkdirSync(path.dirname(diffOutPath), { recursive: true });
    fs.writeFileSync(diffOutPath, diffLines.join('\n') + (diffLines.length ? '\n' : ''), 'utf8');
  }
  return { modifiedCount: diffLines.length, outDbSha256: sha256File(outDbPath) };
}

function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, def = null) => {
    const idx = args.indexOf(flag);
    return (idx >= 0 && idx + 1 < args.length) ? args[idx + 1] : def;
  };

  const mode = getArg('--mode', 'propose');
  const dbPath = path.resolve(repoRoot, getArg('--db', 'mobile/assets/bible_study.db'));
  const manifestArg = getArg('--manifest');
  const outProposals = getArg('--out-proposals');
  const outDb = getArg('--out-db');
  const outDiff = getArg('--out-diff');

  if (!manifestArg) {
    console.error('Usage: node scripts/whole_verse_general_repair_engine.cjs --mode <propose|apply> --manifest <manifest.json> [--out-proposals <out.json>] [--out-db <isolated.db>] [--out-diff <diff.jsonl>]');
    process.exit(1);
  }

  const manifestPath = path.resolve(repoRoot, manifestArg);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const verses = (manifest.holdout_verses || manifest.verses || []).map(v => ({
    book: v.book, ch: v.ch, vs: v.vs, lang: v.lang, name: v.name
  }));

  const sources = loadAllSources();
  const strongsLexicon = loadStrongsLexicon(dbPath);
  const verseResults = [];
  const counts = {
    totalRecords: 0,
    ALREADY_CANONICAL: 0,
    AUTO_PROPOSED_HIGH_CONFIDENCE: 0,
    PENDING_REVIEW: 0,
    PRESERVED_SPECIAL_RELATION: 0,
    PRESERVED_VERIFIED_TR: 0
  };
  const ruleCounts = {};

  for (const v of verses) {
    const rows = loadVerseRows(dbPath, v.book, v.ch, v.vs);
    const res = evaluateVerse(v, rows, sources, strongsLexicon);
    verseResults.push(res);
    for (const p of res.proposals) {
      counts.totalRecords++;
      counts[p.status] = (counts[p.status] || 0) + 1;
      ruleCounts[p.ruleId] = (ruleCounts[p.ruleId] || 0) + 1;
    }
  }

  const report = {
    engineVersion: 'whole_verse_general_repair_engine_v1.1',
    mode,
    sourceDbPath: path.relative(repoRoot, dbPath).replace(/\\/g, '/'),
    sourceDbSha256: sha256File(dbPath),
    manifestPath: path.relative(repoRoot, manifestPath).replace(/\\/g, '/'),
    manifestSha256: sha256File(manifestPath),
    summary: counts,
    ruleBreakdown: ruleCounts,
    verses: verseResults
  };

  if (mode === 'apply') {
    if (!outDb) throw new Error('--mode apply requires --out-db <isolated_db_path>');
    const outDbAbs = path.resolve(repoRoot, outDb);
    const diffAbs = outDiff ? path.resolve(repoRoot, outDiff) : null;
    const applyRes = applyProposalsToIsolatedDb(dbPath, outDbAbs, verseResults, diffAbs);
    report.applyResult = applyRes;
    console.log(`Applied ${applyRes.modifiedCount} high-confidence proposals to isolated DB: ${outDbAbs}`);
    console.log(`  Isolated DB SHA-256: ${applyRes.outDbSha256}`);
  }

  if (outProposals) {
    const outAbs = path.resolve(repoRoot, outProposals);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, JSON.stringify(report, null, 2) + '\n', 'utf8');
  }

  console.log('=== WHOLE-VERSE GENERAL REPAIR ENGINE SUMMARY ===');
  console.log(JSON.stringify({ summary: counts, ruleBreakdown: ruleCounts }, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { evaluateVerse, loadVerseRows, loadStrongsLexicon, applyProposalsToIsolatedDb };
