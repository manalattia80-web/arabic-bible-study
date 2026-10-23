const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const tag = 'v1.0.284';
  const apkUrl = `https://github.com/manalattia80-web/arabic-bible-study/releases/download/${tag}/arabic-bible-study-app.apk`;
  const targetApk = path.join('C:\\Users\\manal\\Downloads', `arabic-bible-study-app-${tag}.apk`);

  console.log(`Starting monitoring for GitHub release ${tag}...`);

  let assetReady = false;
  for (let attempt = 1; attempt <= 60; attempt++) {
    console.log(`[Attempt ${attempt}/60] Checking APK release asset availability...`);
    try {
      const checkRes = await fetch(apkUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'manual' });
      if (checkRes.status === 302 || checkRes.ok) {
        assetReady = true;
        console.log(`APK asset is ready! Status: ${checkRes.status}`);
        break;
      }
    } catch (e) {
      console.log(`Attempt ${attempt} error: ${e.message}`);
    }
    await sleep(15000); // Check every 15s
  }

  if (!assetReady) {
    throw new Error('APK asset not ready after timeout.');
  }

  console.log(`Downloading APK from ${apkUrl} to ${targetApk}...`);
  const downloadRes = await fetch(apkUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!downloadRes.ok) {
    throw new Error(`Failed to download APK: ${downloadRes.status} ${downloadRes.statusText}`);
  }

  const fileStream = fs.createWriteStream(targetApk);
  await pipeline(Readable.fromWeb(downloadRes.body), fileStream);

  const stats = fs.statSync(targetApk);
  console.log(`SUCCESS! APK downloaded to ${targetApk} (Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
