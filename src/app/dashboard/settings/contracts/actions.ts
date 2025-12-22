'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { contractTemplates, quotes } from '@/lib/db/schema';

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
<style>
    .contract-container {
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.6;
        color: #000;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
    }
    .contract-header {
        text-align: center;
        margin-bottom: 40px;
        border-bottom: 2px solid #000;
        padding-bottom: 20px;
    }
    .contract-header h1 {
        font-size: 24px;
        text-transform: uppercase;
        margin: 10px 0;
        letter-spacing: 1px;
    }
    .contract-meta {
        font-size: 14px;
        color: #444;
    }
    .contract-section {
        margin-bottom: 30px;
    }
    .contract-section h2 {
        font-size: 16px;
        text-transform: uppercase;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
        margin-bottom: 15px;
        background-color: #f9f9f9;
        padding: 5px 10px;
    }
    .parties-container {
        display: flex;
        justify-content: space-between;
        gap: 40px;
        margin-bottom: 20px;
    }
    .party-box {
        flex: 1;
        background: #fcfcfc;
        padding: 15px;
        border: 1px solid #eee;
    }
    .party-title {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 12px;
        color: #666;
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
    }
    .signatures-section {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        page-break-inside: avoid;
    }
    .signature-box {
        width: 40%;
        text-align: center;
    }
    .signature-line {
        border-top: 1px solid #000;
        padding-top: 5px;
        font-weight: bold;
    }
    .signature-image img {
        max-height: 60px;
        margin-bottom: -10px;
    }
    p {
        margin: 5px 0;
        text-align: justify;
    }
    ul, ol {
        margin: 5px 0;
        padding-left: 20px;
    }
    li {
        margin-bottom: 5px;
    }
</style>

<div class="contract-container">
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
                <p><strong>{{firma_nazwa}}</strong></p>
                <p>{{firma_adres}}</p>
                <p>NIP: {{firma_nip}}</p>
                <p>Bank: {{firma_bank}}</p>
                <p>Konto: {{firma_konto}}</p>
            </div>
            <div class="party-box">
                <div class="party-title">Zamawiający</div>
                <p><strong>{{klient_nazwa}}</strong></p>
                <p>{{klient_adres}}</p>
                <p>Tel: {{klient_telefon}}</p>
                <p>Email: {{klient_email}}</p>
            </div>
        </div>
    </div>

    <div class="contract-section">
        <h2>§2. Przedmiot Umowy</h2>
        <p>1. Przedmiotem niniejszej umowy jest wykonanie przez Wykonawcę na rzecz Zamawiającego prac remontowo-budowlanych zgodnie z załączoną ofertą nr {{numer_wyceny}}.</p>
        <p>2. Szczegółowy zakres prac oraz wykaz materiałów znajduje się w poniższej tabeli, która stanowi integralną część niniejszej umowy.</p>
        <p>3. Prace zostaną wykonane w lokalu pod adresem: <strong>{{adres_montazu}}</strong>.</p>
        {{oswiadczenie_vat}}
        
        <div style="margin-top: 20px;">
            {{tabela_produktow}}
        </div>
    </div>

    <div class="contract-section">
        <h2>§3. Termin Realizacji</h2>
        <p>1. Rozpoczęcie prac nastąpi w dniu: <strong>{{data_rozpoczecia}}</strong>.</p>
        <p>2. Przewidywany termin zakończenia prac: <strong>{{termin_zakonczenia}}</strong>.</p>
        <p>3. Termin może ulec zmianie w przypadku wystąpienia okoliczności niezależnych od Wykonawcy lub zlecenia prac dodatkowych.</p>
        {{opis_terminow_listew}}
    </div>

    <div class="contract-section">
        <h2>§4. Wynagrodzenie i Płatności</h2>
        <p>1. Całkowite wynagrodzenie ryczałtowe za wykonanie przedmiotu umowy wynosi: <strong>{{kwota_brutto}}</strong> brutto.</p>
        <p>2. Zamawiający wpłacił zadatek w wysokości: <strong>{{kwota_zaliczki}}</strong>.</p>
        <p>3. Pozostała część wynagrodzenia płatna będzie po zakończeniu prac i odbiorze końcowym.</p>
        <p>4. Płatności należy dokonywać na rachunek bankowy Wykonawcy wskazany w §1.</p>
    </div>

    <div class="contract-section">
        <h2>§5. Postanowienia Końcowe</h2>
        <p>1. W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu Cywilnego.</p>
        <p>2. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron.</p>
        <p>3. Wszelkie zmiany niniejszej umowy wymagają formy pisemnej pod rygorem nieważności.</p>
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

// --- RENDERER ---

export async function renderTemplate(templateId: string, quoteId: string) {
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

    // Fetch settings
    const [
        logoUrl,
        companyName,
        companyAddress,
        companyNip,
        companyBankName,
        companyBankAccount
    ] = await Promise.all([
        getAppSetting(appSettingKeys.companyLogoUrl),
        getAppSetting(appSettingKeys.companyName),
        getAppSetting(appSettingKeys.companyAddress),
        getAppSetting(appSettingKeys.companyNip),
        getAppSetting(appSettingKeys.companyBankName),
        getAppSetting(appSettingKeys.companyBankAccount),
    ]);

    const logoHtml = logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 80px; max-width: 200px;" />` : '';

    // Generate Items Table
    const itemsHtml = `
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; border: 1px solid #ddd;">
        <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #ddd;">
                <th style="padding: 8px; text-align: left;">Nazwa</th>
                <th style="padding: 8px; text-align: right;">Ilość</th>
                <th style="padding: 8px; text-align: right;">Cena netto</th>
                <th style="padding: 8px; text-align: right;">VAT</th>
                <th style="padding: 8px; text-align: right;">Wartość brutto</th>
            </tr>
        </thead>
        <tbody>
            ${quote.items.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 6px 8px;">${item.name}</td>
                    <td style="padding: 6px 8px; text-align: right;">${item.quantity} ${item.unit}</td>
                    <td style="padding: 6px 8px; text-align: right;">${formatCurrency(item.priceNet)}</td>
                    <td style="padding: 6px 8px; text-align: right;">${item.vatRate * 100}%</td>
                    <td style="padding: 6px 8px; text-align: right;">${formatCurrency(item.totalGross)}</td>
                </tr>
            `).join('')}
        </tbody>
        <tfoot>
            <tr style="background-color: #fcfcfc;">
                <td colspan="4" style="padding: 8px; text-align: right; font-weight: bold;">Suma Netto:</td>
                <td style="padding: 8px; text-align: right;">${formatCurrency(quote.totalNet)}</td>
            </tr>
            <tr style="background-color: #f0f0f0;">
                <td colspan="4" style="padding: 8px; text-align: right; font-weight: bold;">Suma Brutto:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(quote.totalGross)}</td>
            </tr>
        </tfoot>
    </table>`;

    // Replace placeholders
    let content = template.content;
    
    // Housing VAT clause
    let housingVatClause = '';
    if (quote.montage.isHousingVat) {
        housingVatClause = `<p>4. Zamawiający oświadcza, że lokal mieszkalny, w którym wykonywana jest usługa, spełnia warunki art. 41 ust. 12 ustawy o VAT (powierzchnia użytkowa nie przekracza 150 m² dla lokalu mieszkalnego lub 300 m² dla domu jednorodzinnego) i jest zaliczany do budownictwa objętego społecznym programem mieszkaniowym.</p>`;
    }

    // System variables
    const systemVariables: Record<string, string> = {
        '{{klient_nazwa}}': quote.montage.clientName,
        '{{klient_adres}}': quote.montage.address || '',
        '{{klient_email}}': quote.montage.contactEmail || '',
        '{{klient_telefon}}': quote.montage.contactPhone || '',
        '{{numer_wyceny}}': quote.number || '',
        '{{data_wyceny}}': quote.createdAt.toLocaleDateString('pl-PL'),
        '{{kwota_netto}}': formatCurrency(quote.totalNet),
        '{{kwota_brutto}}': formatCurrency(quote.totalGross),
        '{{adres_montazu}}': quote.montage.installationAddress || quote.montage.address || '',
        '{{data_rozpoczecia}}': quote.montage.scheduledInstallationAt ? quote.montage.scheduledInstallationAt.toLocaleDateString('pl-PL') : 'Do ustalenia',
        '{{termin_zakonczenia}}': quote.montage.scheduledInstallationEndAt ? quote.montage.scheduledInstallationEndAt.toLocaleDateString('pl-PL') : 'Do ustalenia',
        '{{oswiadczenie_vat}}': housingVatClause,
        '{{logo_firmy}}': logoHtml,
        '{{tabela_produktow}}': itemsHtml,
        '{{uwagi_wyceny}}': quote.notes || '',
        
        // Company Details
        '{{firma_nazwa}}': companyName || '[Nazwa Firmy]',
        '{{firma_adres}}': companyAddress || '[Adres Firmy]',
        '{{firma_nip}}': companyNip || '[NIP]',
        '{{firma_bank}}': companyBankName || '[Bank]',
        '{{firma_konto}}': companyBankAccount || '[Nr Konta]',
    };

    for (const [key, value] of Object.entries(systemVariables)) {
        content = content.replace(new RegExp(key, 'g'), value);
    }

    return content;
}