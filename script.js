
const fs = require('fs');
let code = fs.readFileSync('map_books_nt.js', 'utf8');
code = code.replace(/\{\s*"id": 40,[\s\S]*?"chs": 28\s*\},/g, ''); 
code = code.replace(/\{\s*"id": 41,[\s\S]*?"chs": 16\s*\},/g, ''); 
code = code.replace('let ch = (b.id === 26 ? 23 : 1)', 'let ch = (b.id === 42 ? 3 : 1)');
fs.writeFileSync('map_books_nt.js', code);

