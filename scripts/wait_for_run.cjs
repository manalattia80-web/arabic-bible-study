const runId = '39282083902';

async function check() {
  while (true) {
    try {
      const res = await fetch(`https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${data.status}, Conclusion: ${data.conclusion || 'pending'}`);
        if (data.status === 'completed') {
          console.log(`RUN FINISHED with conclusion: ${data.conclusion}`);
          process.exit(data.conclusion === 'success' ? 0 : 1);
        }
      } else {
        console.log(`Fetch returned status: ${res.status}`);
      }
    } catch (e) {
      console.error('Error fetching run:', e.message);
    }
    await new Promise(r => setTimeout(r, 15000));
  }
}

check();
