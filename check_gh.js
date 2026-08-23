const https = require('https');
https.get('https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const run = json.workflow_runs[0];
      console.log(`Status: ${run.status}`);
      console.log(`Conclusion: ${run.conclusion}`);
      console.log(`Commit: ${run.head_commit.message}`);
    } catch(e) {}
  });
});
