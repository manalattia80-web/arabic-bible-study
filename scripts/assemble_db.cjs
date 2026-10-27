const fs = require('fs');
const path = require('path');

const dbPartsDir = path.resolve(__dirname, '../mobile/assets/db_parts');
const outDbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');

console.log('Reassembling SQLite database from chunks in:', dbPartsDir);

const files = fs.readdirSync(dbPartsDir)
  .filter(f => f.startsWith('part_') && f.endsWith('.dat'))
  .sort();

console.log(`Found ${files.length} chunk parts.`);
if (files.length === 0) {
  console.error('Error: No db parts found in ' + dbPartsDir);
  process.exit(1);
}

const writeStream = fs.createWriteStream(outDbPath);

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const partPath = path.join(dbPartsDir, file);
  const data = fs.readFileSync(partPath);
  writeStream.write(data);
}

writeStream.end();

writeStream.on('finish', () => {
  const stat = fs.statSync(outDbPath);
  console.log(`Successfully assembled ${outDbPath} (${stat.size} bytes across ${files.length} parts).`);
});
