const key = 'AQ.Ab8RN6I0iKzZWyqCYBb4GB1xUErrZVwF7TIRmAPh7XWF5kLZeQ';

async function test(modelName) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
  });
  console.log(modelName, res.status);
  if (!res.ok) console.log(await res.text());
}

async function run() {
  await test('models/gemini-3.7-flash');
  await test('models/gemini-flash-latest');
  await test('models/gemini-3.1-flash-lite');
  await test('models/gemini-3.5-flash-lite');
}
run();
