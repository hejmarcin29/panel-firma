'use server';

import { db } from "@/lib/db";
import { montages } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { getShopConfig } from "@/app/dashboard/settings/shop/actions";

type EstimationResult = {
    laborPrice: number;
    chemistryPrice: number;
    totalNet: number;
    totalGross8: number; // Z montażem
    totalGross23: number; // Bez montażu (dla porównania oszczędności)
    vatSavings: number;
    priceRange: {
        min: number;
        max: number;
    };
};

export async function calculateMontageEstimation(
    area: number, 
    mountingMethod: string | null, 
    floorPattern: string | null,
    productPriceGross: number // Cena materiału brutto 23%
): Promise<EstimationResult> {
    
    // 0. Pobierz konfigurację ze sklepu
    const config = await getShopConfig();
    const ratesConfig = config.calculatorRates || {
        glue_herringbone: { labor: 65, chemistry: 25 },
        click_herringbone: { labor: 45, chemistry: 5 },
        glue_plank: { labor: 55, chemistry: 25 },
        click_plank: { labor: 35, chemistry: 5 },
    };

    // 1. Znajdź stawkę
    // Normalizujemy inputy (bo w bazie mogą być różne wielkości liter)
    const method = mountingMethod?.toLowerCase() || ''; // click, glue
    const pattern = floorPattern?.toLowerCase() || ''; // plank, herringbone

    let rates = { labor: 40, chemistry: 15 }; // Fallback

    const isHerringbone = pattern.includes('herringbone') || pattern.includes('jod');
    const isGlue = method.includes('glue') || method.includes('klej');

    if (isHerringbone) {
        if (isGlue) rates = ratesConfig.glue_herringbone;
        else rates = ratesConfig.click_herringbone;
    } else {
        // Plank / Classic
        if (isGlue) rates = ratesConfig.glue_plank;
        else rates = ratesConfig.click_plank;
    }

    const laborCostPerM2 = rates.labor;
    const chemistryCostPerM2 = rates.chemistry;

    // 2. Policz materiał w stawce 8%
    // productPriceGross to cena z 23% VAT. Musimy odzyskać netto.
    const productPriceNet = productPriceGross / 1.23;
    
    // 3. Sumuj koszty (na 1 m2)
    const totalMaterialNet = productPriceNet + chemistryCostPerM2;
    const totalLaborNet = laborCostPerM2;
    
    const costPerM2Net = totalMaterialNet + totalLaborNet;
    
    // Całość dla podanej powierzchni
    const totalNet = costPerM2Net * area;
    const totalGross8 = totalNet * 1.08;

    // 4. Policz scenariusz alternatywny (Sam towar 23%)
    // Sam towar + chemia (klient sam kupuje klej z 23% VAT)
    const chemistryGross23 = chemistryCostPerM2 * 1.23;
    // Zakładamy, że klient sam sobie montuje = 0 zł robocizna, ale płaci droższy VAT za materiały
    const totalGross23 = (productPriceGross + chemistryGross23) * area; 

    // Oszczędność to różnica między tym co by zapłacił w sklepie, a tym co płaci u nas z usługą
    // Uwaga: To jest uproszczone. W praktyce porównujemy "Cena rynkowa usługi + Twój materiał 23%" vs "Twoja usługa 8% + Twój materiał 8%"
    // Ale marketingowo: Porównujemy VAT na samym materiale.
    const vatSavings = (productPriceNet * area * 0.23) - (productPriceNet * area * 0.08);

    // Range +/- 10%
    const min = Math.floor(totalGross8 * 0.95 / 100) * 100; // Zaokrąglamy do setek w dół
    const max = Math.ceil(totalGross8 * 1.1 / 100) * 100;   // Zaokrąglamy do setek w górę

    return {
        laborPrice: laborCostPerM2,
        chemistryPrice: chemistryCostPerM2,
        totalNet,
        totalGross8,
        totalGross23,
        vatSavings,
        priceRange: { min, max }
    };
}

export async function submitMontageLead(data: {
    clientName: string;
    clientPhone: string;
    productName: string;
    floorArea: number;
    postalCode: string;
    estimatedPrice: number;
}) {
    // 1. Walidacja
    if (!data.clientPhone) return { success: false, message: "Numer telefonu wymagany" };

    // 2. Zapis w bazie
    try {
        await db.insert(montages).values({
            id: crypto.randomUUID(),
            clientName: data.clientName,
            contactPhone: data.clientPhone,
            installationAddress: data.postalCode, // Tymczasowo w polu adresu
            status: 'new_lead',
            estimatedFloorArea: data.floorArea,
            additionalInfo: `LEAD Z KALKULATORA:
            Produkt: ${data.productName}
            Szacowana kwota: ~${Math.round(data.estimatedPrice)} zł
            Kod pocztowy: ${data.postalCode}`,
            createdAt: new Date(),
        });

        revalidatePath('/dashboard/crm/montaze');
        return { success: true, message: "Zgłoszenie przyjęte" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Błąd bazy danych" };
    }
}
