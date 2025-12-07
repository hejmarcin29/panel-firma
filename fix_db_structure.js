const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log('🛠️ Naprawianie struktury bazy danych...');

    // 1. Tworzenie tabeli app_settings jeśli nie istnieje
    db.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER DEFAULT (strftime('%s','now') * 1000) NOT NULL,
            updated_by TEXT
        )
    `);
    console.log('✅ Tabela app_settings sprawdzona/utworzona.');

    // 2. Sprawdzenie i dodanie kolumn do tabeli products
    const columns = db.prepare("PRAGMA table_info(products)").all();
    const columnNames = columns.map(c => c.name);

    if (!columnNames.includes('is_for_montage')) {
        console.log('➕ Dodawanie kolumny is_for_montage...');
        db.exec("ALTER TABLE products ADD COLUMN is_for_montage INTEGER DEFAULT 0");
    }

    if (!columnNames.includes('montage_type')) {
        console.log('➕ Dodawanie kolumny montage_type...');
        db.exec("ALTER TABLE products ADD COLUMN montage_type TEXT");
    }

    console.log('✅ Struktura tabeli products zaktualizowana.');

} catch (error) {
    console.error('❌ Błąd podczas aktualizacji bazy:', error);
}
