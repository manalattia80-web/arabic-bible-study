const https = require('https');
const check = () => {
  https.get('https://arabic-bible-study-production.up.railway.app/api/v1/strongs/H776', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      if (json.data && json.data.audio_url) {
        console.log('SUCCESS! audio_url found in API!');
        process.exit(0);
      } else {
        console.log('Still waiting... audio_url missing');
        setTimeout(check, 5000);
      }
    });
  });
};
check();
