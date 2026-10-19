const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/new_batch_matched.json', 'utf8'));
let diff = 0;
data.forEach((item, idx) => {
  const match = item.mapping.strongs_id === item.target.cur;
  if (!match) {
    console.log(`Mismatch at #${idx+1}: DB has ${item.mapping.strongs_id}, expected ${item.target.cur}`);
    diff++;
  } else {
    console.log(`#${idx+1}: Book ${item.target.book} ${item.target.ch}:${item.target.v} "${item.mapping.ar_word}" (pos ${item.mapping.ar_word_position}) -> cur: ${item.mapping.strongs_id} -> tgt: ${item.target.tgt} (${item.lemma})`);
  }
});
console.log('Total mismatches with user expected current:', diff);
