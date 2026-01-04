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
    { id: 'new_lead', label: 'Nowe Zgłoszenie', description: 'Wpadło, nikt nie dzwonił.', relatedStatuses: ['new_lead'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'contact_attempt', label: 'Do umówienia', description: 'Oczekiwanie na kontakt telefoniczny i ustalenie terminu.', relatedStatuses: ['contact_attempt'], actor: 'installer', automations: [], checkpoints: [] },
    { id: 'contact_established', label: 'Kontakt Nawiązany', description: 'Rozmawialiśmy, ustalamy co dalej.', relatedStatuses: ['contact_established'], actor: 'office', automations: [], checkpoints: [] },
    { 
        id: 'measurement_scheduled', 
        label: 'Pomiar Umówiony', 
        description: 'Jest data w kalendarzu.', 
        relatedStatuses: ['measurement_scheduled'], 
        actor: 'office', 
        automations: [], 
        checkpoints: [
            { key: 'measurement_data', label: 'Dane pomiarowe', condition: (m) => !!m.measurementDate || !!m.measurementDetails },
            { key: 'labor_cost', label: 'Kosztorys robocizny', condition: (m) => !!m.costEstimationCompletedAt }
        ] 
    },

    // 2. WYCENA
    { id: 'measurement_done', label: 'Po Pomiarze', description: 'Montażysta był, ale brak wyceny.', relatedStatuses: ['measurement_done'], actor: 'installer', automations: [], checkpoints: [] },
    { id: 'quote_in_progress', label: 'Wycena w Toku', description: 'Liczymy, sprawdzamy dostępność.', relatedStatuses: ['quote_in_progress'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'quote_sent', label: 'Oferta Wysłana', description: 'Klient ma maila, czekamy.', relatedStatuses: ['quote_sent'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'quote_accepted', label: 'Oferta Zaakceptowana', description: 'Klient powiedział TAK, ale brak papierów.', relatedStatuses: ['quote_accepted'], actor: 'client', automations: [], checkpoints: [] },

    // 3. FORMALNOŚCI
    { id: 'contract_signed', label: 'Umowa Podpisana', description: 'Jest podpis na umowie.', relatedStatuses: ['contract_signed'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'waiting_for_deposit', label: 'Oczekiwanie na Zaliczkę', description: 'Faktura zaliczkowa wysłana.', relatedStatuses: ['waiting_for_deposit'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'deposit_paid', label: 'Zaliczka Opłacona', description: 'Kasa na koncie -> Startujemy.', relatedStatuses: ['deposit_paid'], actor: 'office', automations: [], checkpoints: [], requiredDocuments: ['invoice_advance'] },

    // 4. LOGISTYKA
    { id: 'materials_ordered', label: 'Materiały Zamówione', description: 'Poszło zamówienie do producenta.', relatedStatuses: ['materials_ordered'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'materials_pickup_ready', label: 'Gotowe do Odbioru', description: 'Towar czeka w magazynie/hurtowni.', relatedStatuses: ['materials_pickup_ready'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'installation_scheduled', label: 'Montaż Zaplanowany', description: 'Ekipa ma termin startu.', relatedStatuses: ['installation_scheduled'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'materials_delivered', label: 'Materiały u Klienta', description: 'Towar dostarczony na budowę.', relatedStatuses: ['materials_delivered'], actor: 'office', automations: [], checkpoints: [] },

    // 5. REALIZACJA
    { id: 'installation_in_progress', label: 'Montaż w Toku', description: 'Prace trwają.', relatedStatuses: ['installation_in_progress'], actor: 'installer', automations: [], checkpoints: [] },
    { id: 'protocol_signed', label: 'Protokół Podpisany', description: 'Koniec prac, odbiór techniczny.', relatedStatuses: ['protocol_signed'], actor: 'installer', automations: [], checkpoints: [] },

    // 6. FINISZ
    { id: 'final_invoice_issued', label: 'Faktura Końcowa', description: 'Wystawiona, wysłana.', relatedStatuses: ['final_invoice_issued'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'final_settlement', label: 'Rozliczenie Końcowe', description: 'Czekamy na dopłatę.', relatedStatuses: ['final_settlement'], actor: 'office', automations: [], checkpoints: [] },
    { id: 'completed', label: 'Zakończone', description: 'Wszystko na czysto, archiwum.', relatedStatuses: ['completed'], actor: 'system', automations: [], checkpoints: [], requiredDocuments: ['invoice_final'] },

    // 7. STANY SPECJALNE
    { id: 'on_hold', label: 'Wstrzymane', description: 'Klient buduje dom, wróci za pół roku.', relatedStatuses: ['on_hold'], actor: 'system', automations: [], checkpoints: [] },
    { id: 'rejected', label: 'Odrzucone', description: 'Za drogo / konkurencja.', relatedStatuses: ['rejected'], actor: 'system', automations: [], checkpoints: [] },
    { id: 'complaint', label: 'Reklamacja', description: 'Coś poszło nie tak po montażu.', relatedStatuses: ['complaint'], actor: 'system', automations: [], checkpoints: [] },
];
