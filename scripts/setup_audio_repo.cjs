const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoDir = 'C:\\Users\\manal\\.gemini\\antigravity\\scratch\\arabic-bible-study\\audio_repository\\strongs';
const samplesDir = 'C:\\Users\\manal\\.gemini\\antigravity\\brain\\6d627a05-53e4-4c46-8d77-9c11b867e94a\\audio_samples';

if (!fs.existsSync(repoDir)) {
  fs.mkdirSync(repoDir, { recursive: true });
}

const sampleFiles = fs.readdirSync(samplesDir).filter(f => f.endsWith('.mp3'));
console.log(`Found ${sampleFiles.length} sample mp3 files.`);

const index = [];

for (const f of sampleFiles) {
  // Filename format: G25_greek.mp3, H7225_hebrew.mp3, H426_aramaic.mp3
  const match = f.match(/^([GH]\d+)_([a-z]+)\.mp3$/i);
  if (!match) continue;

  const [_, sid, lang] = match;
  const targetName = `${sid.toUpperCase()}.mp3`;
  const srcPath = path.join(samplesDir, f);
  const destPath = path.join(repoDir, targetName);

  const fileBytes = fs.readFileSync(srcPath);
  fs.writeFileSync(destPath, fileBytes);

  const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');

  index.push({
    strongs_id: sid.toUpperCase(),
    language: lang.toLowerCase(),
    filename: targetName,
    byte_size: fileBytes.length,
    sha256: sha256,
    standard: lang.toLowerCase() === 'greek' ? 'erasmian_target' : (lang.toLowerCase() === 'aramaic' ? 'biblical_aramaic' : 'masoretic_target'),
    status: 'empirical_sample_catalogued'
  });
}

const indexPath = path.join('C:\\Users\\manal\\.gemini\\antigravity\\scratch\\arabic-bible-study\\audio_repository', 'strongs_audio_index.json');
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log(`Successfully indexed and copied ${index.length} files to ${repoDir}`);
console.log(`Index saved at ${indexPath}`);
