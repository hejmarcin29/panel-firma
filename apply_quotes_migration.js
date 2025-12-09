/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS quotes (
            id text PRIMARY KEY NOT NULL,
            montage_id text NOT NULL,
            status text DEFAULT 'draft' NOT NULL,
            items text DEFAULT '[]' NOT NULL,
            total_net integer DEFAULT 0 NOT NULL,
            total_gross integer DEFAULT 0 NOT NULL,
            valid_until integer,
            notes text,
            created_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
            updated_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
            FOREIGN KEY (montage_id) REFERENCES montages(id) ON UPDATE no action ON DELETE cascade
        );
        CREATE INDEX IF NOT EXISTS quotes_montage_id_idx ON quotes (montage_id);
        CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes (status);
    `);
    console.log('Quotes table created successfully.');
} catch (error) {
    console.error('Error creating quotes table:', error);
}
