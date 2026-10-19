const fs = require('fs');

const falseFriends = JSON.parse(fs.readFileSync('scripts/nt_false_friends.json', 'utf8'));

console.log(`Analyzing ${falseFriends.length} False Friends in the New Testament...`);

// Let's analyze Matthew first
const mattFF = falseFriends.filter(f => f.book_id === 40);
console.log(`Matthew has ${mattFF.length} false friends across chapters.`);

// Group Matthew by chapter
const mattByCh = {};
for (const f of mattFF) {
  mattByCh[f.chapter] = (mattByCh[f.chapter] || 0) + 1;
}
console.log('Matthew False Friends per chapter:', mattByCh);

// Sample some chapters with many errors, e.g. chapter 2, chapter 5, chapter 10
for (const ch of [2, 3, 4, 5]) {
  console.log(`\n--- Samples from Matthew Chapter ${ch} ---`);
  mattFF.filter(f => f.chapter === ch).slice(0, 8).forEach(f => {
    console.log(`[Matt ${f.chapter}:${f.verse}] pos ${f.pos} «${f.word}» -> assigned ${f.assigned_strong} (${f.assigned_orig})`);
  });
}
