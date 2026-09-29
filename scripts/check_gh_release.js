async function checkReleases() {
  const url = 'https://api.github.com/repos/manalattia80-web/arabic-bible-study/releases';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const data = await res.json();
  if (Array.isArray(data)) {
    console.log('Latest releases count:', data.length);
    console.log('Top 3 releases:');
    data.slice(0, 3).forEach(r => {
      console.log(`- ${r.name} (${r.tag_name}) published at ${r.published_at}`);
      console.log(`  Assets:`, r.assets?.map(a => a.name));
    });
  } else {
    console.log('Response:', data);
  }
}

checkReleases();
