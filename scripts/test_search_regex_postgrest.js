const SUPABASE_URL = 'https://ojtsoqxfuwpcmwnpnabo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdHNvcXhmd3dwY213bnBuYWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzAyNzc3NiwiZXhwIjoyMTAyNjAzNzc2fQ.jZJQLfEUjropwUsYfBVUkMlWc-p343_wpD4fNTkPgbA';

async function testOperator(op, value) {
  const url = `${SUPABASE_URL}/rest/v1/verses?text_avd_ar=${op}.${encodeURIComponent(value)}&select=id&limit=5`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const text = await res.text();
  console.log(`Operator '${op}' response status: ${res.status}, content sample: ${text.substring(0, 100)}`);
}

async function main() {
  await testOperator('like', '*يسوع*');
  await testOperator('ilike', '*يسوع*');
  await testOperator('match', '[ىي]*س*و*ع*');
  await testOperator('imatch', '[ىي]*س*و*ع*');
  await testOperator('fts', 'يسوع');
  await testOperator('phrasedef', 'يسوع');
  await testOperator('wants', 'يسوع');
}

main();
