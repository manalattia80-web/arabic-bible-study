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

const partsList = [];
for (let i = 0; i < totalParts; i++) {
  const start = i * chunkSize;
  const end = Math.min(start + chunkSize, total);
  const chunk = buffer.subarray(start, end);
  const partName = `part_${String(i).padStart(2, '0')}.dat`;
  fs.writeFileSync(path.join(outDir, partName), chunk);
  partsList.push(partName);
}

// 1. Write parts manifest file
const manifestPath = path.join(outDir, 'parts_manifest.json');
const manifestData = {
  totalParts,
  chunkSize,
  totalBytes: total,
  generatedAt: new Date().toISOString(),
  parts: partsList
};
fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2) + '\n', 'utf8');
console.log(`Generated parts manifest in ${manifestPath}`);

// 2. Automatically synchronize totalParts in database_service.dart
const dbServicePath = path.resolve(__dirname, '../mobile/lib/core/services/database_service.dart');
if (fs.existsSync(dbServicePath)) {
  let content = fs.readFileSync(dbServicePath, 'utf8');
  const updated = content.replace(/const totalParts = \d+;/, `const totalParts = ${totalParts};`);
  if (updated !== content) {
    fs.writeFileSync(dbServicePath, updated, 'utf8');
    console.log(`Auto-synchronized totalParts = ${totalParts} in database_service.dart!`);
  } else {
    console.log(`database_service.dart already has totalParts = ${totalParts}.`);
  }
}

console.log(`Successfully generated ${totalParts} chunks in ${outDir}!`);
