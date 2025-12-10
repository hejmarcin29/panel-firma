const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    const info = db.pragma('table_info(montages)');
    const columns = info.map(c => c.name);
    console.log('Columns in montages:', columns);
    
    if (columns.includes('scheduled_skirting_installation_at')) {
        console.log('Column scheduled_skirting_installation_at EXISTS');
    } else {
        console.log('Column scheduled_skirting_installation_at MISSING');
    }
} catch (error) {
    console.error('Error:', error);
}
