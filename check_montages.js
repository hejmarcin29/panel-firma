/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const columns = db.pragma('table_info(montages)');
console.log('Columns in montages:', columns.map(c => c.name));
