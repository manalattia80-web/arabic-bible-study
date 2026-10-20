const fs = require('fs');
const path = require('path');

const partsDir = path.resolve(__dirname, '../mobile/assets/db_parts');
const outDb = path.resolve(__dirname, '../mobile/assets/bible_study.db');

const files = fs.readdirSync(partsDir)
  .filter(f => f.startsWith('part_') && f.endsWith('.dat'))
  .sort();

console.log(`Reassembling ${files.length} chunks into ${outDb}...`);

const writeStream = fs.createWriteStream(outDb);

for (const file of files) {
  const filePath = path.join(partsDir, file);
  const data = fs.readFileSync(filePath);
  writeStream.write(data);
}

writeStream.end(() => {
  const stats = fs.statSync(outDb);
  console.log(`Reassembled successfully: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
});
