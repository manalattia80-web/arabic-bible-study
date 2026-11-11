/**
 * robinson_tr_helper.cjs
 * Deterministic parser & strict validator for Scrivener Textus Receptus (Robinson) tags.
 * Maps literal Robinson grammar codes to canonical DB columns:
 *   morph_pos, morph_tense, morph_voice, morph_mood, morph_person, morph_number, morph_gender, morph_case
 * Ensures inapplicable fields remain strictly NULL/empty.
 */

const TENSE_MAP = {
  P: 'present',
  I: 'imperfect',
  F: 'future',
  A: 'aorist',
  R: 'perfect',
  L: 'pluperfect'
};

// Robinson voice codes: A, M, P, D (middle_deponent/middle), O (passive_deponent/passive),
// N (middle_or_passive deponent), E (middle_or_passive)
const VOICE_MAP = {
  A: ['active'],
  M: ['middle'],
  P: ['passive'],
  D: ['middle_deponent', 'middle'],
  O: ['passive_deponent', 'passive'],
  N: ['middle_deponent', 'middle_passive', 'middle'],
  E: ['middle_passive', 'middle', 'passive']
};

// Notice Robinson uses 'M' for Imperative (whereas MorphGNT uses 'D')
const MOOD_MAP = {
  I: 'indicative',
  S: 'subjunctive',
  O: 'optative',
  M: 'imperative',
  N: 'infinitive',
  P: 'participle'
};

const CASE_MAP = {
  N: 'nominative',
  G: 'genitive',
  D: 'dative',
  A: 'accusative',
  V: 'vocative'
};

const NUM_MAP = {
  S: 'singular',
  P: 'plural'
};

const GEN_MAP = {
  M: 'masculine',
  F: 'feminine',
  N: 'neuter'
};

const NORM_PERSON = p => ({ first: '1', second: '2', third: '3' }[p] || p || null);

function parseRobinsonGrammar(rawGrammar) {
  const raw = (rawGrammar || '').trim().toUpperCase();
  if (!raw) return null;
  const parts = raw.split('-');
  const head = parts[0];
  const d1 = parts[1] || '';
  const d2 = parts[2] || '';

  const empty = {
    raw,
    allowedPos: [],
    tense: null,
    allowedVoice: null,
    mood: null,
    person: null,
    number: null,
    gender: null,
    case: null
  };

  if (head === 'CONJ') return { ...empty, allowedPos: ['conjunction'] };
  if (head === 'ADV')  return { ...empty, allowedPos: ['adverb'] };
  if (head === 'PREP') return { ...empty, allowedPos: ['preposition'] };
  if (head === 'PRT' || head === 'COND') return { ...empty, allowedPos: ['particle', 'conjunction'] };
  if (head === 'INJ')  return { ...empty, allowedPos: ['interjection', 'particle'] };
  if (head === 'HEB' || head === 'ARAM') return { ...empty, allowedPos: ['noun', 'proper_noun', 'particle'] };

  if (head === 'V') {
    const vSpec = d1.replace(/^2/, '');
    if (vSpec.length < 3) return null;
    const tCh = vSpec[0], vCh = vSpec[1], mCh = vSpec[2];
    const tense = TENSE_MAP[tCh] || null;
    const allowedVoice = VOICE_MAP[vCh] || null;
    const mood = MOOD_MAP[mCh] || null;
    if (!tense || !allowedVoice || !mood) return null;

    let person = null, number = null, gender = null, gCase = null;
    if (mood === 'infinitive') {
      // Infinitives have no person, number, gender, or case
    } else if (mood === 'participle') {
      // Format: V-PAP-ASF -> d2 = ASF; or V-PAP-NSM
      if (d2.length >= 3) {
        gCase = CASE_MAP[d2[0]] || null;
        number = NUM_MAP[d2[1]] || null;
        gender = GEN_MAP[d2[2]] || null;
      }
    } else {
      // Finite verb: V-FAI-2S, V-2AAI-3S, V-PAM-2P -> d2 = 2S
      if (d2.length >= 2 && /^[123][SP]$/.test(d2)) {
        person = d2[0];
        number = NUM_MAP[d2[1]] || null;
      }
    }
    return { ...empty, allowedPos: ['verb'], tense, allowedVoice, mood, person, number, gender, case: gCase };
  }

  const nominalPosMap = {
    N: ['noun', 'proper_noun'],
    A: ['adjective'],
    T: ['article', 'pronoun'],
    D: ['demonstrative', 'pronoun'],
    R: ['relative_pronoun', 'pronoun'],
    I: ['interrogative_pronoun', 'pronoun'],
    P: ['personal_pronoun', 'pronoun'],
    F: ['pronoun', 'personal_pronoun'],
    S: ['pronoun', 'adjective'],
    C: ['pronoun'],
    K: ['pronoun'],
    Q: ['interrogative_pronoun', 'pronoun'],
    X: ['pronoun']
  };

  if (nominalPosMap[head]) {
    const out = { ...empty, allowedPos: nominalPosMap[head] };
    if (!d1 || d1 === 'PRI' || d1 === 'LI' || d1 === 'OI' || d1 === 'NUI') {
      return out; // Indeclinable proper noun / letter / numeral
    }
    // Check person prefix on P-2GS, F-2ASM, S-2SDSM
    if (head === 'S' && d1.length >= 5 && /^[123][SP]/.test(d1)) {
      // Possessive pronoun (e.g. S-2SDSM): owner person (2), owner num, then Case/Num/Gen
      out.person = d1[0];
      out.case = CASE_MAP[d1[2]] || null;
      out.number = NUM_MAP[d1[3]] || null;
      out.gender = GEN_MAP[d1[4]] || null;
      return out;
    }
    if ((head === 'P' || head === 'F') && d1.length >= 3 && /^[123]/.test(d1)) {
      out.person = d1[0];
      out.case = CASE_MAP[d1[1]] || null;
      out.number = NUM_MAP[d1[2]] || null;
      out.gender = d1.length >= 4 ? (GEN_MAP[d1[3]] || null) : null;
      return out;
    }
    if (d1.length >= 3) {
      out.case = CASE_MAP[d1[0]] || null;
      out.number = NUM_MAP[d1[1]] || null;
      out.gender = GEN_MAP[d1[2]] || null;
    }
    return out;
  }

  return null;
}

/**
 * Strictly validates DB orig_morphology (literal Robinson tag) and all 8 derived fields
 * against the Scrivener TR grammar tag. Inapplicable fields MUST be null/empty.
 */
function verifyTrDerivedMorphology(origMorph, srcGrammar, d) {
  const dbTag = (origMorph || '').trim();
  const trTag = (srcGrammar || '').trim();
  if (!dbTag) return 'missing orig_morphology for TR token';
  if (trTag && dbTag !== trTag) {
    return `TR morph '${dbTag}' != Robinson '${trTag}'`;
  }
  const spec = parseRobinsonGrammar(trTag || dbTag);
  if (!spec) return `unrecognized Robinson TR grammar '${trTag || dbTag}'`;

  const pos = (d.morphPos || '').trim() || null;
  if (!pos || !spec.allowedPos.includes(pos)) {
    return `TR derived morph_pos '${pos}' not in [${spec.allowedPos.join(', ')}] (${spec.raw})`;
  }
  if ((d.morphStem || null) !== null) {
    return `Greek TR token cannot carry Semitic morph_stem '${d.morphStem}' (${spec.raw})`;
  }
  if ((d.morphTense || null) !== spec.tense) {
    return `TR derived morph_tense '${d.morphTense || null}' != '${spec.tense}' (${spec.raw})`;
  }
  const voice = (d.morphVoice || null);
  if (spec.allowedVoice === null) {
    if (voice !== null) return `TR derived morph_voice '${voice}' must be null (${spec.raw})`;
  } else if (!voice || !spec.allowedVoice.includes(voice)) {
    return `TR derived morph_voice '${voice}' not in [${spec.allowedVoice.join(', ')}] (${spec.raw})`;
  }
  if ((d.morphMood || null) !== spec.mood) {
    return `TR derived morph_mood '${d.morphMood || null}' != '${spec.mood}' (${spec.raw})`;
  }
  const normP = NORM_PERSON(d.morphPerson);
  if (normP !== spec.person) {
    return `TR derived morph_person '${d.morphPerson || null}' != '${spec.person}' (${spec.raw})`;
  }
  if ((d.morphNumber || null) !== spec.number) {
    return `TR derived morph_number '${d.morphNumber || null}' != '${spec.number}' (${spec.raw})`;
  }
  if ((d.morphGender || null) !== spec.gender) {
    return `TR derived morph_gender '${d.morphGender || null}' != '${spec.gender}' (${spec.raw})`;
  }
  if ((d.morphCase || null) !== spec.case) {
    return `TR derived morph_case '${d.morphCase || null}' != '${spec.case}' (${spec.raw})`;
  }
  return null;
}

module.exports = { parseRobinsonGrammar, verifyTrDerivedMorphology };
