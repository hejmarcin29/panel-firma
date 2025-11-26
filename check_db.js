const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const rows = db.prepare('SELECT * FROM __drizzle_migrations').all();
console.log(JSON.stringify(rows, null, 2));
