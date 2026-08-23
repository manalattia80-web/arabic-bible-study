const fs = require('fs');
const initSqlJs = require('sql.js');

initSqlJs().then(function(SQL) {
  const filebuffer = fs.readFileSync('dictionary_extracted/assets/databases/strongs.db');
  const db = new SQL.Database(filebuffer);
  
  const sample = db.exec(`SELECT DISTINCT verseId FROM avd_verse_strongs LIMIT 20`);
  if(sample.length > 0) {
      console.log(sample[0].values);
  } else {
      console.log("Empty!");
  }
});
