import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';

export type MontageStatusDefinition = {
	id: string;
	label: string;
	description: string;
	order: number;
    isSystem?: boolean;
    group: string;
};

const DEFAULT_STATUSES: MontageStatusDefinition[] = [
    // 1. LEJKI
    { id: 'new_lead', label: 'Nowe Zgłoszenie', description: 'Wpadło, nikt nie dzwonił.', order: 1, group: 'Lejki', isSystem: true },
    { id: 'contact_attempt', label: 'Próba Kontaktu', description: 'Dzwoniłem, nie odbiera.', order: 2, group: 'Lejki', isSystem: true },
    { id: 'contact_established', label: 'Kontakt Nawiązany', description: 'Rozmawialiśmy, ustalamy co dalej.', order: 3, group: 'Lejki', isSystem: true },
    { id: 'measurement_scheduled', label: 'Pomiar Umówiony', description: 'Jest data w kalendarzu.', order: 4, group: 'Lejki', isSystem: true },

    // 2. WYCENA
    { id: 'measurement_done', label: 'Po Pomiarze', description: 'Montażysta był, ale brak wyceny.', order: 5, group: 'Wycena', isSystem: true },
    { id: 'quote_in_progress', label: 'Wycena w Toku', description: 'Liczymy, sprawdzamy dostępność.', order: 6, group: 'Wycena', isSystem: true },
    { id: 'quote_sent', label: 'Oferta Wysłana', description: 'Klient ma maila, czekamy.', order: 7, group: 'Wycena', isSystem: true },
    { id: 'quote_accepted', label: 'Oferta Zaakceptowana', description: 'Klient powiedział TAK, ale brak papierów.', order: 8, group: 'Wycena', isSystem: true },

    // 3. FORMALNOŚCI
    { id: 'contract_signed', label: 'Umowa Podpisana', description: 'Jest podpis na umowie.', order: 9, group: 'Formalności', isSystem: true },
    { id: 'waiting_for_deposit', label: 'Oczekiwanie na Zaliczkę', description: 'Faktura zaliczkowa wysłana.', order: 10, group: 'Formalności', isSystem: true },
    { id: 'deposit_paid', label: 'Zaliczka Opłacona', description: 'Kasa na koncie -> Startujemy.', order: 11, group: 'Formalności', isSystem: true },

    // 4. LOGISTYKA
    { id: 'materials_ordered', label: 'Materiały Zamówione', description: 'Poszło zamówienie do producenta.', order: 12, group: 'Logistyka', isSystem: true },
    { id: 'materials_pickup_ready', label: 'Gotowe do Odbioru', description: 'Towar czeka w magazynie/hurtowni.', order: 13, group: 'Logistyka', isSystem: true },
    { id: 'installation_scheduled', label: 'Montaż Zaplanowany', description: 'Ekipa ma termin startu.', order: 14, group: 'Logistyka', isSystem: true },
    { id: 'materials_delivered', label: 'Materiały u Klienta', description: 'Towar dostarczony na budowę.', order: 15, group: 'Logistyka', isSystem: true },

    // 5. REALIZACJA
    { id: 'installation_in_progress', label: 'Montaż w Toku', description: 'Prace trwają.', order: 16, group: 'Realizacja', isSystem: true },
    { id: 'protocol_signed', label: 'Protokół Podpisany', description: 'Koniec prac, odbiór techniczny.', order: 17, group: 'Realizacja', isSystem: true },

    // 6. FINISZ
    { id: 'final_invoice_issued', label: 'Faktura Końcowa', description: 'Wystawiona, wysłana.', order: 18, group: 'Finisz', isSystem: true },
    { id: 'final_settlement', label: 'Rozliczenie Końcowe', description: 'Czekamy na dopłatę.', order: 19, group: 'Finisz', isSystem: true },
    { id: 'completed', label: 'Zakończone', description: 'Wszystko na czysto, archiwum.', order: 20, group: 'Finisz', isSystem: true },

    // 7. STANY SPECJALNE
    { id: 'on_hold', label: 'Wstrzymane', description: 'Klient buduje dom, wróci za pół roku.', order: 21, group: 'Specjalne', isSystem: true },
    { id: 'rejected', label: 'Odrzucone', description: 'Za drogo / konkurencja.', order: 22, group: 'Specjalne', isSystem: true },
    { id: 'complaint', label: 'Reklamacja', description: 'Coś poszło nie tak po montażu.', order: 23, group: 'Specjalne', isSystem: true },
];

export async function getMontageStatusDefinitions(): Promise<MontageStatusDefinition[]> {
	const rawValue = await getAppSetting(appSettingKeys.montageStatuses);
	if (!rawValue) {
		return DEFAULT_STATUSES;
	}

	try {
		const parsed = JSON.parse(rawValue) as unknown;
		if (!Array.isArray(parsed)) {
			return DEFAULT_STATUSES;
		}

		const statuses: MontageStatusDefinition[] = [];
		for (const item of parsed) {
			if (
				typeof item === 'object' &&
				item !== null &&
				'id' in item &&
				'label' in item &&
				'description' in item &&
				typeof item.id === 'string' &&
				typeof item.label === 'string' &&
				typeof item.description === 'string'
			) {
				statuses.push({
					id: item.id,
					label: item.label,
					description: item.description,
					order: typeof item.order === 'number' ? item.order : 0,
                    isSystem: Boolean(item.isSystem),
                    group: typeof item.group === 'string' ? item.group : 'LEJKI',
				});
			}
		}
        
        if (statuses.length === 0) {
            return DEFAULT_STATUSES;
        }

		return statuses.sort((a, b) => a.order - b.order);
	} catch {
		return DEFAULT_STATUSES;
	}
}

export async function setMontageStatusDefinitions(statuses: MontageStatusDefinition[], userId: string): Promise<void> {
    // Ensure IDs are unique and valid
    const sanitized = statuses.map((s, index) => ({
        ...s,
        id: s.id.trim() || crypto.randomUUID(),
        label: s.label.trim(),
        order: index
    })).filter(s => s.label.length > 0);

    if (sanitized.length === 0) {
        throw new Error("Lista statusów nie może być pusta.");
    }

	await setAppSetting({
		key: appSettingKeys.montageStatuses,
		value: JSON.stringify(sanitized),
		userId,
	});
}
