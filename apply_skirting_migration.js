const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log('Applying migration...');
    db.exec(`
        ALTER TABLE montages ADD COLUMN scheduled_skirting_installation_at integer;
        ALTER TABLE montages ADD COLUMN scheduled_skirting_installation_end_at integer;
    `);
    console.log('Migration applied successfully.');
} catch (error) {
    console.error('Error applying migration:', error);
}
