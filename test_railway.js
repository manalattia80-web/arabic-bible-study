fetch('https://arabic-bible-study-production.up.railway.app/api/v1/strongs/H776')
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
