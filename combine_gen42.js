const fs = require('fs');

function run() {
    const part1 = JSON.parse(fs.readFileSync('gen42_part1.json', 'utf8'));
    const part2 = JSON.parse(fs.readFileSync('gen42_part2.json', 'utf8'));
    
    const combined = [...part1, ...part2];
    fs.writeFileSync('gen42.json', JSON.stringify(combined, null, 2));
    console.log("Combined Gen 42 length:", combined.length);
}
run();
