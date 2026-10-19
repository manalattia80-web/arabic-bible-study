const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/matched_cases.json', 'utf8'));

let diffCount = 0;
data.forEach((m, idx) => {
  if (m.mapping.strongs_id !== m.caseInfo.current) {
    console.log(`Diff at #${idx+1}: Book ${m.caseInfo.book} ${m.caseInfo.ch}:${m.caseInfo.v} word '${m.mapping.ar_word}' pos ${m.mapping.ar_word_position}: cur in DB is '${m.mapping.strongs_id}', expected '${m.caseInfo.current}'`);
    diffCount++;
  }
});
console.log('Total with different current:', diffCount);
