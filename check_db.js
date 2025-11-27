const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(rows, null, 2));
