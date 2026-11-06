const { execSync } = require('child_process');

function exec(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

console.log('Watching for v1.0.357 GitHub Actions workflow run...');
let runId = null;

while (!runId) {
  try {
    const raw = exec('curl.exe -s -H "Accept: application/vnd.github+json" https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs?per_page=5');
    const data = JSON.parse(raw);
    const run = data.workflow_runs.find(r => 
      (r.name === 'Build & Release APK' || r.name === 'Build and Release APK') && 
      (r.head_branch === 'feature/ui-ux-refinement' || r.head_branch === 'v1.0.357')
    );
    if (run) {
      runId = run.id;
      console.log(`Found workflow run ID: ${runId} (status: ${run.status}, conclusion: ${run.conclusion}, commit: ${run.head_sha.substring(0, 7)})`);
    } else {
      console.log('No matching run found yet. Retrying in 10s...');
      execSync('powershell -Command "Start-Sleep -Seconds 10"');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
    execSync('powershell -Command "Start-Sleep -Seconds 10"');
  }
}

let completed = false;
while (!completed) {
  try {
    const raw = exec(`curl.exe -s -H "Accept: application/vnd.github+json" https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs/${runId}`);
    const run = JSON.parse(raw);
    console.log(`[${new Date().toISOString()}] Run ${runId}: status=${run.status}, conclusion=${run.conclusion}`);
    if (run.status === 'completed') {
      completed = true;
      if (run.conclusion === 'success') {
        console.log('SUCCESS: Build & Release APK workflow completed successfully!');
        process.exit(0);
      } else {
        console.error(`FAILURE: Workflow ended with conclusion: ${run.conclusion}`);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error('Polling error:', err.message);
  }
  execSync('powershell -Command "Start-Sleep -Seconds 15"');
}
