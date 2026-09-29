async function checkArtifacts() {
  const url = 'https://api.github.com/repos/manalattia80-web/arabic-bible-study/actions/artifacts';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await res.json();
  console.log('Total Artifacts:', data.total_count);
  if (data.artifacts && data.artifacts.length > 0) {
    console.log('Top 3 artifacts:');
    data.artifacts.slice(0, 3).forEach(a => {
      console.log(`- Name: ${a.name}, Created: ${a.created_at}, Size: ${(a.size_in_bytes / 1024 / 1024).toFixed(1)} MB`);
    });
  } else {
    console.log('Artifacts data:', data);
  }
}

checkArtifacts();
