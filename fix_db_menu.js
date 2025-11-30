const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    db.prepare("ALTER TABLE users ADD COLUMN mobile_menu_config text").run();
    console.log("Successfully added mobile_menu_config column");
} catch (error) {
    console.error("Error adding column:", error.message);
}
