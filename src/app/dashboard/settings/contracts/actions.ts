'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { contractTemplates, contracts, quotes } from '@/lib/db/schema';

import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { formatCurrency } from '@/lib/utils';

// --- TEMPLATES ---

export async function getContractTemplates() {
    await requireUser();
    return await db.query.contractTemplates.findMany({
        orderBy: [desc(contractTemplates.createdAt)],
    });
}

export async function createContractTemplate(data: { name: string; content: string; isDefault: boolean }) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    if (data.isDefault) {
        // Unset other defaults
        await db.update(contractTemplates).set({ isDefault: false });
    }

    await db.insert(contractTemplates).values({
        id: nanoid(),
        name: data.name,
        content: data.content,
        isDefault: data.isDefault,
    });

    revalidatePath('/dashboard/settings');
}

export async function updateContractTemplate(id: string, data: { name: string; content: string; isDefault: boolean }) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    if (data.isDefault) {
        await db.update(contractTemplates).set({ isDefault: false });
    }

    await db.update(contractTemplates)
        .set({
            name: data.name,
            content: data.content,
            isDefault: data.isDefault,
            updatedAt: new Date(),
        })
        .where(eq(contractTemplates.id, id));

    revalidatePath('/dashboard/settings');
}

export async function deleteContractTemplate(id: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    await db.delete(contractTemplates).where(eq(contractTemplates.id, id));
    revalidatePath('/dashboard/settings');
}

export async function resetToDefaultTemplate() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    const professionalTemplate = `
<div class="contract-header">
    <div style="text-align: center; margin-bottom: 20px;">
        {{logo_firmy}}
    </div>
    <h1>UMOWA O ROBOTY BUDOWLANE</h1>
    <div class="contract-meta">
        <p>Nr: <strong>{{numer_wyceny}}</strong></p>
        <p>Zawarta w dniu: <strong>{{data_wyceny}}</strong></p>
    </div>
</div>

<div class="contract-section">
    <h2>§1. Strony Umowy</h2>
    <div class="parties-container">
        <div class="party-box">
            <div class="party-title">Wykonawca</div>
            <p><strong>[TWOJA FIRMA]</strong></p>
            <p>[Adres Firmy]</p>
            <p>NIP: [Twój NIP]</p>
            <p>Reprezentowany przez: [Właściciel]</p>
        </div>
        <div class="party-box">
            <div class="party-title">Zamawiający</div>
            <p><strong>{{klient_nazwa}}</strong></p>
            <p>{{klient_adres}}</p>
        </div>
    </div>
</div>

<div class="contract-section">
    <h2>§2. Przedmiot Umowy</h2>
    <p>1. Przedmiotem niniejszej umowy jest wykonanie przez Wykonawcę na rzecz Zamawiającego prac remontowo-budowlanych zgodnie z załączoną ofertą nr {{numer_wyceny}}.</p>
    <p>2. Szczegółowy zakres prac oraz wykaz materiałów znajduje się w ofercie stanowiącej integralną część niniejszej umowy.</p>
    <p>3. Prace zostaną wykonane w lokalu pod adresem: <strong>{{klient_adres}}</strong>.</p>
</div>

<div class="contract-section">
    <h2>§3. Termin Realizacji</h2>
    <p>1. Rozpoczęcie prac nastąpi w dniu: <strong>{{data_rozpoczecia}}</strong>.</p>
    <p>2. Przewidywany termin zakończenia prac: <strong>{{termin_zakonczenia}}</strong>.</p>
    <p>3. Termin może ulec zmianie w przypadku wystąpienia okoliczności niezależnych od Wykonawcy lub zlecenia prac dodatkowych.</p>
</div>

<div class="contract-section">
    <h2>§4. Wynagrodzenie i Płatności</h2>
    <p>1. Całkowite wynagrodzenie ryczałtowe za wykonanie przedmiotu umowy wynosi: <strong>{{kwota_brutto}}</strong> brutto.</p>
    <p>2. Zamawiający wpłacił zadatek w wysokości: <strong>{{kwota_zaliczki}}</strong>.</p>
    <p>3. Pozostała część wynagrodzenia płatna będzie po zakończeniu prac i odbiorze końcowym.</p>
</div>

<div class="contract-section">
    <h2>§5. Postanowienia Końcowe</h2>
    <p>1. W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu Cywilnego.</p>
    <p>2. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron.</p>
</div>

<div class="signatures-section">
    <div class="signature-box">
        <div class="signature-image">
            {{podpis_wykonawcy}}
        </div>
        <div class="signature-line">Wykonawca</div>
    </div>
    <div class="signature-box">
        <div class="signature-image">
            <!-- Miejsce na podpis klienta -->
        </div>
        <div class="signature-line">Zamawiający</div>
    </div>
</div>
`;

    // Unset other defaults
    await db.update(contractTemplates).set({ isDefault: false });

    await db.insert(contractTemplates).values({
        id: nanoid(),
        name: 'Umowa Profesjonalna (A4)',
        content: professionalTemplate,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath('/dashboard/settings');
}

// --- CONTRACTS ---

export async function getContractForQuote(quoteId: string) {
    await requireUser();
    return await db.query.contracts.findFirst({
        where: eq(contracts.quoteId, quoteId),
    });
}

export async function generateContract(quoteId: string, templateId: string, variables: Record<string, string> = {}) {
    await requireUser();
    
    const template = await db.query.contractTemplates.findFirst({
        where: eq(contractTemplates.id, templateId),
    });

    if (!template) throw new Error('Szablon nie istnieje');

    // Fetch context data
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
            montage: {
                with: {
                    customer: true
                }
            }
        }
    });

    if (!quote) throw new Error('Wycena nie istnieje');

    // Fetch logo
    const logoUrl = await getAppSetting(appSettingKeys.companyLogoUrl);
    const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 80px; max-width: 200px;" />` : '';

    // Generate Items Table
    const itemsHtml = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #ddd;">
                <th style="padding: 10px; text-align: left;">Nazwa</th>
                <th style="padding: 10px; text-align: right;">Ilość</th>
                <th style="padding: 10px; text-align: right;">Cena netto</th>
                <th style="padding: 10px; text-align: right;">VAT</th>
                <th style="padding: 10px; text-align: right;">Wartość brutto</th>
            </tr>
        </thead>
        <tbody>
            ${quote.items.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px;">${item.name}</td>
                    <td style="padding: 8px; text-align: right;">${item.quantity} ${item.unit}</td>
                    <td style="padding: 8px; text-align: right;">${formatCurrency(item.priceNet)}</td>
                    <td style="padding: 8px; text-align: right;">${item.vatRate * 100}%</td>
                    <td style="padding: 8px; text-align: right;">${formatCurrency(item.totalGross)}</td>
                </tr>
            `).join('')}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Suma Netto:</td>
                <td style="padding: 10px; text-align: right;">${formatCurrency(quote.totalNet)}</td>
            </tr>
            <tr>
                <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Suma Brutto:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(quote.totalGross)}</td>
            </tr>
        </tfoot>
    </table>`;

    // Replace placeholders
    let content = template.content;
    
    // System variables
    const systemVariables: Record<string, string> = {
        '{{klient_nazwa}}': quote.montage.clientName,
        '{{klient_adres}}': quote.montage.address || '',
        '{{klient_email}}': quote.montage.contactEmail || '',
        '{{klient_telefon}}': quote.montage.contactPhone || '',
        '{{numer_wyceny}}': quote.number || '',
        '{{data_wyceny}}': quote.createdAt.toLocaleDateString('pl-PL'),
        '{{kwota_netto}}': (quote.totalNet / 100).toFixed(2),
        '{{kwota_brutto}}': (quote.totalGross / 100).toFixed(2),
        '{{adres_montazu}}': quote.montage.installationAddress || quote.montage.address || '',
        '{{logo_firmy}}': logoHtml,
        '{{tabela_produktow}}': itemsHtml,
        '{{uwagi_wyceny}}': quote.notes || '',
    };

    // Merge system and user variables
    const allVariables = { ...systemVariables, ...variables };

    for (const [key, value] of Object.entries(allVariables)) {
        content = content.replace(new RegExp(key, 'g'), value);
    }

    // Create or Update Contract
    const existingContract = await db.query.contracts.findFirst({
        where: eq(contracts.quoteId, quoteId),
    });

    if (existingContract) {
        await db.update(contracts).set({
            templateId,
            content,
            variables,
            status: 'draft',
            updatedAt: new Date(),
        }).where(eq(contracts.id, existingContract.id));
    } else {
        await db.insert(contracts).values({
            id: nanoid(),
            quoteId,
            templateId,
            content,
            variables,
            status: 'draft',
        });
    }

    revalidatePath(`/dashboard/oferty/${quoteId}`);
}

export async function updateContractContent(contractId: string, content: string) {
    await requireUser();
    
    await db.update(contracts)
        .set({ content, updatedAt: new Date() })
        .where(eq(contracts.id, contractId));
        
    revalidatePath('/dashboard/oferty');
}

export async function sendContract(contractId: string) {
    await requireUser();
    
    await db.update(contracts)
        .set({ status: 'sent', updatedAt: new Date() })
        .where(eq(contracts.id, contractId));

    // Here we would trigger email sending logic
    
    revalidatePath('/dashboard/oferty');
}
