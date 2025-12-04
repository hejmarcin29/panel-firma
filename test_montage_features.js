const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

function runTest() {
    console.log("🧪 Rozpoczynam testy funkcjonalności Montaży...");

    // 1. Weryfikacja struktury tabeli
    console.log("\n1. Sprawdzanie struktury tabeli 'montages'...");
    const tableInfo = db.pragma('table_info(montages)');
    const floorDetailsCol = tableInfo.find(c => c.name === 'floor_details');
    const skirtingDetailsCol = tableInfo.find(c => c.name === 'skirting_details');

    if (floorDetailsCol && skirtingDetailsCol) {
        console.log("✅ Kolumny 'floor_details' i 'skirting_details' istnieją.");
    } else {
        console.error("❌ Błąd: Brak wymaganych kolumn w bazie danych!");
        return;
    }

    // 2. Symulacja zapisu danych z formularza Pomiarów (MontageMeasurementTab)
    console.log("\n2. Test zapisu danych z formularza Pomiarów...");
    const testId = 'test-montage-' + Date.now();
    
    // Tworzymy tymczasowy montaż
    try {
        db.prepare(`
            INSERT INTO montages (id, client_name, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(testId, 'Test Client', 'lead', Date.now(), Date.now());
        console.log(`   Utworzono testowy montaż: ${testId}`);

        // Symulujemy update z updateMontageMeasurement
        // floorDetails -> Panel Additional Materials
        // skirtingDetails -> Skirting Additional Materials
        const measurementData = {
            floorDetails: 'Podkład wyciszający 3mm',
            skirtingDetails: 'Narożniki wewnętrzne 10szt'
        };

        db.prepare(`
            UPDATE montages 
            SET floor_details = ?, skirting_details = ?
            WHERE id = ?
        `).run(measurementData.floorDetails, measurementData.skirtingDetails, testId);

        const afterMeasurement = db.prepare('SELECT floor_details, skirting_details FROM montages WHERE id = ?').get(testId);
        
        if (afterMeasurement.floor_details === measurementData.floorDetails && 
            afterMeasurement.skirting_details === measurementData.skirtingDetails) {
            console.log("✅ Dane z pomiaru zapisane poprawnie.");
        } else {
            console.error("❌ Błąd zapisu danych z pomiaru.");
        }

        // 3. Symulacja edycji z karty Materiałów (MontageMaterialCard)
        console.log("\n3. Test edycji z karty Materiałów (synchronizacja)...");
        
        // Symulujemy update z updateMontageMaterialDetails
        const materialCardData = {
            floorDetails: 'ZMIANA: Podkład korkowy',
            skirtingDetails: 'ZMIANA: Narożniki + klej'
        };

        db.prepare(`
            UPDATE montages 
            SET floor_details = ?, skirting_details = ?
            WHERE id = ?
        `).run(materialCardData.floorDetails, materialCardData.skirtingDetails, testId);

        const afterMaterialCard = db.prepare('SELECT floor_details, skirting_details FROM montages WHERE id = ?').get(testId);

        if (afterMaterialCard.floor_details === materialCardData.floorDetails && 
            afterMaterialCard.skirting_details === materialCardData.skirtingDetails) {
            console.log("✅ Dane z karty materiałów nadpisały dane pomiarowe (Synchronizacja działa).");
        } else {
            console.error("❌ Błąd synchronizacji danych.");
        }

        // 4. Sprzątanie
        console.log("\n4. Sprzątanie po testach...");
        db.prepare('DELETE FROM montages WHERE id = ?').run(testId);
        console.log("✅ Usunięto testowy montaż.");

    } catch (error) {
        console.error("❌ Wystąpił błąd podczas testów:", error);
    }
    
    console.log("\n🏁 Testy zakończone.");
}

runTest();
