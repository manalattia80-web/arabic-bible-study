const fs = require('fs');
const path = require('path');

const sampleData = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'whole_verses_audit_sample.json'), 'utf8'));

console.log('========================================================================');
console.log('          WHOLE-VERSE 4-DIMENSIONAL DEEP AUDIT (10 VERSES, 163 WORDS)   ');
console.log('========================================================================\n');

let totalWords = 0;
let linkagePassed = 0;
let surfacePassed = 0;
let morphPassed = 0;
let locatorPassed = 0;

const findings = [];

for (const v of sampleData) {
  console.log(`\n------------------------------------------------------------------------`);
  console.log(`[VERSE] ${v.ref} (${v.wordCount} words)`);
  console.log(`AVD:      "${v.verseInfo.text_avd_ar}"`);
  console.log(`ORIGINAL: "${v.verseInfo.text_original}"`);
  console.log(`------------------------------------------------------------------------`);

  for (const w of v.words) {
    totalWords++;
    const issues = [];

    // 1. Linkage Check
    let linkOk = true;
    if (!w.strongs_id && w.morph_pos !== 'syntactic_ar') {
      // Check if it's an unlinked content word or an untagged particle
      issues.push(`Linkage: Missing strongs_id while morph_pos='${w.morph_pos}'`);
      linkOk = false;
    }
    if (w.strongs_id && w.morph_pos === 'syntactic_ar') {
      issues.push(`Linkage: syntactic_ar has strongs_id ${w.strongs_id}`);
      linkOk = false;
    }
    if (linkOk) linkagePassed++;

    // 2. Surface & Lemma Check
    let surfaceOk = true;
    if (w.morph_pos === 'syntactic_ar') {
      if (w.orig_word && !['', '---', '—', '-'].includes(w.orig_word.trim())) {
        issues.push(`Surface: syntactic_ar has non-empty orig_word '${w.orig_word}'`);
        surfaceOk = false;
      }
    } else {
      if (!w.orig_surface || !w.orig_word) {
        issues.push(`Surface: missing orig_surface or orig_word (word='${w.ar_word}')`);
        surfaceOk = false;
      }
      // Check mixed script
      if (/[\u0600-\u06FF]/.test(w.orig_surface || '') || /[\u0600-\u06FF]/.test(w.orig_word || '')) {
        issues.push(`Surface: mixed Arabic script in original field`);
        surfaceOk = false;
      }
    }
    if (surfaceOk) surfacePassed++;

    // 3. Morphology Check
    let morphOk = true;
    if (!w.morph_pos && w.strongs_id) {
      issues.push(`Morphology: morph_pos is empty for strongs ${w.strongs_id}`);
      morphOk = false;
    }
    if (w.morph_pos === 'verb') {
      if (!w.morph_stem && !w.morph_tense) {
        issues.push(`Morphology: verb missing both stem and tense`);
        morphOk = false;
      }
    }
    if (morphOk) morphPassed++;

    // 4. Locator Check
    let locOk = true;
    if (!w.verified_locator || w.verified_locator.trim() === '' || w.verified_locator === '-') {
      issues.push(`Locator: missing or empty locator`);
      locOk = false;
    } else {
      // Check locator format
      const locMatch = w.verified_locator.match(/^(OSHB|SBLGNT|TR|AR_SYNTACTIC):B(\d+)\.C(\d+)\.V(\d+)\.w(\d+)$/);
      if (!locMatch) {
        issues.push(`Locator: non-canonical locator format '${w.verified_locator}'`);
        locOk = false;
      } else if (locMatch[1] !== 'AR_SYNTACTIC') {
        const locPos = parseInt(locMatch[5], 10);
        if (w.orig_word_position > 0 && locPos !== w.orig_word_position) {
          issues.push(`Locator: mismatch between locator token .w${locPos} and orig_word_position ${w.orig_word_position}`);
          locOk = false;
        }
      }
    }
    if (locOk) locatorPassed++;

    // Report word line
    const statusMark = issues.length === 0 ? '✓' : '✗';
    console.log(`  ${statusMark} pos ${w.ar_word_position.toString().padStart(2)}: ${w.ar_word.padEnd(16)} | Strongs: ${(w.strongs_id || 'NULL').padEnd(6)} | Orig: ${(w.orig_surface || '-').padEnd(16)} | Pos: ${(w.morph_pos || '-').padEnd(14)} | Loc: ${w.verified_locator || '-'}`);
    if (issues.length > 0) {
      for (const iss of issues) {
        console.log(`      ↳ ALERT: ${iss}`);
      }
      findings.push({ verse: v.ref, pos: w.ar_word_position, word: w.ar_word, issues });
    }
  }
}

console.log(`\n========================================================================`);
console.log(`                      DEEP AUDIT SUMMARY                                `);
console.log(`========================================================================`);
console.log(`Total Words Audited:    ${totalWords}`);
console.log(`1. Linkage Accuracy:    ${linkagePassed}/${totalWords} (${(linkagePassed/totalWords*100).toFixed(1)}%)`);
console.log(`2. Surface Form/Lemma:  ${surfacePassed}/${totalWords} (${(surfacePassed/totalWords*100).toFixed(1)}%)`);
console.log(`3. Morphology Coverage: ${morphPassed}/${totalWords} (${(morphPassed/totalWords*100).toFixed(1)}%)`);
console.log(`4. Locator Alignment:   ${locatorPassed}/${totalWords} (${(locatorPassed/totalWords*100).toFixed(1)}%)`);
console.log(`Total Flagged Issues:   ${findings.length}`);
if (findings.length > 0) {
  console.log('\nDetailed Flagged Items:');
  for (const f of findings) {
    console.log(`- [${f.verse}] pos ${f.pos} (${f.word}): ${f.issues.join('; ')}`);
  }
}
