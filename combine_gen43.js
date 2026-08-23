const fs = require('fs');

function run() {
    const part1 = JSON.parse(fs.readFileSync('gen43_part1.json', 'utf8'));
    const part2 = JSON.parse(fs.readFileSync('gen43_part2.json', 'utf8'));
    
    const combined = [...part1, ...part2];
    fs.writeFileSync('gen43.json', JSON.stringify(combined, null, 2));
    console.log("Combined Gen 43 length:", combined.length);
}
run();
