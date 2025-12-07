const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    const columns = db.pragma('table_info(montages)');
    const hasColumn = columns.some(c => c.name === 'google_event_id');

    if (!hasColumn) {
        console.log('Adding google_event_id column...');
        db.prepare('ALTER TABLE montages ADD COLUMN google_event_id TEXT').run();
        console.log('Column added successfully.');
    } else {
        console.log('Column google_event_id already exists.');
    }
} catch (error) {
    console.error('Error:', error);
}
