const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const sql = `
ALTER TABLE montages ADD COLUMN billing_postal_code text;
ALTER TABLE montages ADD COLUMN installation_postal_code text;
ALTER TABLE montages ADD COLUMN is_company integer DEFAULT 0 NOT NULL;
ALTER TABLE montages ADD COLUMN company_name text;
ALTER TABLE montages ADD COLUMN nip text;
`;

try {
    db.exec(sql);
    console.log('Migration applied successfully');
} catch (error) {
    console.error('Migration failed:', error);
}
