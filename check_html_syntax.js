const fs = require('fs');
const html = fs.readFileSync('AlignExodus.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const scriptContent = scriptMatch[1];
  try {
    new Function(scriptContent);
    console.log("Syntax is OK");
  } catch (e) {
    console.error("Syntax Error:", e);
  }
} else {
  console.log("No script found");
}
