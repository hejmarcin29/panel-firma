export type MontageStatusDefinition = {
	id: string;
	label: string;
	description: string;
	order: number;
    isSystem?: boolean;
    group: string;
};

export const DEFAULT_STATUSES: MontageStatusDefinition[] = [
    // 1. LEJKI (SPRZEDAŻ)
    { id: 'new_lead', label: 'Nowe Zgłoszenie', description: 'Wpadło, nikt nie dzwonił.', order: 1, group: 'Leady', isSystem: true },
    { id: 'lead_contact', label: 'W Kontakcie', description: 'Negocjacje, badanie potrzeb.', order: 2, group: 'Leady', isSystem: true },
    { id: 'lead_samples_pending', label: 'Wysłano Link', description: 'Czekamy na wybór próbek.', order: 3, group: 'Leady', isSystem: true },
    { id: 'lead_samples_sent', label: 'Próbki Wysłane', description: 'Paczka w drodze.', order: 4, group: 'Leady', isSystem: true },
    { id: 'lead_pre_estimate', label: 'Wstępna Wycena', description: 'Klient zna widełki.', order: 5, group: 'Leady', isSystem: true },

    // 2. PRZEKAZANIE (REALIZACJA START)
    { id: 'measurement_to_schedule', label: 'Do Umówienia', description: 'Zlecono pomiar, montażysta dzwoni.', order: 6, group: 'Realizacja', isSystem: true },
    { id: 'measurement_scheduled', label: 'Pomiar Umówiony', description: 'Jest data w kalendarzu.', order: 7, group: 'Realizacja', isSystem: true },

    // 2. WYCENA
    { id: 'measurement_done', label: 'Po Pomiarze', description: 'Montażysta był, ale brak wyceny.', order: 8, group: 'Wycena', isSystem: true },
    { id: 'quote_in_progress', label: 'Wycena w Toku', description: 'Liczymy, sprawdzamy dostępność.', order: 9, group: 'Wycena', isSystem: true },
    { id: 'quote_sent', label: 'Oferta Wysłana', description: 'Klient ma maila, czekamy.', order: 10, group: 'Wycena', isSystem: true },
    { id: 'quote_accepted', label: 'Oferta Zaakceptowana', description: 'Klient powiedział TAK, ale brak papierów.', order: 11, group: 'Wycena', isSystem: true },

    // 3. FORMALNOŚCI
    { id: 'contract_signed', label: 'Umowa Podpisana', description: 'Jest podpis na umowie.', order: 12, group: 'Formalności', isSystem: true },
    { id: 'waiting_for_deposit', label: 'Oczekiwanie na Zaliczkę', description: 'Faktura zaliczkowa wysłana.', order: 13, group: 'Formalności', isSystem: true },
    { id: 'deposit_paid', label: 'Zaliczka Opłacona', description: 'Kasa na koncie -> Startujemy.', order: 14, group: 'Formalności', isSystem: true },

    // 4. LOGISTYKA
    { id: 'materials_ordered', label: 'Materiały Zamówione', description: 'Poszło zamówienie do producenta.', order: 15, group: 'Logistyka', isSystem: true },
    { id: 'materials_pickup_ready', label: 'Gotowe do Odbioru', description: 'Towar czeka w magazynie/hurtowni.', order: 16, group: 'Logistyka', isSystem: true },
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

export const getStatusLabel = (statusId: string): string => {
    const status = DEFAULT_STATUSES.find(s => s.id === statusId);
    return status ? status.label : statusId;
};

export const getStatusGroup = (statusId: string): string => {
    const status = DEFAULT_STATUSES.find(s => s.id === statusId);
    return status ? status.group : 'Inne';
};
