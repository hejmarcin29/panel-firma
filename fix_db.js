/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

function addColumn(table, column, definition) {
    try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
        console.log(`Added ${column} to ${table}`);
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log(`${column} already exists in ${table}`);
        } else {
            console.error(`Failed to add ${column} to ${table}:`, e.message);
        }
    }
}

function dropIndex(indexName) {
    try {
        db.prepare(`DROP INDEX IF EXISTS ${indexName}`).run();
        console.log(`Dropped index ${indexName} (to allow recreation)`);
    } catch (e) {
        console.error(`Failed to drop index ${indexName}:`, e.message);
    }
}

console.log('Starting manual schema patch...');

// Drop problematic indexes that cause drizzle-kit push to fail
// Drizzle-kit push tries to create them even if they exist, so we drop them first
dropIndex('users_email_idx');
dropIndex('mail_messages_message_id_idx');
dropIndex('montages_display_id_idx');

// Users table updates
addColumn('users', 'role', "text DEFAULT 'admin' NOT NULL");
addColumn('users', 'is_active', "integer DEFAULT 1 NOT NULL"); // SQLite uses 1 for true
addColumn('users', 'dashboard_config', "text");
addColumn('users', 'mobile_menu_config', "text");

// Montages table updates
addColumn('montages', 'installer_id', "text REFERENCES users(id)");
addColumn('montages', 'measurer_id', "text REFERENCES users(id)");

console.log('Database schema patched manually.');
