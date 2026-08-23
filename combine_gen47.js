const fs = require('fs');

const p1 = JSON.parse(fs.readFileSync('gen47_part1.json', 'utf8'));
const p2 = JSON.parse(fs.readFileSync('gen47_part2.json', 'utf8'));

const combined = [...p1, ...p2];
fs.writeFileSync('gen47.json', JSON.stringify(combined, null, 2));
console.log("Combined into gen47.json, total length:", combined.length);
