const assert = require('assert');
const { parseMorphology } = require('./morphology_engine.cjs');

console.log('Testing Morphology Engine Patterns for v1.0.356...');

// 1. Hebrew Participle (1 Kings 18:21 - تعرجون)
const res1 = parseMorphology('HVqrmpa');
console.log('HVqrmpa ->', res1);
assert.strictEqual(res1.pos, 'verb');
assert.strictEqual(res1.stem, 'qal');
assert.strictEqual(res1.mood, 'participle');
assert.strictEqual(res1.gender, 'masculine');
assert.strictEqual(res1.number, 'plural');
assert.strictEqual(res1.person, null, 'Participles should not have a grammatical person');

// 2. Aramaic Hithpeel Participle (Ezra 5:8 - يُعمل)
const res2 = parseMorphology('AVurfsa');
console.log('AVurfsa ->', res2);
assert.strictEqual(res2.pos, 'verb');
assert.strictEqual(res2.stem, 'hithpeel');
assert.strictEqual(res2.voice, 'passive');
assert.strictEqual(res2.mood, 'participle');
assert.strictEqual(res2.gender, 'feminine');
assert.strictEqual(res2.number, 'singular');
assert.strictEqual(res2.person, null, 'Participles should not have a grammatical person');

// 3. Greek Present Active Imperative (Philippians 4:6 - تهتموا)
const res3 = parseMorphology('V- 2PAD-P--');
console.log('V- 2PAD-P-- ->', res3);
assert.strictEqual(res3.pos, 'verb');
assert.strictEqual(res3.tense, 'present');
assert.strictEqual(res3.voice, 'active');
assert.strictEqual(res3.mood, 'imperative');
assert.strictEqual(res3.person, '2');
assert.strictEqual(res3.number, 'plural');

// 4. Greek Present Passive Imperative (Philippians 4:6 - لتُعلم)
const res4 = parseMorphology('V- 3PPD-S--');
console.log('V- 3PPD-S-- ->', res4);
assert.strictEqual(res4.pos, 'verb');
assert.strictEqual(res4.tense, 'present');
assert.strictEqual(res4.voice, 'passive');
assert.strictEqual(res4.mood, 'imperative');
assert.strictEqual(res4.person, '3');
assert.strictEqual(res4.number, 'singular');

console.log('✓ All 4 morphology patterns passed assertions successfully!');
