/**
 * alignment_suggestion_engine.cjs
 * Read-Only Full-Verse Alignment Suggestion Engine (Step 3 — Calibrated):
 *   - Reads ALL components from word_mapping_strongs alongside word_mappings.
 *   - Separates VERIFIED_CLEAN (all 4 axes pass) from KEEP_LINK_REPAIR_METADATA (link valid, metadata/morph dirty).
 *   - Requires independent lexical/function evidence for PROPOSED_REPAIR; order/current-ID-only stays PENDING_REVIEW.
 *   - Distinguishes Arabic shadda verbs (e.g. بَيَّنَ) from prepositions (بَيْنَ).
 *   - Records dbSha256, manifestPath, manifestSha256, exclusionKeysSha256, and version.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');

const repoRoot = path.resolve(__dirname, '..');
const sha256File = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sha256Str = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const sqlitePath = process.platform === 'win32' && fs.existsSync(path.join(repoRoot, 'sqlite_dist/sqlite3.exe'))
  ? path.join(repoRoot, 'sqlite_dist/sqlite3.exe')
  : 'sqlite3';
const dbPath = path.join(repoRoot, 'mobile/assets/bible_study.db');
const query = sql => execFileSync(sqlitePath, [dbPath], { input: sql, encoding: 'utf8' }).replace(/\r/g, '').trim();

const normAr = s => (s || '')
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .trim();

const normGk = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.,;··'’"()\[\]—\-]/g, '').trim();

function loadOshbVerse(bookName, osisRef) {
  const xml = fs.readFileSync(path.join(__dirname, 'data/oshb', `${bookName}.xml`), 'utf8');
  const m = xml.match(new RegExp(`<verse\\s+osisID="${osisRef}"[^>]*>([\\s\\S]*?)</verse>`));
  if (!m) return [];
  const out = [];
  const re = /<w\s+([^>]+)>([\s\S]*?)<\/w>/g;
  let w, idx = 1;
  while ((w = re.exec(m[1])) !== null) {
    const attrs = w[1];
    const rawLemma = (attrs.match(/lemma="([^"]+)"/) || [])[1] || '';
    const lemmaNums = rawLemma.split('/').map(p => p.replace(/[^0-9]/g, '')).filter(Boolean).map(n => `H${n}`);
    out.push({
      w: idx++,
      rawLemma,
      strongsCandidates: lemmaNums,
      morph: (attrs.match(/morph="([^"]+)"/) || [])[1] || '',
      surface: w[2].replace(/<[^>]+>/g, '').trim().replace(/\//g, '')
    });
  }
  return out;
}

const sblBookMap = { 41: '62-Mk-morphgnt.txt', 42: '63-Lk-morphgnt.txt', 45: '66-Ro-morphgnt.txt', 48: '69-Ga-morphgnt.txt', 49: '70-Eph-morphgnt.txt', 50: '71-Php-morphgnt.txt', 52: '73-1Th-morphgnt.txt', 60: '81-1Pe-morphgnt.txt' };
const trBookMap = { 41: 'Mark', 42: 'Luke', 45: 'Rom', 48: 'Gal', 49: 'Eph', 50: 'Phil', 52: '1Thess', 60: '1Pet' };

function loadSblgntVerse(book, ch, vs) {
  const fn = sblBookMap[book];
  if (!fn) return [];
  const lines = fs.readFileSync(path.join(__dirname, 'data/sblgnt', fn), 'utf8').split('\n');
  const out = [];
  let idx = 1;
  for (const line of lines) {
    const p = line.trim().split(/\s+/);
    if (p.length < 7) continue;
    if (parseInt(p[0].substring(2, 4), 10) === ch && parseInt(p[0].substring(4, 6), 10) === vs) {
      out.push({ w: idx++, morph: `${p[1]} ${p[2]}`, surface: p[4], lemma: p[6] });
    }
  }
  return out;
}

const trFullPath = path.join(__dirname, 'data/gnt_scrivener.json');
const scrFull = fs.existsSync(trFullPath) ? JSON.parse(fs.readFileSync(trFullPath, 'utf8')) : [];
function loadTrVerse(book, ch, vs) {
  const osis = trBookMap[book];
  const row = scrFull.find(x => x.book_name_osis === osis && x.chapter === ch && x.verse === vs);
  return row ? row.words.map((w, i) => ({
    w: i + 1, surface: w.greek, grammar: w.grammar,
    strongsId: w.strong ? `G${w.strong}` : null, lemma: w.dictionary_form || ''
  })) : [];
}

const lexicon = new Map();
const gkLemmaToStrongs = new Map();
for (const row of query("SELECT strongs_id||'|'||COALESCE(original_word,'')||'|'||COALESCE(kjv_usage,'') FROM strongs_entries;").split('\n')) {
  if (!row) continue;
  const [sid, orig, kjv] = row.split('|');
  lexicon.set(sid, { orig, kjv });
  if (sid.startsWith('G') && orig) {
    const k = normGk(orig);
    if (!gkLemmaToStrongs.has(k)) gkLemmaToStrongs.set(k, sid);
  }
}

// Closed Arabic function-word -> expected POS / Strong's evidence
const AR_ANCHORS = {
  'في': { pos: ['preposition'], strongs: ['H9003', 'G1722'] },
  'من': { pos: ['preposition'], strongs: ['H4480', 'G1537', 'G575'] },
  'الي': { pos: ['preposition'], strongs: ['H413', 'G1519', 'G4314'] },
  'علي': { pos: ['preposition'], strongs: ['H5921', 'G1909'] },
  'عن': { pos: ['preposition'], strongs: ['G5228', 'G4012', 'H4480'] },
  'مع': { pos: ['preposition'], strongs: ['H5973', 'G3326', 'G4862'] },
  'بين': { pos: ['preposition'], strongs: ['H996', 'G3342'] },
  'لدي': { pos: ['preposition'], strongs: ['H6924', 'H9005'] },
  'حتي': { pos: ['preposition', 'conjunction'], strongs: ['H5704', 'G2193'] },
  'لا': { pos: ['particle'], strongs: ['H3808', 'H408', 'G3756', 'G3361'] },
  'لم': { pos: ['particle'], strongs: ['H3808', 'G3756'] },
  'الذي': { pos: ['particle', 'pronoun', 'article'], strongs: ['H834', 'H1768', 'G3739', 'G3588'] },
  'التي': { pos: ['particle', 'pronoun', 'article'], strongs: ['H834', 'H1768', 'G3739', 'G3588'] },
  'الذين': { pos: ['particle', 'pronoun', 'article'], strongs: ['H834', 'H1768', 'G3739', 'G3588'] },
  'كل': { pos: ['noun', 'adjective'], strongs: ['H3605', 'H3606', 'G3956'] },
  'الله': { pos: ['noun'], strongs: ['H430', 'H426', 'G2316'] },
  'الرب': { pos: ['noun', 'proper_noun'], strongs: ['H3068', 'H4756', 'G2962'] },
  'ملك': { pos: ['noun'], strongs: ['H4428', 'H4430', 'G935'] },
  'المسيح': { pos: ['proper_noun', 'noun'], strongs: ['G5547'] },
  'ملاك': { pos: ['noun'], strongs: ['H4397', 'H4398', 'G32'] },
  'ملاكه': { pos: ['noun'], strongs: ['H4397', 'H4398', 'G32'] },
  'نار': { pos: ['noun'], strongs: ['H784', 'G4442'] },
  'النار': { pos: ['noun'], strongs: ['H784', 'G4442'] }
};

function classifyArWord(arRaw) {
  const ar = normAr(arRaw);
  const hasShaddaOnYa = /ي\u0651/.test(arRaw || ''); // distinguishes بَيَّنَ (verb) from بَيْنَ (preposition)
  const hasConjPrefix = /^[وف]/.test(ar) && ar.length > 3;
  const hasPrepPrefix = /^[بلك]/.test(ar) && ar.length > 3;
  const hasPronSuffix = /(هم|هما|هن|كم|كما|كن|نا|ها|ه|ي)$/.test(ar) && ar.length > 4;
  const pureSyntacticParticles = new Set(['قد', 'كان', 'كانت', 'يكون', 'هو', 'هي', 'هم', 'انه', 'ليس']);
  const anchor = (ar === 'بين' && hasShaddaOnYa) ? null : (AR_ANCHORS[ar] || null);
  return {
    ar, hasShaddaOnYa, hasConjPrefix, hasPrepPrefix, hasPronSuffix,
    isPureSyntacticCandidate: pureSyntacticParticles.has(ar),
    anchor
  };
}

function oshbTokenPos(morph) {
  const core = (morph || '').split('/').pop().replace(/^[HA]/, '');
  if (core.startsWith('V')) return 'verb';
  if (core.startsWith('Np')) return 'proper_noun';
  if (core.startsWith('N')) return 'noun';
  if (core.startsWith('A')) return 'adjective';
  if (core.startsWith('R')) return 'preposition';
  if (core.startsWith('C')) return 'conjunction';
  if (core.startsWith('P')) return 'pronoun';
  if (core.startsWith('D')) return 'adverb';
  if (core.startsWith('T')) return 'particle';
  return 'other';
}

function sblTokenPos(morph) {
  const c = (morph || '').slice(0, 2);
  if (c === 'V-') return 'verb';
  if (c === 'N-') return 'noun';
  if (c === 'A-') return 'adjective';
  if (c === 'P-') return 'preposition';
  if (c === 'C-') return 'conjunction';
  if (c === 'D-') return 'adverb';
  if (c === 'RA') return 'article';
  if (c.startsWith('R')) return 'pronoun';
  return 'particle';
}

// Note: does NOT use unverified current DB position/strongs to boost score!
function scoreCandidateIndependent(arInfo, arIdx, totalAr, tok, totalTok, lang) {
  const reasons = [];
  const tokPos = lang === 'greek' ? sblTokenPos(tok.morph || '') : oshbTokenPos(tok.morph || '');
  const candStrongs = lang === 'greek'
    ? (tok.strongsId || gkLemmaToStrongs.get(normGk(tok.lemma)) || null)
    : (tok.strongsCandidates[tok.strongsCandidates.length - 1] || null);

  const relDist = Math.abs((arIdx / Math.max(1, totalAr)) - (tok.w / Math.max(1, totalTok)));
  const posOrderScore = Math.max(0, 2.0 - relDist * 3.0);
  let lexScore = 0;

  if (arInfo.anchor) {
    if (candStrongs && arInfo.anchor.strongs.includes(candStrongs)) {
      lexScore += 6.0;
      reasons.push(`lexical_anchor=${candStrongs}`);
    }
    if (arInfo.anchor.pos.includes(tokPos)) {
      lexScore += 2.0;
      reasons.push(`anchor_pos=${tokPos}`);
    }
  }
  if (arInfo.hasShaddaOnYa && tokPos === 'verb') {
    lexScore += 1.5;
    reasons.push('shadda_verb_compat');
  }
  if (arInfo.hasPrepPrefix && tok.morph && /^(HR|AR|R)\//.test(tok.morph.replace(/^[HC|AC|C]+\//, ''))) {
    lexScore += 1.5;
    reasons.push('proclitic_prep_match');
  }
  if (arInfo.hasPronSuffix && tok.morph && /\/Sp/.test(tok.morph)) {
    lexScore += 1.5;
    reasons.push('suffix_pron_match');
  }

  reasons.push(`order=${posOrderScore.toFixed(2)}`);
  return {
    w: tok.w,
    strongsId: candStrongs,
    tokPos,
    morph: tok.morph || tok.grammar,
    surface: tok.surface,
    hasIndependentLexicalEvidence: lexScore >= 6.0,
    score: Number((posOrderScore + lexScore).toFixed(2)),
    reasons
  };
}

const mArgIdx = process.argv.indexOf('--manifest');
const manifestPath = (mArgIdx !== -1 && process.argv[mArgIdx + 1])
  ? path.resolve(process.cwd(), process.argv[mArgIdx + 1])
  : path.join(__dirname, 'unseen_holdout_round2_15_verses_manifest.json');
const outIdx = process.argv.indexOf('--out');
const outPath = (outIdx !== -1 && process.argv[outIdx + 1])
  ? path.resolve(process.cwd(), process.argv[outIdx + 1])
  : path.join(__dirname, 'round2_alignment_proposals.json');
const strictAuditPath = path.join(__dirname, 'unseen_holdout_round2_4axis_v379_strict_locator.json');
const fixedAuditPath = path.join(__dirname, 'unseen_holdout_round2_4axis_v379_locator_and_axes_fixed.json');
const auditLookup = new Map();
const auditSrcPath = fs.existsSync(fixedAuditPath) ? fixedAuditPath : strictAuditPath;
if (fs.existsSync(auditSrcPath)) {
  const auditJson = JSON.parse(fs.readFileSync(auditSrcPath, 'utf8'));
  for (const a of (auditJson.alerts || [])) {
    auditLookup.set(`${a.verse}#${a.pos}`, a.axes);
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const dbSha256 = sha256File(dbPath);
const manifestSha256 = sha256File(manifestPath);
const exclusionKeysSha256 = sha256Str((manifest.excluded_verse_keys || []).join('\n') + '\n');
const dartDbVerMatch = fs.readFileSync(path.join(repoRoot, 'mobile/lib/core/services/database_service.dart'), 'utf8').match(/const\s+targetDbVersion\s*=\s*(\d+);/);
const version = dartDbVerMatch ? `v1.0.${dartDbVerMatch[1]}` : 'v1.0.379';

const totals = {
  totalUnits: 0,
  verifiedClean: 0,
  keepLinkRepairMetadata: 0,
  proposedRepair: 0,
  pendingReview: 0
};
const verseProposals = [];

for (const v of manifest.holdout_verses) {
  const srcTokens = v.lang === 'greek' ? loadSblgntVerse(v.book, v.ch, v.vs) : loadOshbVerse(v.oshbBook, v.oshbOsis);
  const trTokens = v.lang === 'greek' ? loadTrVerse(v.book, v.ch, v.vs) : [];
  const rows = query(`
    SELECT wm.ar_word_position, wm.ar_word, COALESCE(wm.strongs_id,''), wm.orig_word_position,
           COALESCE(wm.orig_morphology,''), COALESCE(wm.morph_pos,''), COALESCE(wm.morph_source,''),
           COALESCE(wm.verified_locator,''), COALESCE(wm.relation_type,''), COALESCE(wm.grammar_notes,''),
           COALESCE((SELECT GROUP_CONCAT(wms.strongs_id || ':' || wms.link_role || '@w' || COALESCE(wms.orig_word_position,'') || '[' || COALESCE(wms.orig_component,'') || ':' || COALESCE(wms.orig_morphology,'') || ':' || COALESCE(wms.morph_source,'') || ']', ';')
                     FROM (SELECT strongs_id, link_role, orig_word_position, orig_component, orig_morphology, morph_source
                           FROM word_mapping_strongs WHERE mapping_id = wm.id ORDER BY link_order ASC) AS wms), '')
    FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
    ORDER BY wm.ar_word_position ASC;
  `).split('\n').filter(Boolean);

  const units = [];
  const prevClaimed = new Map();
  for (const r of rows) {
    const [posStr, arWord, strongsId, origPosStr, origMorph, morphPos, morphSource, locator, relType, notes, compRaw] = r.split('|');
    const arPos = parseInt(posStr, 10);
    const origPos = parseInt(origPosStr, 10);
    const isSyntactic = morphPos === 'syntactic_ar' || locator.startsWith('AR_SYNTACTIC');
    const isTr = v.lang === 'greek' && (locator.startsWith('TR:') || morphSource === 'morphgnt_tr');
    const activeTokens = isTr ? trTokens : srcTokens;
    const locRes = validateCanonicalLocator({
      locator, isSyntactic, lang: v.lang, book: v.book, ch: v.ch, vs: v.vs, oshbOsis: v.oshbOsis,
      arPos, origPos, morphSource, tokenCount: activeTokens.length
    });
    const components = compRaw ? compRaw.split(';').filter(Boolean) : [];
    const unitAxesAlerts = auditLookup.get(`${v.name}#${arPos}`) || null;
    const isAll4Clean = unitAxesAlerts === null;
    const hasLexOrLocAlert = unitAxesAlerts
      ? ((unitAxesAlerts.lexical && unitAxesAlerts.lexical.length > 0) || (unitAxesAlerts.sourceLocator && unitAxesAlerts.sourceLocator.length > 0))
      : false;

    const arInfo = classifyArWord(arWord);
    const scored = activeTokens.map(t => scoreCandidateIndependent(arInfo, arPos, rows.length, t, activeTokens.length, v.lang))
      .sort((a, b) => b.score - a.score);
    const top1 = scored[0] || null;
    const top2 = scored[1] || null;
    const margin = (top1 && top2) ? Number((top1.score - top2.score).toFixed(2)) : (top1 ? top1.score : 0);

    let status = 'PENDING_REVIEW';
    let proposalType = 'ambiguous_needs_review';
    let proposed = null;

    if (isAll4Clean && locRes.ok) {
      status = 'VERIFIED_CLEAN';
      proposalType = 'verified_clean';
      proposed = { w: origPos, strongsId: strongsId || null, locator, components };
      totals.verifiedClean++;
    } else if (!hasLexOrLocAlert && locRes.ok && strongsId && components.length > 0) {
      status = 'KEEP_LINK_REPAIR_METADATA';
      proposalType = 'keep_link_rederive_metadata';
      proposed = { w: origPos, strongsId, locator, components, existingAlerts: unitAxesAlerts };
      totals.keepLinkRepairMetadata++;
    } else if (arInfo.isPureSyntacticCandidate && (!top1 || !top1.hasIndependentLexicalEvidence)) {
      status = 'PROPOSED_REPAIR';
      proposalType = 'AR_SYNTACTIC';
      proposed = { locator: `AR_SYNTACTIC:B${v.book}.C${v.ch}.V${v.vs}.w${arPos}`, strongsId: null };
      totals.proposedRepair++;
    } else if (top1 && top1.hasIndependentLexicalEvidence && margin >= 1.5) {
      const editionPrefix = v.lang === 'greek' ? (isTr ? 'TR' : 'SBLGNT') : 'OSHB';
      const osisMatch = v.oshbOsis ? v.oshbOsis.match(/\.(\d+)\.(\d+)$/) : null;
      const locC = (v.lang !== 'greek' && osisMatch) ? parseInt(osisMatch[1], 10) : v.ch;
      const locV = (v.lang !== 'greek' && osisMatch) ? parseInt(osisMatch[2], 10) : v.vs;
      const candLocator = `${editionPrefix}:B${v.book}.C${locC}.V${locV}.w${top1.w}`;
      const isSharedAdjacent = prevClaimed.has(top1.w) && prevClaimed.get(top1.w) === arPos - 1;
      if (!prevClaimed.has(top1.w) || isSharedAdjacent) {
        status = 'PROPOSED_REPAIR';
        proposalType = isSharedAdjacent ? 'shared_compound_phrase' : 'lexical_anchor_realign';
        proposed = {
          w: top1.w, strongsId: top1.strongsId, locator: candLocator,
          relationType: isSharedAdjacent ? 'compound_phrase' : null,
          score: top1.score, margin
        };
        prevClaimed.set(top1.w, arPos);
        totals.proposedRepair++;
      } else {
        totals.pendingReview++;
      }
    } else {
      totals.pendingReview++;
    }

    totals.totalUnits++;
    units.push({
      arPos, arWord,
      current: { strongsId: strongsId || null, origPos, locator, morphSource, relationType: relType || null, components },
      existingAlerts: unitAxesAlerts,
      status, proposalType, proposed,
      topCandidates: scored.slice(0, 3)
    });
  }

  const vSummary = {
    verifiedClean: units.filter(u => u.status === 'VERIFIED_CLEAN').length,
    keepLinkRepairMetadata: units.filter(u => u.status === 'KEEP_LINK_REPAIR_METADATA').length,
    proposedRepair: units.filter(u => u.status === 'PROPOSED_REPAIR').length,
    pendingReview: units.filter(u => u.status === 'PENDING_REVIEW').length
  };
  verseProposals.push({ verse: v.name, lang: v.lang, summary: vSummary, units });
  console.log(`  ${v.name.padEnd(11)} [${v.lang.padEnd(7)}]: clean=${String(vSummary.verifiedClean).padStart(2)}, keep_link_fix_meta=${String(vSummary.keepLinkRepairMetadata).padStart(2)}, proposed=${String(vSummary.proposedRepair).padStart(2)}, pending=${String(vSummary.pendingReview).padStart(2)}`);
}

console.log('\n--- ALIGNMENT ENGINE SUMMARY (CALIBRATED) ---');
console.log(`  Total Units               : ${totals.totalUnits}`);
console.log(`  VERIFIED_CLEAN            : ${totals.verifiedClean}`);
console.log(`  KEEP_LINK_REPAIR_METADATA : ${totals.keepLinkRepairMetadata}`);
console.log(`  PROPOSED_REPAIR           : ${totals.proposedRepair}`);
console.log(`  PENDING_REVIEW            : ${totals.pendingReview}`);

const output = {
  version,
  dbSha256,
  manifestPath: path.relative(repoRoot, manifestPath).replace(/\\/g, '/'),
  manifestSha256,
  exclusionKeysSha256,
  note: 'Preliminary alignment proposals; scores are heuristic rankings, NOT calibrated correctness probabilities.',
  totals,
  verses: verseProposals
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`Written calibrated proposal report: ${outPath}`);
