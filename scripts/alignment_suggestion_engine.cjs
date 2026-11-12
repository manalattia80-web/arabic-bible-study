/**
 * alignment_suggestion_engine.cjs
 * Read-Only Full-Verse Alignment Suggestion Engine (Step 3):
 * Uses lexical Strong's anchors, OSHB/MorphGNT/TR morphology, monotonic verse context,
 * multi-component (primary + secondary), shared-link (compound_phrase), and AR_SYNTACTIC
 * heuristics to propose repairs across full verses while leaving ambiguous cases PENDING_REVIEW.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');
const { parseRobinsonGrammar } = require('./robinson_tr_helper.cjs');

const repoRoot = path.resolve(__dirname, '..');
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

// Strong's lexicon index
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

function classifyArWord(arRaw) {
  const ar = normAr(arRaw);
  const hasConjPrefix = /^[وف]/.test(ar) && ar.length > 3;
  const hasPrepPrefix = /^[بلك]/.test(ar) && ar.length > 3;
  const hasPronSuffix = /(هم|هما|هن|كم|كما|كن|نا|ها|ه|ي)$/.test(ar) && ar.length > 4;
  const pureSyntacticParticles = new Set(['قد', 'كان', 'كانت', 'يكون', 'هو', 'هي', 'هم', 'ان', 'انه', 'ليس']);
  const preps = new Set(['في', 'من', 'الي', 'علي', 'عن', 'مع', 'عند', 'بين', 'لدي', 'حتي']);
  const conjs = new Set(['و', 'ف', 'ثم', 'او', 'بل', 'لكن', 'ان', 'لئلا', 'لكي']);
  const negs = new Set(['لا', 'لم', 'لن', 'ما', 'ليس']);
  return {
    ar, hasConjPrefix, hasPrepPrefix, hasPronSuffix,
    isPureSyntacticCandidate: pureSyntacticParticles.has(ar),
    isPrepWord: preps.has(ar),
    isConjWord: conjs.has(ar),
    isNegWord: negs.has(ar)
  };
}

function oshbTokenPos(morph) {
  const core = (morph || '').split('/').pop().replace(/^[HA]/, '');
  if (core.startsWith('V')) return 'verb';
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

function scorePair(arInfo, arIdx, totalAr, tok, totalTok, lang, curOrigPos, curStrongs) {
  let score = 0;
  const reasons = [];
  const tokPos = lang === 'greek' ? sblTokenPos(tok.morph || '') : oshbTokenPos(tok.morph || '');

  // Relative monotonic order bonus
  const relDist = Math.abs((arIdx / Math.max(1, totalAr)) - (tok.w / Math.max(1, totalTok)));
  const posOrderScore = Math.max(0, 3.0 - relDist * 4.0);
  score += posOrderScore;
  reasons.push(`order=${posOrderScore.toFixed(2)}`);

  // Current DB pointer continuity bonus (when lexical matches)
  if (curOrigPos === tok.w) {
    score += 1.5;
    reasons.push('keeps_w');
  }
  const candStrongs = lang === 'greek'
    ? (tok.strongsId || gkLemmaToStrongs.get(normGk(tok.lemma)) || null)
    : (tok.strongsCandidates[tok.strongsCandidates.length - 1] || null);
  if (curStrongs && candStrongs && curStrongs === candStrongs) {
    score += 2.5;
    reasons.push(`strongs_match=${candStrongs}`);
  }

  // Grammatical POS compatibility
  if (arInfo.isPrepWord && tokPos === 'preposition') { score += 3.0; reasons.push('pos=prep'); }
  if (arInfo.isConjWord && tokPos === 'conjunction') { score += 3.0; reasons.push('pos=conj'); }
  if (arInfo.isNegWord && tokPos === 'particle') { score += 2.5; reasons.push('pos=neg_part'); }
  if (!arInfo.isPrepWord && !arInfo.isConjWord && (tokPos === 'verb' || tokPos === 'noun' || tokPos === 'adjective')) {
    score += 1.0;
    reasons.push(`content=${tokPos}`);
  }
  if (arInfo.hasPrepPrefix && !arInfo.isPrepWord && tok.morph && /^(HR|AR|R)\//.test(tok.morph.replace(/^[HC|AC|C]+\//, ''))) {
    score += 1.5;
    reasons.push('proclitic_prep_match');
  }
  if (arInfo.hasPronSuffix && tok.morph && /\/Sp/.test(tok.morph)) {
    score += 1.5;
    reasons.push('suffix_pron_match');
  }

  return { w: tok.w, strongsId: candStrongs, tokPos, morph: tok.morph || tok.grammar, surface: tok.surface, score: Number(score.toFixed(2)), reasons };
}

const mArgIdx = process.argv.indexOf('--manifest');
const manifestPath = (mArgIdx !== -1 && process.argv[mArgIdx + 1])
  ? path.resolve(process.cwd(), process.argv[mArgIdx + 1])
  : path.join(__dirname, 'unseen_holdout_round2_15_verses_manifest.json');
const outIdx = process.argv.indexOf('--out');
const outPath = (outIdx !== -1 && process.argv[outIdx + 1])
  ? path.resolve(process.cwd(), process.argv[outIdx + 1])
  : path.join(repoRoot, 'scratch/round2_alignment_proposals.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const totals = { totalUnits: 0, confidentKeep: 0, proposedRepair: 0, pendingReview: 0 };
const verseProposals = [];

for (const v of manifest.holdout_verses) {
  const srcTokens = v.lang === 'greek' ? loadSblgntVerse(v.book, v.ch, v.vs) : loadOshbVerse(v.oshbBook, v.oshbOsis);
  const trTokens = v.lang === 'greek' ? loadTrVerse(v.book, v.ch, v.vs) : [];
  const rows = query(`
    SELECT wm.ar_word_position, wm.ar_word, COALESCE(wm.strongs_id,''), wm.orig_word_position,
           COALESCE(wm.orig_morphology,''), COALESCE(wm.morph_pos,''), COALESCE(wm.morph_source,''),
           COALESCE(wm.verified_locator,''), COALESCE(wm.relation_type,''), COALESCE(wm.grammar_notes,'')
    FROM word_mappings wm
    JOIN verses vr ON wm.verse_id = vr.id
    WHERE vr.book_id = ${v.book} AND vr.chapter_num = ${v.ch} AND vr.verse_num = ${v.vs}
    ORDER BY wm.ar_word_position ASC;
  `).split('\n').filter(Boolean);

  const units = [];
  const prevClaimed = new Map();
  for (const r of rows) {
    const [posStr, arWord, strongsId, origPosStr, origMorph, morphPos, morphSource, locator, relType, notes] = r.split('|');
    const arPos = parseInt(posStr, 10);
    const origPos = parseInt(origPosStr, 10);
    const isSyntactic = morphPos === 'syntactic_ar' || locator.startsWith('AR_SYNTACTIC');
    const isTr = v.lang === 'greek' && (locator.startsWith('TR:') || morphSource === 'morphgnt_tr');
    const activeTokens = isTr ? trTokens : srcTokens;
    const locRes = validateCanonicalLocator({
      locator, isSyntactic, lang: v.lang, book: v.book, ch: v.ch, vs: v.vs, oshbOsis: v.oshbOsis,
      arPos, origPos, morphSource, tokenCount: activeTokens.length
    });

    const arInfo = classifyArWord(arWord);
    const scored = activeTokens.map(t => scorePair(arInfo, arPos, rows.length, t, activeTokens.length, v.lang, origPos, strongsId))
      .sort((a, b) => b.score - a.score);
    const top1 = scored[0] || null;
    const top2 = scored[1] || null;
    const margin = (top1 && top2) ? Number((top1.score - top2.score).toFixed(2)) : (top1 ? top1.score : 0);

    let status = 'PENDING_REVIEW';
    let proposalType = 'ambiguous_needs_review';
    let proposed = null;

    if (locRes.ok && morphSource !== 'strongs_lexicon' && strongsId && top1 && top1.w === origPos && top1.strongsId === strongsId) {
      status = 'CONFIDENT_KEEP';
      proposalType = 'keep_existing';
      proposed = { w: origPos, strongsId, locator };
      totals.confidentKeep++;
    } else if (arInfo.isPureSyntacticCandidate && (!top1 || top1.score < 5.0)) {
      status = 'PROPOSED_REPAIR';
      proposalType = 'AR_SYNTACTIC';
      proposed = { locator: `AR_SYNTACTIC:B${v.book}.C${v.ch}.V${v.vs}.w${arPos}`, strongsId: null };
      totals.proposedRepair++;
    } else if (top1 && margin >= 1.5 && top1.score >= 5.5) {
      const editionPrefix = v.lang === 'greek' ? (isTr ? 'TR' : 'SBLGNT') : 'OSHB';
      const osisMatch = v.oshbOsis ? v.oshbOsis.match(/\.(\d+)\.(\d+)$/) : null;
      const locC = (v.lang !== 'greek' && osisMatch) ? parseInt(osisMatch[1], 10) : v.ch;
      const locV = (v.lang !== 'greek' && osisMatch) ? parseInt(osisMatch[2], 10) : v.vs;
      const candLocator = `${editionPrefix}:B${v.book}.C${locC}.V${locV}.w${top1.w}`;
      const isSharedAdjacent = prevClaimed.has(top1.w) && prevClaimed.get(top1.w) === arPos - 1;
      if (!prevClaimed.has(top1.w) || isSharedAdjacent) {
        status = 'PROPOSED_REPAIR';
        proposalType = isSharedAdjacent ? 'shared_compound_phrase' : '1_to_1_or_realign';
        proposed = {
          w: top1.w, strongsId: top1.strongsId, locator: candLocator,
          relationType: isSharedAdjacent ? 'compound_phrase' : null,
          confidence: top1.score, margin
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
      arPos, arWord, current: { strongsId: strongsId || null, origPos, locator, morphSource },
      status, proposalType, proposed,
      topCandidates: scored.slice(0, 3)
    });
  }

  const vSummary = {
    confidentKeep: units.filter(u => u.status === 'CONFIDENT_KEEP').length,
    proposedRepair: units.filter(u => u.status === 'PROPOSED_REPAIR').length,
    pendingReview: units.filter(u => u.status === 'PENDING_REVIEW').length
  };
  verseProposals.push({ verse: v.name, lang: v.lang, summary: vSummary, units });
  console.log(`  ${v.name.padEnd(11)} [${v.lang.padEnd(7)}]: keep=${String(vSummary.confidentKeep).padStart(2)}, proposed=${String(vSummary.proposedRepair).padStart(2)}, pending_review=${String(vSummary.pendingReview).padStart(2)}`);
}

console.log('\n--- ALIGNMENT ENGINE SUMMARY ---');
console.log(`  Total Units     : ${totals.totalUnits}`);
console.log(`  CONFIDENT_KEEP  : ${totals.confidentKeep}`);
console.log(`  PROPOSED_REPAIR : ${totals.proposedRepair}`);
console.log(`  PENDING_REVIEW  : ${totals.pendingReview}`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ manifest: path.relative(repoRoot, manifestPath), totals, verses: verseProposals }, null, 2) + '\n', 'utf8');
console.log(`Written proposal report: ${outPath}`);
