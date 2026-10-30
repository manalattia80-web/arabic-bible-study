const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const tag = 'v1.0.338';
  const apkUrl = `https://github.com/manalattia80-web/arabic-bible-study/releases/download/${tag}/arabic-bible-study-app.apk`;
  const runsApiUrl = 'https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs?per_page=3';
  const downloadsDir = 'C:\\Users\\manal\\Downloads';
  const targetApk = path.join(downloadsDir, `arabic-bible-study-app-${tag}.apk`);
  const localRepoApk = path.join(__dirname, '..', `arabic-bible-study-app-${tag}.apk`);

  console.log(`Starting monitoring for GitHub release ${tag}...`);

  let assetReady = false;
  for (let attempt = 1; attempt <= 60; attempt++) {
    try {
      const checkRes = await fetch(apkUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'manual' });
      if (checkRes.status === 302 || checkRes.ok) {
        assetReady = true;
        console.log(`[Attempt ${attempt}] APK asset is ready! Status: ${checkRes.status}`);
        break;
      }

      const runRes = await fetch(runsApiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (runRes.ok) {
        const runJson = await runRes.json();
        const latest = runJson.workflow_runs && runJson.workflow_runs[0];
        if (latest) {
          console.log(`[Attempt ${attempt}/60] Workflow #${latest.run_number} "${latest.display_title}" status=${latest.status} conclusion=${latest.conclusion}`);
          if (latest.run_number === 338 && latest.status === 'completed' && latest.conclusion === 'failure') {
            throw new Error(`GitHub Actions workflow failed! Run ID: ${latest.id} (${latest.html_url})`);
          }
        }
      } else {
        console.log(`[Attempt ${attempt}/60] Waiting for release ${tag}...`);
      }
    } catch (e) {
      if (e.message.includes('GitHub Actions workflow failed')) throw e;
      console.log(`Attempt ${attempt} check note: ${e.message}`);
    }
    await sleep(15000);
  }

  if (!assetReady) {
    throw new Error(`Timeout waiting for APK release ${tag} after 15 minutes.`);
  }

  console.log(`Downloading APK from ${apkUrl} to ${targetApk}...`);
  const downloadRes = await fetch(apkUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
  if (!downloadRes.ok) {
    throw new Error(`Failed to download APK: HTTP ${downloadRes.status} ${downloadRes.statusText}`);
  }

  const fileStream = fs.createWriteStream(targetApk);
  await pipeline(Readable.fromWeb(downloadRes.body), fileStream);

  const stats = fs.statSync(targetApk);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`Successfully downloaded ${targetApk} (${sizeMb} MB)!`);

  fs.copyFileSync(targetApk, localRepoApk);
  console.log(`Copied APK also to ${localRepoApk}`);
}

run().catch(err => {
  console.error('Download error:', err);
  process.exit(1);
});
