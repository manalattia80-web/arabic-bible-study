const fs = require('fs');
const initSqlJs = require('sql.js');

initSqlJs().then(function(SQL) {
  const filebuffer = fs.readFileSync('dictionary_extracted/assets/databases/strongs.db');
  const db = new SQL.Database(filebuffer);
  
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  if (tablesResult.length > 0) {
    const tables = tablesResult[0].values.map(v => v[0]);
    console.log("Tables:", tables);
    
    for (const t of tables) {
      console.log(`\n--- Schema for ${t} ---`);
      const schema = db.exec(`PRAGMA table_info(${t})`);
      if (schema.length > 0) {
        console.log(schema[0].columns.join(' | '));
        schema[0].values.forEach(v => console.log(v.join(' | ')));
      }
      
      console.log(`\n--- Sample from ${t} ---`);
      const sample = db.exec(`SELECT * FROM ${t} LIMIT 3`);
      if (sample.length > 0) {
        console.log(sample[0].columns.join(' | '));
        sample[0].values.forEach(v => console.log(v.join(' | ')));
      }
    }
  }
});
