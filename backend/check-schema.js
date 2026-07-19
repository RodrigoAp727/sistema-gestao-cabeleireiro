const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'data', 'cabeleireiro.db'));

db.all("SELECT name FROM sqlite_master WHERE type='table'", (e, rows) => {
  let done = 0;
  rows.forEach(r => {
    db.all(`PRAGMA table_info(${r.name})`, (e2, cols) => {
      process.stdout.write(`${r.name}: ${cols.map(c => c.name).join(', ')}\n`);
      done++;
      if (done === rows.length) db.close();
    });
  });
});
