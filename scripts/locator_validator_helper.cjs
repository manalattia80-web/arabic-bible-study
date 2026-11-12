/**
 * locator_validator_helper.cjs
 * Strict canonical locator validator enforcing edition, book, chapter, verse
 * (including OSHB versification offsets e.g. Dan 6:22 -> Dan.6.23), token index,
 * and range bounds.
 */
function parseOsisChapterVerse(osis) {
  const m = String(osis || '').match(/\.(\d+)\.(\d+)$/);
  return m ? { ch: parseInt(m[1], 10), vs: parseInt(m[2], 10) } : null;
}

function validateCanonicalLocator({
  locator,
  isSyntactic,
  lang,
  book,
  ch,
  vs,
  oshbOsis,
  arPos,
  origPos,
  morphSource,
  tokenCount
}) {
  if (!locator || typeof locator !== 'string') {
    return { ok: false, error: `missing locator '${locator || ''}'` };
  }
  const m = locator.match(/^(OSHB|SBLGNT|TR|AR_SYNTACTIC):B(\d+)\.C(\d+)\.V(\d+)\.w(\d+)(?:-w(\d+))?$/);
  if (!m) {
    return { ok: false, error: `malformed canonical locator '${locator}'` };
  }
  const edition = m[1];
  const locBook = parseInt(m[2], 10);
  const locCh = parseInt(m[3], 10);
  const locVs = parseInt(m[4], 10);
  const locW = parseInt(m[5], 10);
  const locWEnd = m[6] ? parseInt(m[6], 10) : null;

  if (isSyntactic) {
    if (edition !== 'AR_SYNTACTIC') {
      return { ok: false, error: `syntactic row requires AR_SYNTACTIC edition, got '${edition}'` };
    }
    if (locBook !== book || locCh !== ch || locVs !== vs) {
      return { ok: false, error: `AR_SYNTACTIC B${locBook}.C${locCh}.V${locVs} != B${book}.C${ch}.V${vs}` };
    }
    if (locW !== arPos || locWEnd !== null) {
      return { ok: false, error: `AR_SYNTACTIC locator w${locW}${locWEnd ? '-w' + locWEnd : ''} != arPos w${arPos}` };
    }
    return { ok: true, edition, locW, locWEnd };
  }

  if (locBook !== book) {
    return { ok: false, error: `locator book B${locBook} != expected B${book} ('${locator}')` };
  }

  if (lang === 'greek') {
    if (edition !== 'SBLGNT' && edition !== 'TR') {
      return { ok: false, error: `Greek row requires SBLGNT/TR edition, got '${edition}'` };
    }
    if (edition === 'TR' && morphSource && morphSource !== 'morphgnt_tr') {
      return { ok: false, error: `TR locator disagrees with morph_source='${morphSource}'` };
    }
    if (edition === 'SBLGNT' && morphSource && morphSource !== 'morphgnt_sblgnt') {
      return { ok: false, error: `SBLGNT locator disagrees with morph_source='${morphSource}'` };
    }
    if (locCh !== ch || locVs !== vs) {
      return { ok: false, error: `Greek locator C${locCh}.V${locVs} != C${ch}.V${vs} ('${locator}')` };
    }
  } else {
    if (edition !== 'OSHB') {
      return { ok: false, error: `${lang} row requires OSHB edition, got '${edition}'` };
    }
    const osisRef = parseOsisChapterVerse(oshbOsis);
    const expCh = osisRef ? osisRef.ch : ch;
    const expVs = osisRef ? osisRef.vs : vs;
    if (locCh !== expCh || locVs !== expVs) {
      return { ok: false, error: `OSHB versification mismatch: locator C${locCh}.V${locVs} != canonical ${oshbOsis || `C${expCh}.V${expVs}`} ('${locator}')` };
    }
  }

  if (origPos !== locW) {
    return { ok: false, error: `orig_word_position (${origPos}) != locator w${locW}` };
  }
  if (locWEnd !== null) {
    if (locWEnd < locW) {
      return { ok: false, error: `inverted locator range w${locW}-w${locWEnd}` };
    }
    if (tokenCount && locWEnd > tokenCount) {
      return { ok: false, error: `locator range end w${locWEnd} exceeds token count (${tokenCount})` };
    }
  }
  if (tokenCount && locW > tokenCount) {
    return { ok: false, error: `locator w${locW} exceeds token count (${tokenCount})` };
  }

  return { ok: true, edition, locW, locWEnd };
}

module.exports = { validateCanonicalLocator, parseOsisChapterVerse };
