const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dictionary_extracted/assets/databases/strongs.db');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, rows) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Tables:");
      rows.forEach((row) => {
        console.log(row.name);
      });
      
      // Let's also check the schema of a few tables
      if (rows.length > 0) {
        db.all(`PRAGMA table_info(${rows[0].name});`, (err, cols) => {
          console.log(`Schema for ${rows[0].name}:`, cols);
        });
      }
    }
  });
});

db.close();
