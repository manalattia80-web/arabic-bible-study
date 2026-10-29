const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../mobile/assets/bible_study.db');
const outDir = path.resolve(__dirname, '../mobile/assets/db_parts');
const chunkSize = 5 * 1024 * 1024; // 5 MB

const buffer = fs.readFileSync(dbPath);
const total = buffer.length;
const totalParts = Math.ceil(total / chunkSize);

console.log(`Splitting ${total} bytes into ${totalParts} parts of ${chunkSize} bytes...`);

// Clean old parts
const existing = fs.readdirSync(outDir).filter(f => f.startsWith('part_') && f.endsWith('.dat'));
for (const f of existing) {
  fs.unlinkSync(path.join(outDir, f));
}

for (let i = 0; i < totalParts; i++) {
  const start = i * chunkSize;
  const end = Math.min(start + chunkSize, total);
  const chunk = buffer.subarray(start, end);
  const partName = `part_${String(i).padStart(2, '0')}.dat`;
  fs.writeFileSync(path.join(outDir, partName), chunk);
}

console.log(`Successfully generated ${totalParts} chunks in ${outDir}!`);
