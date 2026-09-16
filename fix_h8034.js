const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmdXdwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';
fetch('https://ojtsoqxfuwpcmwnpnabo.supabase.co/rest/v1/strongs_ar_translations?strongs_id=eq.H8034', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'apikey': apikey,
    'Authorization': 'Bearer ' + apikey
  },
  body: JSON.stringify({
    pronunciation_ar: 'شِيم',
    definition_ar: 'اسْم. وهو اللفظ الذي يُطلق على شخص أو شيء ليُميزه. وتُستخدم الكلمة في العبرية لتشير مجازاً إلى: الشرف، والسلطان، والشخصية، والسمعة.',
    notes_ar: 'تُرجمت هذه الكلمة غالباً إلى: اسم، صيت أو شهرة، تقرير، أو أُناس ذوو شأن.',
    is_verified: true
  })
}).then(r => console.log('Fixed H8034', r.status));
