const https = require('https');
const fs = require('fs');
const path = require('path');
const child = require('child_process');

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Antigravity-Agent' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function monitor(commitSha) {
  console.log(`Monitoring GitHub Actions workflow runs for commit ${commitSha}...`);
  let targetRun = null;

  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const runs = await request('https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs?per_page=10');
      if (runs && runs.workflow_runs) {
        for (const r of runs.workflow_runs) {
          if (r.head_sha.startsWith(commitSha) && r.name === 'Android Emulator Verification') {
            targetRun = r;
            break;
          }
        }
      }

      if (targetRun) {
        console.log(`[${new Date().toISOString()}] Run ID: ${targetRun.id} | Status: ${targetRun.status} | Conclusion: ${targetRun.conclusion}`);
        if (targetRun.status === 'completed') {
          console.log(`Run ${targetRun.id} finished with conclusion: ${targetRun.conclusion}`);
          break;
        }
      } else {
        console.log(`Waiting for workflow run to register (attempt ${attempt + 1})...`);
      }
    } catch (err) {
      console.warn('API fetch warning:', err.message);
    }
    await new Promise(r => setTimeout(r, 15000));
  }

  if (!targetRun || targetRun.status !== 'completed') {
    console.error('Timed out waiting for run to complete.');
    process.exit(1);
  }

  console.log('Waiting 10s for release asset clobber update...');
  await new Promise(r => setTimeout(r, 10000));

  const url = 'https://github.com/manalattia80-web/arabic-bible-study/releases/download/v1.0.348/android_automated_test_evidence_v1.0.348.zip';
  const dest = path.resolve(__dirname, '../android_evidence_run25_success.zip');
  console.log('Downloading evidence from release:', url);
  await download(url, dest);
  console.log('Downloaded size:', fs.statSync(dest).size, 'bytes');

  const outDir = path.resolve(__dirname, '../extracted_evidence_run25_success');
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  child.execSync(`tar -xf "${dest}" -C "${outDir}"`);
  console.log('Extracted evidence files:');
  fs.readdirSync(outDir).forEach(f => {
    console.log(' -', f, fs.statSync(`${outDir}/${f}`).size, 'bytes');
  });
}

const commit = process.argv[2] || 'HEAD';
monitor(commit).catch(err => {
  console.error('Monitor fatal error:', err);
  process.exit(1);
});
