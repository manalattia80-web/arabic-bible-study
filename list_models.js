const key = 'AQ.Ab8RN6I0iKzZWyqCYBb4GB1xUErrZVwF7TIRmAPh7XWF5kLZeQ';
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
.then(r => r.json())
.then(console.log);
