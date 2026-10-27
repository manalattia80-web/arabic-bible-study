const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../mobile/lib/core/services/database_service.dart');
const lines = fs.readFileSync(targetFile, 'utf8').split('\n');

// Find line index for '// Clean up previous database versions'
const startIdx = lines.findIndex(l => l.includes('// Clean up previous database versions'));
// Find line index for closing brace of the for loop
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].trim() === '}' && lines[i-1].includes('catch (_) {}')) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate cleanup lines');
  process.exit(1);
}

console.log(`Cleanup block is lines ${startIdx} to ${endIdx}`);
const cleanupBlock = lines.slice(startIdx, endIdx + 1);
// Remove cleanupBlock
lines.splice(startIdx, endIdx - startIdx + 1);

// Find insert position: right after 'Local SQLite database assembled successfully'
const insertIdx = lines.findIndex(l => l.includes('Local SQLite database assembled successfully'));
if (insertIdx === -1) {
  console.error('Could not locate insert line');
  process.exit(1);
}

// Modify the comment in cleanupBlock:
cleanupBlock[0] = cleanupBlock[0].replace('// Clean up previous database versions', '// Safe deferred cleanup: only delete old database versions after new v39 is verified ok');

lines.splice(insertIdx + 1, 0, '', ...cleanupBlock);

fs.writeFileSync(targetFile, lines.join('\n'), 'utf8');
console.log('Successfully reordered cleanup block in database_service.dart!');
