
import 'dotenv/config';
import { db } from './src/lib/db';
import { erpCategories, erpProducts, erpMountingMethods, erpFloorPatterns } from './src/lib/db/schema';
import { eq, inArray, count } from 'drizzle-orm';

async function verify() {
    console.log("=== WERYFIKACJA MIGRACJI KATEGORII ===");

    // 1. Sprawdź czy stara kategoria "Podłogi" istnieje
    const podlogi = await db.query.erpCategories.findFirst({
        where: eq(erpCategories.name, "Podłogi")
    });

    if (podlogi) {
        console.log(`✅ Kategoria 'Podłogi' istnieje (ID: ${podlogi.id})`);
        
        // Policz produkty w tej kategorii
        const prodCount = await db.select({ count: count() })
            .from(erpProducts)
            .where(eq(erpProducts.categoryId, podlogi.id));
            
        console.log(`📊 Liczba produktów w kategorii 'Podłogi': ${prodCount[0].count}`);
    } else {
        console.error("❌ BŁĄD: Kategoria 'Podłogi' nie została utworzona!");
    }

    // 2. Sprawdź czy stare kategorie zostały usunięte
    const oldNames = [
        "Panele - Click - Klasyczne",
        "Panele - Click - Jodełka",
        "Panele - Klejone - Klasyczne",
        "Panele - Klejone - Jodełka"
    ];

    const oldCats = await db.query.erpCategories.findMany({
        where: inArray(erpCategories.name, oldNames)
    });

    if (oldCats.length === 0) {
        console.log("✅ Wszystkie stare, techniczne kategorie zostały usunięte.");
    } else {
        console.error("❌ UWAGA: Niektóre stare kategorie nadal istnieją:", oldCats.map(c => c.name));
    }

    console.log("\n=== WERYFIKACJA SŁOWNIKÓW ===");
    
    // 3. Sprawdź czy są dane w słownikach
    const methods = await db.select({ count: count() }).from(erpMountingMethods);
    const patterns = await db.select({ count: count() }).from(erpFloorPatterns);

    console.log(`Metody montażu w bazie: ${methods[0].count}`);
    console.log(`Wzory w bazie: ${patterns[0].count}`);

    if (methods[0].count > 0 && patterns[0].count > 0) {
        console.log("✅ Słowniki techniczne są wypełnione danymi.");
    } else {
        console.warn("⚠️ Ostrzeżenie: Słowniki mogą być puste.");
    }
}

verify().catch(console.error);
