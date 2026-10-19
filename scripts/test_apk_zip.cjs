const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apkPath = 'C:\\Users\\manal\\Downloads\\arabic-bible-study-app.apk';

console.log('Checking APK:', apkPath);
console.log('File size:', fs.statSync(apkPath).size, 'bytes');

// Check zip header
const fd = fs.openSync(apkPath, 'r');
const buf = Buffer.alloc(4);
fs.readSync(fd, buf, 0, 4, 0);
fs.closeSync(fd);

const isZip = buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07);
console.log('ZIP Magic bytes:', buf, 'Is ZIP:', isZip);

// Test extracting with tar / PowerShell
try {
  const list = execSync(`tar -tf "${apkPath}" | grep "assets/db_parts"`, { encoding: 'utf8' });
  const lines = list.trim().split('\n').filter(Boolean);
  console.log(`Found ${lines.length} db_parts inside APK!`);
  console.log('Sample:', lines.slice(0, 5));
} catch (e) {
  console.error('tar error:', e.message);
}
