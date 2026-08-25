const API_KEY = 'AQ.Ab8RN6I0iKzZWyqCYBb4GB1xUErrZVwF7TIRmAPh7XWF5kLZeQ'; // From context

async function testModel(model) {
  console.log(`Testing ${model}...`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
  });
  if (res.ok) {
    console.log(`${model} OK`);
  } else {
    const error = await res.json();
    console.log(`${model} Error:`, error.error.code, error.error.message);
  }
}

async function run() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-3.0-flash');
  await testModel('gemini-3.5-flash');
  await testModel('gemini-3.5-flash-lite');
}
run();
