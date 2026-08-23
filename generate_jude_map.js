const fs = require('fs');

async function main() {
  const verses = await fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/verses?book_id=eq.65&select=id,chapter_num,verse_num,text_avd_ar&order=verse_num.asc', {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA'
    }
  }).then(r => r.json());
  
  let html = `<html><head><meta charset="UTF-8"><title>Align Jude</title></head><body>
  <script>
  const verses = ${JSON.stringify(verses)};
  // include logic to call Gemini for verses
  </script>
  </body></html>
  `;
}
main();
