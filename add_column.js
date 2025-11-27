const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

try {
    console.log('Adding scheduled_installation_end_at column to montages table...');
    db.prepare('ALTER TABLE montages ADD COLUMN scheduled_installation_end_at INTEGER').run();
    console.log('Column added successfully.');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column already exists.');
    } else {
        console.error('Error adding column:', error);
    }
}
