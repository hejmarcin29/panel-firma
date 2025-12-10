/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const sql1 = `
ALTER TABLE \`users\` ADD \`architect_profile\` text;
ALTER TABLE \`customers\` ADD \`architect_id\` text REFERENCES \`users\`(\`id\`) ON DELETE SET NULL;
CREATE TABLE \`commissions\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`architect_id\` text NOT NULL REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
	\`montage_id\` text NOT NULL REFERENCES \`montages\`(\`id\`) ON DELETE CASCADE,
	\`amount\` integer NOT NULL,
	\`rate\` real NOT NULL,
	\`area\` real NOT NULL,
	\`status\` text DEFAULT 'pending' NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	\`approved_at\` integer,
	\`paid_at\` integer
);
CREATE INDEX \`commissions_architect_id_idx\` ON \`commissions\` (\`architect_id\`);
CREATE INDEX \`commissions_montage_id_idx\` ON \`commissions\` (\`montage_id\`);
CREATE INDEX \`commissions_status_idx\` ON \`commissions\` (\`status\`);
`;

const sql2 = `
ALTER TABLE \`montages\` ADD \`architect_id\` text REFERENCES \`users\`(\`id\`) ON DELETE SET NULL;
CREATE INDEX \`montages_architect_id_idx\` ON \`montages\` (\`architect_id\`);
`;

try {
    db.exec(sql1);
    console.log('Applied 0051_architect_module.sql');
    db.exec(sql2);
    console.log('Applied 0052_add_architect_to_montages.sql');
} catch (e) {
    console.error('Error applying migrations:', e.message);
}
