const fs = require('fs');
const initSqlJs = require('sql.js');

initSqlJs().then(function(SQL) {
  // Create an invalid buffer (e.g. text file)
  const invalidBuffer = Buffer.from('This is not a database file', 'utf8');
  
  try {
      const db = new SQL.Database(invalidBuffer);
      console.log("Database initialized without error.");
      db.exec("SELECT * FROM some_table");
  } catch (e) {
      console.log("Error:", e.message);
  }
});
