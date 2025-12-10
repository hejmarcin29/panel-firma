const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    const rows = db.prepare('SELECT * FROM __drizzle_migrations ORDER BY created_at DESC').all();
    console.log(JSON.stringify(rows, null, 2));
} catch (e) {
    console.log('Error reading migrations:', e.message);
}
