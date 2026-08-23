const fs = require('fs');
const part1 = JSON.parse(fs.readFileSync('gen41_part1.json', 'utf8'));
const part2 = JSON.parse(fs.readFileSync('gen41_part2.json', 'utf8'));
const full = part1.concat(part2);
fs.writeFileSync('gen41.json', JSON.stringify(full, null, 2));
console.log('Combined Gen 41 length:', full.length);
