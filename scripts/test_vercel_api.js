async function testVercelSearch() {
  const url = 'https://arabic-bible-study.vercel.app/api/v1/search/verses?q=%D9%8A%D8%B3%D9%88%D8%B9&limit=5';
  console.log('Fetching:', url);
  const res = await fetch(url);
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Total returned:', data.meta?.total);
  if (data.data && data.data[0]) {
    console.log('Sample reference:', data.data[0].books?.name_ar, data.data[0].chapter_num + ':' + data.data[0].verse_num);
  }
}

testVercelSearch();
