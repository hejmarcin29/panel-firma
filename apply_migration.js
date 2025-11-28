const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const sql = `
CREATE TABLE IF NOT EXISTS system_logs (
	id text PRIMARY KEY NOT NULL,
	user_id text,
	action text NOT NULL,
	details text,
	ip_address text,
	user_agent text,
	created_at integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE set null
);
CREATE INDEX IF NOT EXISTS system_logs_user_id_idx ON system_logs (user_id);
CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON system_logs (created_at);
`;

try {
    db.exec(sql);
    console.log('Migration applied successfully.');
} catch (error) {
    console.error('Error applying migration:', error);
}
