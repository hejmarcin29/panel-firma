import { montageStatuses, type MontageStatus } from '@/lib/db/schema';

import type { StatusOption } from './types';

type StatusLabelConfig = {
	label: string;
	description: string;
};

export const statusLabels: Record<MontageStatus, StatusLabelConfig> = {
    // 1. LEJKI (SPRZEDAŻ)
    new_lead: { label: 'Nowe Zgłoszenie', description: 'Klient czeka na pierwszy kontakt' },
    lead_contact: { label: 'W Kontakcie', description: 'Negocjacje w toku / Ustalanie potrzeb' },
    lead_payment_pending: { label: 'Oczekuje na Płatność', description: 'Czekamy na opłatę weryfikacyjną' },
    lead_samples_pending: { label: 'Wysłano Link (Próbki)', description: 'Czekamy na wybór próbek przez klienta' },
    lead_samples_sent: { label: 'Próbki Wysłane', description: 'Próbki fizycznie wysłane do klienta' },
    lead_pre_estimate: { label: 'Wstępna Wycena', description: 'Wysłano szacunkowy kosztorys' },
    
    // 2. PRZEKAZANIE
    measurement_to_schedule: { label: 'Do Umówienia', description: 'Oczekuje na telefon od montażysty' },
    measurement_scheduled: { label: 'Pomiar Umówiony', description: 'Termin pomiaru został ustalony' },
    
    // 3. WYCENA (PO POMIARZE)
    measurement_done: { label: 'Po Pomiarze', description: 'Pomiar wykonany, raport w systemie' },
    quote_in_progress: { label: 'Wycena w Toku', description: 'Trwa przygotowywanie oferty końcowej' },
    quote_sent: { label: 'Oferta Wysłana', description: 'Oferta wysłana do klienta' },
    quote_accepted: { label: 'Oferta Zaakceptowana', description: 'Klient zaakceptował warunki' },
    
    // 4. FORMALNOŚCI
    contract_signed: { label: 'Umowa Podpisana', description: 'Umowa została podpisana' },
    waiting_for_deposit: { label: 'Oczekiwanie na Zaliczkę', description: 'Czekamy na wpłatę zaliczki' },
    deposit_paid: { label: 'Zaliczka Opłacona', description: 'Zaliczka zaksięgowana' },
    
    // 5. LOGISTYKA
    materials_ordered: { label: 'Materiały Zamówione', description: 'Zamówienie wysłane do dostawcy' },
    materials_pickup_ready: { label: 'Gotowe do Odbioru', description: 'Towar czeka na odbiór' },
    installation_scheduled: { label: 'Montaż Zaplanowany', description: 'Termin montażu potwierdzony' },
    materials_delivered: { label: 'Materiały u Klienta', description: 'Towar dostarczony na miejsce' },
    
    // 6. REALIZACJA
    installation_in_progress: { label: 'Montaż w Toku', description: 'Prace montażowe w trakcie' },
    protocol_signed: { label: 'Protokół Podpisany', description: 'Protokół odbioru podpisany' },
    
    // 7. FINISZ
    final_invoice_issued: { label: 'Faktura Końcowa', description: 'Wystawiono fakturę końcową' },
    final_settlement: { label: 'Rozliczenie Końcowe', description: 'Wszystkie płatności uregulowane' },
    completed: { label: 'Zakończone', description: 'Zlecenie zamknięte' },
    
    // 8. STANY SPECJALNE
    on_hold: { label: 'Wstrzymane', description: 'Realizacja wstrzymana' },
    rejected: { label: 'Odrzucone', description: 'Zlecenie odrzucone' },
    complaint: { label: 'Reklamacja', description: 'Zgłoszono reklamację' },
};

export const statusOptions: StatusOption[] = montageStatuses.map((value) => ({
	value,
	label: statusLabels[value].label,
	description: statusLabels[value].description,
}));

export const SORT_OPTIONS = {
    SMART_DATE: 'smart-date',
    STAGNATION: 'stagnation',
    LAST_ACTIVITY: 'last-activity',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

export const sortLabels: Record<SortOption, string> = {
    [SORT_OPTIONS.SMART_DATE]: 'Termin Realizacji (Smart)',
    [SORT_OPTIONS.STAGNATION]: 'Najdłużej w etapie',
    [SORT_OPTIONS.LAST_ACTIVITY]: 'Ostatnia aktywność',
};
