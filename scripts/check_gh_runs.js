async function checkRuns() {
  const url = 'https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs?per_page=10';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await res.json();
  console.log('Total Runs:', data.total_count);
  if (data.workflow_runs && data.workflow_runs.length > 0) {
    console.log('Latest 5 workflow runs:');
    data.workflow_runs.slice(0, 5).forEach(r => {
      console.log(`- Run #${r.run_number}: status=${r.status}, conclusion=${r.conclusion}, name="${r.name}", commit="${r.head_commit?.message?.substring(0, 40)}"`);
    });
  } else {
    console.log('Runs data:', data);
  }
}

checkRuns();
