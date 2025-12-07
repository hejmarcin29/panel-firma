
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { montages } = require('./src/lib/db/schema'); // This might fail if schema uses TS syntax not supported by plain node
// Actually, I should just use raw SQL to be safe and fast.

const sqlite = new Database('sqlite.db');
const rows = sqlite.prepare('SELECT DISTINCT status FROM montages').all();
console.log('Distinct statuses:', rows);
