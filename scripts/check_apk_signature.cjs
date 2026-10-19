const fs = require('fs');

const apkPath = 'C:\\Users\\manal\\Downloads\\arabic-bible-study-app.apk';
const fd = fs.openSync(apkPath, 'r');
const stat = fs.fstatSync(fd);
const size = stat.size;

// Read last 64KB to find End of Central Directory
const bufferSize = Math.min(65536, size);
const buffer = Buffer.alloc(bufferSize);
fs.readSync(fd, buffer, 0, bufferSize, size - bufferSize);

// Look for APK Sig Block 42
const sigMagic = Buffer.from('APK Sig Block 42', 'ascii');
const fullBuffer = Buffer.alloc(1024 * 1024); // read 1MB before end
const readSize = Math.min(1024 * 1024, size);
fs.readSync(fd, fullBuffer, 0, readSize, size - readSize);

const index = fullBuffer.indexOf(sigMagic);
console.log('File size:', size);
console.log('APK Sig Block 42 found in last 1MB:', index !== -1);
if (index !== -1) {
  console.log('Position of magic relative to last 1MB:', index);
}
fs.closeSync(fd);
