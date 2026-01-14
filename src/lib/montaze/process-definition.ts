import { type MontageStatus } from '@/lib/db/schema';
import type { Montage } from '@/app/dashboard/crm/montaze/types';

export type ProcessActor = 'client' | 'office' | 'installer' | 'system';

export type ProcessAutomation = {
    id: string;
    label: string;
    description?: string;
    trigger?: string;
};

export type ProcessStepDefinition = {
    id: string;
    label: string;
    description: string;
    relatedStatuses: MontageStatus[];
    actor: ProcessActor;
    automations: ProcessAutomation[];
    checkpoints: {
        key: string;
        label: string;
        condition: (montage: Montage) => boolean;
    }[];
    requiredDocuments?: ('proforma' | 'invoice_advance' | 'invoice_final')[];
};

export const PROCESS_STEPS: ProcessStepDefinition[] = [
    // 1. LEJKI
    { 
        id: 'new_lead', 
        label: 'Nowe Zgłoszenie', 
        description: 'Wpadło, nikt nie dzwonił.', 
        relatedStatuses: ['new_lead'], 
        actor: 'office', 
        automations: [
            { id: 'auto_lead_notification', label: 'Powiadomienie Biura', description: 'Email/SMS do biura o nowym leadzie', trigger: 'Nowy rekord' },
        ], 
        checkpoints: [] 
    },
    { 
        id: 'lead_active', 
        label: 'Proces Handlowy', 
        description: 'Kontakt, próbki, wstępna wycena.', 
        relatedStatuses: ['lead_contact', 'lead_samples_pending', 'lead_samples_sent', 'lead_pre_estimate'], 
        actor: 'office', 
        automations: [
             { id: 'auto_magic_link', label: 'Magic Link', description: 'Wysłanie linku do próbek', trigger: 'Ręcznie' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'waiting_for_measurement_fee', 
        label: 'Oczekiwanie na Płatność', 
        description: 'Wymagana opłata za pomiar.', 
        relatedStatuses: ['lead_payment_pending'], 
        actor: 'client', 
        automations: [
            { id: 'auto_payment_link', label: 'Link do Płatności', description: 'Wygenerowanie zamówienia technicznego', trigger: 'Ręcznie (Handlowiec)' },
            { id: 'auto_measurement_unlock', label: 'Odblokowanie Pomiaru', description: 'Zmiana statusu po opłaceniu (auto)', trigger: 'Zaksięgowanie wpłaty' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'measurement_to_schedule', 
        label: 'Do umówienia', 
        description: 'Zlecono pomiar, montażysta dzwoni.', 
        relatedStatuses: ['measurement_to_schedule'], 
        actor: 'installer', 
        automations: [
            { id: 'auto_installer_notif', label: 'Powiadomienie Montażysty', description: 'SMS: Nowy klient do umówienia', trigger: 'Zmiana statusu' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'measurement_scheduled', 
        label: 'Pomiar Umówiony', 
        description: 'Jest data w kalendarzu.', 
        relatedStatuses: ['measurement_scheduled'], 
        actor: 'office', 
        automations: [
            { id: 'auto_calendar_sync', label: 'Synchronizacja Kalendarza', description: 'Dodanie wydarzenia do Google Calendar', trigger: 'Zapisanie daty' },
            { id: 'auto_sms_reminder', label: 'Przypomnienie SMS', description: 'Wysłanie SMS do klienta 24h przed', trigger: 'Cron 24h przed' }
        ], 
        checkpoints: [
            { key: 'measurement_data', label: 'Dane pomiarowe', condition: (m) => !!m.measurementDate || !!m.measurementDetails },
            { key: 'labor_cost', label: 'Kosztorys robocizny', condition: (m) => !!m.costEstimationCompletedAt }
        ] 
    },

    // 2. WYCENA
    { 
        id: 'measurement_done', 
        label: 'Po Pomiarze', 
        description: 'Montażysta był, ale brak wyceny.', 
        relatedStatuses: ['measurement_done'], 
        actor: 'installer', 
        automations: [
            { id: 'auto_quote_start', label: 'Start Wyceny', description: 'Utworzenie oferty zmienia status na "Wycena w Toku"', trigger: 'Utworzenie oferty' },
            { id: 'auto_contract_signed', label: 'Podpis Klienta', description: 'Podpisanie umowy w panelu zmienia status na "Umowa Podpisana"', trigger: 'Podpis w panelu' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'quote_in_progress', 
        label: 'Wycena w Toku', 
        description: 'Liczymy, sprawdzamy dostępność.', 
        relatedStatuses: ['quote_in_progress'], 
        actor: 'office', 
        automations: [
            { id: 'auto_quote_sent', label: 'Wysłanie Oferty', description: 'Wysłanie maila zmienia status na "Oferta Wysłana"', trigger: 'Wysłanie maila' },
            { id: 'auto_contract_signed', label: 'Podpis Klienta', description: 'Podpisanie umowy w panelu zmienia status na "Umowa Podpisana"', trigger: 'Podpis w panelu' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'quote_sent', 
        label: 'Oferta Wysłana', 
        description: 'Klient ma maila, czekamy.', 
        relatedStatuses: ['quote_sent'], 
        actor: 'office', 
        automations: [
            { id: 'auto_contract_signed', label: 'Podpis Klienta', description: 'Podpisanie umowy w panelu zmienia status na "Umowa Podpisana"', trigger: 'Podpis w panelu' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'quote_accepted', 
        label: 'Oferta Zaakceptowana', 
        description: 'Klient powiedział TAK, ale brak papierów.', 
        relatedStatuses: ['quote_accepted'], 
        actor: 'client', 
        automations: [
            { id: 'auto_contract_signed', label: 'Podpis Klienta', description: 'Podpisanie umowy w panelu zmienia status na "Umowa Podpisana"', trigger: 'Podpis w panelu' }
        ], 
        checkpoints: [] 
    },

    // 3. FORMALNOŚCI
    { 
        id: 'contract_signed', 
        label: 'Umowa Podpisana', 
        description: 'Jest podpis na umowie.', 
        relatedStatuses: ['contract_signed'], 
        actor: 'office', 
        automations: [
            { id: 'auto_status_waiting_deposit', label: 'Wystawienie Proformy', description: 'Dodanie płatności zaliczkowej zmienia status na "Oczekiwanie na Zaliczkę"', trigger: 'Utworzenie płatności' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'waiting_for_deposit', 
        label: 'Oczekiwanie na Zaliczkę', 
        description: 'Faktura zaliczkowa wysłana.', 
        relatedStatuses: ['waiting_for_deposit'], 
        actor: 'office', 
        automations: [
            { id: 'auto_payment_reminder', label: 'Przypomnienie o Płatności', description: 'SMS/Mail przypominający o braku wpłaty', trigger: 'Cron 3 dni' },
            { id: 'auto_status_deposit_paid', label: 'Zaksięgowanie Wpłaty', description: 'Oznaczenie płatności jako opłaconej zmienia status na "Zaliczka Opłacona"', trigger: 'Zaksięgowanie wpłaty' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'deposit_paid', 
        label: 'Zaliczka Opłacona', 
        description: 'Kasa na koncie -> Startujemy.', 
        relatedStatuses: ['deposit_paid'], 
        actor: 'office', 
        automations: [
            { id: 'auto_payment_confirmation', label: 'Potwierdzenie Wpłaty', description: 'SMS/Mail do klienta z potwierdzeniem', trigger: 'Zaksięgowanie wpłaty' },
            { id: 'auto_erp_order', label: 'Zapotrzebowanie ERP', description: 'Utworzenie draftu zamówienia do dostawcy', trigger: 'Zaksięgowanie wpłaty' }
        ], 
        checkpoints: [], 
        requiredDocuments: ['invoice_advance'] 
    },

    // 4. LOGISTYKA
    { 
        id: 'materials_ordered', 
        label: 'Materiały Zamówione', 
        description: 'Poszło zamówienie do producenta.', 
        relatedStatuses: ['materials_ordered'], 
        actor: 'office', 
        automations: [
            { id: 'auto_supplier_mail', label: 'Mail do Dostawcy', description: 'Wysłanie zamówienia PDF', trigger: 'Zatwierdzenie zamówienia' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'materials_pickup_ready', 
        label: 'Gotowe do Odbioru', 
        description: 'Towar czeka w magazynie/hurtowni.', 
        relatedStatuses: ['materials_pickup_ready'], 
        actor: 'office', 
        automations: [
            { id: 'auto_pickup_notification', label: 'Powiadomienie o Odbiorze', description: 'SMS/Mail do klienta lub montażysty', trigger: 'Zmiana statusu magazynowego' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'installation_scheduled', 
        label: 'Montaż Zaplanowany', 
        description: 'Ekipa ma termin startu.', 
        relatedStatuses: ['installation_scheduled'], 
        actor: 'office', 
        automations: [
            { id: 'auto_installation_reminder', label: 'Przypomnienie o Montażu', description: 'SMS do klienta 48h przed startem', trigger: 'Cron 48h przed' }
        ], 
        checkpoints: [] 
    },
    { 
        id: 'materials_delivered', 
        label: 'Materiały u Klienta', 
        description: 'Towar dostarczony na budowę.', 
        relatedStatuses: ['materials_delivered'], 
        actor: 'office', 
        automations: [
            { id: 'auto_erp_issue', label: 'Wydanie z ERP', description: 'Automatyczna zmiana statusu po wydaniu towaru w module ERP', trigger: 'Wydanie towaru' }
        ], 
        checkpoints: [] 
    },

    // 5. REALIZACJA
    { id: 'installation_in_progress', label: 'Montaż w Toku', description: 'Prace trwają.', relatedStatuses: ['installation_in_progress'], actor: 'installer', automations: [], checkpoints: [] },
    { 
        id: 'protocol_signed', 
        label: 'Protokół Podpisany', 
        description: 'Koniec prac, odbiór techniczny.', 
        relatedStatuses: ['protocol_signed'], 
        actor: 'installer', 
        automations: [
            { id: 'auto_final_invoice', label: 'Faktura Końcowa', description: 'Generowanie draftu faktury końcowej', trigger: 'Podpis protokołu' }
        ], 
        checkpoints: [] 
    },

    // 6. FINISZ
    { id: 'final_invoice_issued', label: 'Faktura Końcowa', description: 'Wystawiona, wysłana.', relatedStatuses: ['final_invoice_issued'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'final_settlement', label: 'Rozliczenie Końcowe', description: 'Czekamy na dopłatę.', relatedStatuses: ['final_settlement'], actor: 'office', automations: [], checkpoints: [] },
    { 
        id: 'completed', 
        label: 'Zakończone', 
        description: 'Wszystko na czysto, archiwum.', 
        relatedStatuses: ['completed'], 
        actor: 'system', 
        automations: [
            { id: 'auto_review_request', label: 'Prośba o Opinię', description: 'Mail z linkiem do Google Maps', trigger: 'Zamknięcie zlecenia' }
        ], 
        checkpoints: [], 
        requiredDocuments: ['invoice_final'] 
    },

    // 7. STANY SPECJALNE
    { id: 'on_hold', label: 'Wstrzymane', description: 'Klient buduje dom, wróci za pół roku.', relatedStatuses: ['on_hold'], actor: 'system', automations: [], checkpoints: [] },
    { id: 'rejected', label: 'Odrzucone', description: 'Za drogo / konkurencja.', relatedStatuses: ['rejected'], actor: 'system', automations: [], checkpoints: [] },
    { id: 'complaint', label: 'Reklamacja', description: 'Coś poszło nie tak po montażu.', relatedStatuses: ['complaint'], actor: 'system', automations: [], checkpoints: [] },
];
