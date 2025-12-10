const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log('Applying migration for measurement_separate_skirting...');
    db.exec(`
        ALTER TABLE montages ADD COLUMN measurement_separate_skirting integer DEFAULT 0;
    `);
    console.log('Migration applied successfully.');
} catch (error) {
    console.error('Error applying migration:', error);
}
