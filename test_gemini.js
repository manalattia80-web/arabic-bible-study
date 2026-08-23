const key = 'AQ.Ab8RN6I0iKzZWyqCYBb4GB1xUErrZVwF7TIRmAPh7XWF5kLZeQ';
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
})
.then(r => r.json())
.then(console.log);
