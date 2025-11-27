const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
  console.log('Adding measurement columns to montages...');
  
  const columns = [
    'measurement_details text',
    'panel_type text',
    'additional_info text',
    'forecasted_installation_date integer'
  ];

  for (const col of columns) {
    try {
      db.exec(`ALTER TABLE montages ADD COLUMN ${col}`);
      console.log(`Column ${col.split(' ')[0]} added.`);
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log(`Column ${col.split(' ')[0]} already exists.`);
      } else {
        throw e;
      }
    }
  }

} catch (error) {
  console.error('Migration failed:', error);
} finally {
  db.close();
}
