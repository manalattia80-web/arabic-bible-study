const fs = require('fs');
const part1 = JSON.parse(fs.readFileSync('gen38_part1.json', 'utf8'));
const part2 = JSON.parse(fs.readFileSync('gen38_part2.json', 'utf8'));
const full = part1.concat(part2);
fs.writeFileSync('gen38.json', JSON.stringify(full, null, 2));
console.log('Combined Gen 38 length:', full.length);
