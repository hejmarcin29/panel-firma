const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    db.prepare("ALTER TABLE montages ADD COLUMN material_claim_type text").run();
    console.log("Column added successfully");
} catch (error) {
    if (error.message.includes("duplicate column name")) {
        console.log("Column already exists");
    } else {
        console.error("Error adding column:", error);
    }
}
