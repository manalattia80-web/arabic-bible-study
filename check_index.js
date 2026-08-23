const fs = require('fs');
const initSqlJs = require('sql.js');

initSqlJs().then(function(SQL) {
  const filebuffer = fs.readFileSync('dictionary_extracted/assets/databases/strongs.db');
  const db = new SQL.Database(filebuffer);
  
  const sample = db.exec(`SELECT * FROM arabic_strong_index WHERE surface LIKE '%ة%' LIMIT 2`);
  if (sample.length > 0) { console.log("Has ة", sample[0].values); } else { console.log("No ة"); }

  const sample2 = db.exec(`SELECT * FROM arabic_strong_index WHERE surface LIKE '%ه%' LIMIT 2`);
  if (sample2.length > 0) { console.log("Has ه", sample2[0].values); } else { console.log("No ه"); }
  
  const sample3 = db.exec(`SELECT * FROM arabic_strong_index WHERE surface LIKE '%ى%' LIMIT 2`);
  if (sample3.length > 0) { console.log("Has ى", sample3[0].values); } else { console.log("No ى"); }
});
