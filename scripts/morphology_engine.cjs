/**
 * Robust Biblical Hebrew / Aramaic (OSHB) & Greek (MorphGNT) Morphology Parser
 * Standard: https://hb.openscriptures.org/parsing/HebrewMorphologyCodes.html
 * Standard: MorphGNT SBLGNT format
 */

function parseMorphology(rawTag) {
  if (!rawTag || rawTag === '—' || rawTag === 'syntactic_ar') {
    return {
      pos: 'syntactic_ar', stem: null, tense: null, voice: null, mood: null,
      person: null, gender: null, number: null, case: null
    };
  }

  // Handle Greek MorphGNT (e.g. N- ----NSF-, V- 3SPIA---, A- ----NSF-, etc.)
  if (rawTag.includes('-') && (rawTag.startsWith('N-') || rawTag.startsWith('V-') || rawTag.startsWith('A-') || rawTag.startsWith('R') || rawTag.startsWith('D-') || rawTag.startsWith('C-') || rawTag.startsWith('P-') || rawTag.startsWith('I-'))) {
    return parseGreekMorphGNT(rawTag);
  }

  // Hebrew / Aramaic (OSHB)
  return parseHebrewAramaicMorph(rawTag);
}

function parseGreekMorphGNT(tag) {
  const posPart = tag.substring(0, 2).trim();
  const code = tag.length >= 10 ? tag.substring(3) : (tag.substring(2).trim());

  let pos = 'noun';
  if (posPart === 'N-') pos = 'noun';
  else if (posPart === 'V-') pos = 'verb';
  else if (posPart === 'A-') pos = 'adjective';
  else if (posPart === 'D-') pos = 'adverb';
  else if (posPart === 'C-') pos = 'conjunction';
  else if (posPart === 'P-') pos = 'preposition';
  else if (posPart.startsWith('R')) pos = 'pronoun';
  else if (posPart === 'I-') pos = 'interjection';

  let person = null, tense = null, voice = null, mood = null, mCase = null, number = null, gender = null;
  if (code.length >= 8) {
    if ('123'.includes(code[0])) person = code[0];
    if (code[1] === 'P') tense = 'present';
    else if (code[1] === 'I') tense = 'imperfect';
    else if (code[1] === 'F') tense = 'future';
    else if (code[1] === 'A') tense = 'aorist';
    else if (code[1] === 'X') tense = 'perfect';
    else if (code[1] === 'Y') tense = 'pluperfect';

    if (code[2] === 'A') voice = 'active';
    else if (code[2] === 'M') voice = 'middle';
    else if (code[2] === 'P') voice = 'passive';

    if (code[3] === 'I') mood = 'indicative';
    else if (code[3] === 'S') mood = 'subjunctive';
    else if (code[3] === 'O') mood = 'optative';
    else if (code[3] === 'M') mood = 'imperative';
    else if (code[3] === 'N') mood = 'infinitive';
    else if (code[3] === 'P') mood = 'participle';

    if (code[4] === 'N') mCase = 'nominative';
    else if (code[4] === 'G') mCase = 'genitive';
    else if (code[4] === 'D') mCase = 'dative';
    else if (code[4] === 'A') mCase = 'accusative';
    else if (code[4] === 'V') mCase = 'vocative';

    if (code[5] === 'S') number = 'singular';
    else if (code[5] === 'P') number = 'plural';

    if (code[6] === 'M') gender = 'masculine';
    else if (code[6] === 'F') gender = 'feminine';
    else if (code[6] === 'N') gender = 'neuter';
  }

  return { pos, stem: null, tense, voice, mood, person, gender, number, case: mCase };
}

function parseHebrewAramaicMorph(tag) {
  const segments = tag.split('/');
  const normalizedSegs = segments.map((seg, i) => {
    if (i === 0 && (seg.startsWith('H') || seg.startsWith('A'))) {
      return { lang: seg[0], code: seg.substring(1) };
    }
    return { lang: tag[0], code: seg };
  });

  const priority = ['V', 'N', 'A', 'P', 'D', 'R', 'C', 'T'];
  let best = normalizedSegs[0];
  let bestPrio = 99;

  for (const seg of normalizedSegs) {
    const c0 = seg.code[0];
    const pIdx = priority.indexOf(c0);
    if (pIdx !== -1 && pIdx < bestPrio) {
      if (c0 === 'S' && seg.code.startsWith('Sp')) continue;
      best = seg;
      bestPrio = pIdx;
    }
  }

  const isAramaic = tag.startsWith('A');
  const code = best.code;
  const type = code[0];

  let pos = 'noun';
  let stem = null, tense = null, voice = null, mood = null;
  let person = null, gender = null, number = null;

  if (type === 'V') {
    pos = 'verb';
    const sChar = code[1];
    const tChar = code[2];

    if (sChar === 'q' || sChar === 'Q') stem = isAramaic ? 'peal' : 'qal';
    else if (sChar === 'N') stem = 'niphal';
    else if (sChar === 'p') stem = isAramaic ? 'pael' : 'piel';
    else if (sChar === 'P') stem = 'pual';
    else if (sChar === 'h') stem = isAramaic ? 'haphel' : 'hiphil';
    else if (sChar === 'H') stem = 'hophal';
    else if (sChar === 't') stem = isAramaic ? 'ithpeel' : 'hithpael';
    else if (sChar === 'a') stem = 'aphel';
    else if (sChar === 'o') stem = 'polel';

    if (tChar === 'p') { tense = 'qatal'; mood = 'indicative'; }
    else if (tChar === 'q') { tense = 'weqatal'; mood = 'indicative'; }
    else if (tChar === 'i') { tense = 'yiqtol'; mood = 'indicative'; }
    else if (tChar === 'w') { tense = 'wayyiqtol'; mood = 'indicative'; }
    else if (tChar === 'v') { tense = null; mood = 'imperative'; }
    else if (tChar === 'j') { tense = 'yiqtol'; mood = 'jussive'; }
    else if (tChar === 'h') { tense = 'yiqtol'; mood = 'cohortative'; }
    else if (tChar === 'r' || tChar === 's') { tense = null; mood = 'participle'; }
    else if (tChar === 'c') { tense = null; mood = 'infinitive_construct'; }
    else if (tChar === 'a') { tense = null; mood = 'infinitive_absolute'; }

    if (['qal', 'piel', 'hiphil', 'peal', 'pael', 'aphel'].includes(stem)) voice = 'active';
    else if (['niphal', 'pual', 'hophal', 'ithpeel', 'hithpeel'].includes(stem)) voice = 'passive';
    else if (['hithpael'].includes(stem)) voice = 'reflexive';

    if (code.length >= 4 && '123'.includes(code[3])) {
      person = code[3];
      if (code.length >= 5) {
        if (code[4] === 'm') gender = 'masculine';
        else if (code[4] === 'f') gender = 'feminine';
        else if (code[4] === 'c') gender = 'common';
      }
      if (code.length >= 6) {
        if (code[5] === 's') number = 'singular';
        else if (code[5] === 'p') number = 'plural';
        else if (code[5] === 'd') number = 'dual';
      }
    }
  } else if (type === 'N') {
    if (code[1] === 'p') {
      pos = 'proper_noun';
      number = 'singular';
    } else {
      pos = 'noun';
      if (code.length >= 3) {
        const g = code[2];
        if (g === 'm') gender = 'masculine';
        else if (g === 'f') gender = 'feminine';
        else if (g === 'c' || g === 'b') gender = 'common';
      }
      if (code.length >= 4) {
        const n = code[3];
        if (n === 's') number = 'singular';
        else if (n === 'p') number = 'plural';
        else if (n === 'd') number = 'dual';
      }
    }
  } else if (type === 'A') {
    pos = 'adjective';
    if (code.length >= 3) {
      const g = code[2];
      if (g === 'm') gender = 'masculine';
      else if (g === 'f') gender = 'feminine';
      else if (g === 'c' || g === 'b') gender = 'common';
    }
    if (code.length >= 4) {
      const n = code[3];
      if (n === 's') number = 'singular';
      else if (n === 'p') number = 'plural';
      else if (n === 'd') number = 'dual';
    }
  } else if (type === 'D') {
    pos = 'adverb';
  } else if (type === 'R') {
    pos = 'preposition';
  } else if (type === 'C') {
    pos = 'conjunction';
  } else if (type === 'P') {
    const pType = code[1];
    if (pType === 'd') pos = 'demonstrative';
    else if (pType === 'p') pos = 'personal_pronoun';
    else if (pType === 'r') pos = 'relative_pronoun';
    else if (pType === 'i' || pType === 'x') pos = 'pronoun';
    else pos = 'pronoun';

    if (code.length >= 3 && '123'.includes(code[2])) person = code[2];
    if (code.length >= 4) {
      if (code[3] === 'm') gender = 'masculine';
      else if (code[3] === 'f') gender = 'feminine';
      else if (code[3] === 'c') gender = 'common';
    }
    if (code.length >= 5) {
      if (code[4] === 's') number = 'singular';
      else if (code[4] === 'p') number = 'plural';
    }
  } else if (type === 'T') {
    pos = 'particle';
  }

  return { pos, stem, tense, voice, mood, person, gender, number, case: null };
}

module.exports = { parseMorphology };
