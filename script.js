
const fs = require('fs');
let code = fs.readFileSync('map_books_nt.js', 'utf8');
code = code.replace(/\{\s*"id": 42,[\s\S]*?"chs": 24\s*\},/g, ''); 
code = code.replace(/\{\s*"id": 43,[\s\S]*?"chs": 21\s*\},/g, ''); 
fs.writeFileSync('map_books_nt.js', code);

