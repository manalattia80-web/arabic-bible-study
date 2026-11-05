const https = require('https');
const repo = 'manalattia80-web/arabic-bible-study';
const runId = process.argv[2] || '42029887068';

function getRunStatus() {
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: 'api.github.com',
      path: `/repos/${repo}/actions/runs/${runId}`,
      headers: { 'User-Agent': 'Node-CI-Watcher' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

async function loop() {
  console.log(`Watching Run ID: ${runId}...`);
  for (let i = 0; i < 25; i++) {
    try {
      const data = await getRunStatus();
      console.log(`[T+${i * 20}s] Status: ${data.status} | Conclusion: ${data.conclusion}`);
      if (data.status === 'completed') {
        console.log(`Run ${runId} finished with conclusion: ${data.conclusion}`);
        process.exit(data.conclusion === 'success' ? 0 : 2);
      }
    } catch (e) {
      console.error('Fetch error:', e.message);
    }
    await new Promise(r => setTimeout(r, 20000));
  }
  console.log('Timeout waiting for run completion.');
  process.exit(1);
}

loop();
