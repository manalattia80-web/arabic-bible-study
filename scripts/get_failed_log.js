async function getRunLog() {
  // Get jobs for latest run
  const runsRes = await fetch('https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs?per_page=1', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const runsData = await runsRes.json();
  const latestRun = runsData.workflow_runs[0];
  console.log(`Latest Run #${latestRun.run_number} (${latestRun.html_url})`);

  const jobsRes = await fetch(latestRun.jobs_url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const jobsData = await jobsRes.json();
  const job = jobsData.jobs[0];
  console.log(`Job status: ${job.status}, conclusion: ${job.conclusion}`);
  console.log('Failed steps:');
  job.steps.filter(s => s.conclusion === 'failure').forEach(s => {
    console.log(`- Step "${s.name}" failed (number ${s.number})`);
  });
}

getRunLog();
