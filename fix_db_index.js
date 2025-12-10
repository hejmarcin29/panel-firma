/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log('Attempting to drop index customers_email_idx...');
    db.exec('DROP INDEX IF EXISTS customers_email_idx');
    console.log('Index customers_email_idx dropped successfully (if it existed).');
} catch (error) {
    console.error('Error dropping index:', error);
}

try {
    console.log('Attempting to drop index customers_tax_id_idx...');
    db.exec('DROP INDEX IF EXISTS customers_tax_id_idx');
    console.log('Index customers_tax_id_idx dropped successfully (if it existed).');
} catch (error) {
    console.error('Error dropping index:', error);
}

console.log('Fix script completed.');
