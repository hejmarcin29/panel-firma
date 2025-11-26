
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log('Checking for scheduled_end_at column...');
    const columns = db.pragma('table_info(montages)');
    const hasColumn = columns.some(c => c.name === 'scheduled_end_at');
    
    if (!hasColumn) {
        console.log('Adding scheduled_end_at column...');
        db.prepare('ALTER TABLE montages ADD COLUMN scheduled_end_at INTEGER').run();
        console.log('Added scheduled_end_at.');
    } else {
        console.log('scheduled_end_at already exists.');
    }

    const hasGoogle = columns.some(c => c.name === 'google_event_id');
    if (!hasGoogle) {
        console.log('Adding google_event_id column...');
        db.prepare('ALTER TABLE montages ADD COLUMN google_event_id TEXT').run();
        console.log('Added google_event_id.');
    } else {
        console.log('google_event_id already exists.');
    }
    
    console.log('Migration check complete.');
} catch (e) {
    console.error('Migration failed:', e);
}
