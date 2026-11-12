/**
 * test_strict_locator_gates.cjs
 * Negative & positive tests for full canonical locator validation:
 * edition + book + chapter + verse (including OSHB versification offsets e.g. Dan 6:22 -> Dan.6.23) + word + range bounds.
 */
const { validateCanonicalLocator } = require('./locator_validator_helper.cjs');

let passed = 0, total = 0;
function check(name, expectedOk, res) {
  total++;
  if (res.ok === expectedOk) {
    passed++;
    console.log(`  ✓ [PASS] ${name}${res.error ? ' -> rejected: ' + res.error : ''}`);
  } else {
    console.error(`  ✗ [FAIL] ${name} -> got ok=${res.ok}, error=${res.error}`);
  }
}

console.log('========================================================================');
console.log('  STRICT CANONICAL LOCATOR VALIDATION TESTS (NEGATIVE & POSITIVE)       ');
console.log('========================================================================');

// Positive controls
check('Positive OSHB Ruth 2:12 w1', true, validateCanonicalLocator({
  locator: 'OSHB:B8.C2.V12.w1', isSyntactic: false, lang: 'hebrew',
  book: 8, ch: 2, vs: 12, oshbOsis: 'Ruth.2.12', arPos: 1, origPos: 1, morphSource: 'oshb_wlc', tokenCount: 15
}));
check('Positive OSHB Dan 6:22 -> Dan.6.23 versification offset w1', true, validateCanonicalLocator({
  locator: 'OSHB:B27.C6.V23.w1', isSyntactic: false, lang: 'aramaic',
  book: 27, ch: 6, vs: 22, oshbOsis: 'Dan.6.23', arPos: 1, origPos: 1, morphSource: 'oshb_wlc', tokenCount: 20
}));
check('Positive TR Mark 12:30 w30', true, validateCanonicalLocator({
  locator: 'TR:B41.C12.V30.w30', isSyntactic: false, lang: 'greek',
  book: 41, ch: 12, vs: 30, arPos: 16, origPos: 30, morphSource: 'morphgnt_tr', tokenCount: 33
}));
check('Positive AR_SYNTACTIC Mark 12:30 w17', true, validateCanonicalLocator({
  locator: 'AR_SYNTACTIC:B41.C12.V30.w17', isSyntactic: true, lang: 'greek',
  book: 41, ch: 12, vs: 30, arPos: 17, origPos: 0, morphSource: 'syntactic_ar', tokenCount: 33
}));
check('Positive OSHB valid range w2-w3', true, validateCanonicalLocator({
  locator: 'OSHB:B8.C2.V12.w2-w3', isSyntactic: false, lang: 'hebrew',
  book: 8, ch: 2, vs: 12, oshbOsis: 'Ruth.2.12', arPos: 2, origPos: 2, morphSource: 'oshb_wlc', tokenCount: 15
}));

// Negative cases
check('Negative fake B99.C99.V99.w1 rejected', false, validateCanonicalLocator({
  locator: 'OSHB:B99.C99.V99.w1', isSyntactic: false, lang: 'hebrew',
  book: 8, ch: 2, vs: 12, oshbOsis: 'Ruth.2.12', arPos: 1, origPos: 1, morphSource: 'oshb_wlc', tokenCount: 15
}));
check('Negative Dan 6:22 using V22 instead of Dan.6.23 rejected', false, validateCanonicalLocator({
  locator: 'OSHB:B27.C6.V22.w1', isSyntactic: false, lang: 'aramaic',
  book: 27, ch: 6, vs: 22, oshbOsis: 'Dan.6.23', arPos: 1, origPos: 1, morphSource: 'oshb_wlc', tokenCount: 20
}));
check('Negative Greek edition SBLGNT with morph_source=morphgnt_tr rejected', false, validateCanonicalLocator({
  locator: 'SBLGNT:B45.C5.V8.w1', isSyntactic: false, lang: 'greek',
  book: 45, ch: 5, vs: 8, arPos: 1, origPos: 1, morphSource: 'morphgnt_tr', tokenCount: 15
}));
check('Negative Greek using OSHB edition rejected', false, validateCanonicalLocator({
  locator: 'OSHB:B45.C5.V8.w1', isSyntactic: false, lang: 'greek',
  book: 45, ch: 5, vs: 8, arPos: 1, origPos: 1, morphSource: 'morphgnt_sblgnt', tokenCount: 15
}));
check('Negative inverted range w5-w2 rejected', false, validateCanonicalLocator({
  locator: 'OSHB:B8.C2.V12.w5-w2', isSyntactic: false, lang: 'hebrew',
  book: 8, ch: 2, vs: 12, oshbOsis: 'Ruth.2.12', arPos: 5, origPos: 5, morphSource: 'oshb_wlc', tokenCount: 15
}));
check('Negative out-of-bounds range w1-w999 rejected', false, validateCanonicalLocator({
  locator: 'OSHB:B8.C2.V12.w1-w999', isSyntactic: false, lang: 'hebrew',
  book: 8, ch: 2, vs: 12, oshbOsis: 'Ruth.2.12', arPos: 1, origPos: 1, morphSource: 'oshb_wlc', tokenCount: 15
}));
check('Negative AR_SYNTACTIC wrong book/verse rejected', false, validateCanonicalLocator({
  locator: 'AR_SYNTACTIC:B99.C1.V1.w3', isSyntactic: true, lang: 'greek',
  book: 52, ch: 5, vs: 16, arPos: 3, origPos: 0, morphSource: 'syntactic_ar', tokenCount: 2
}));

console.log(`\nSUMMARY: ${passed}/${total} strict canonical locator tests passed.`);
if (passed !== total) process.exit(1);
