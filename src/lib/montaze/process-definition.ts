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
};

export const PROCESS_STEPS: ProcessStepDefinition[] = [
    {
        id: 'lead_verification',
        label: 'Zgłoszenie i Weryfikacja',
        description: 'Wstępna weryfikacja klienta i ustalenie potrzeb.',
        relatedStatuses: ['lead'],
        actor: 'office',
        automations: [],
        checkpoints: [
            { key: 'contact_established', label: 'Kontakt nawiązany', condition: (m) => !!m.contactPhone || !!m.contactEmail },
            { key: 'address_verified', label: 'Adres zweryfikowany', condition: (m) => !!m.installationAddress }
        ]
    },
    {
        id: 'measurement_valuation',
        label: 'Pomiar i Wycena',
        description: 'Realizacja pomiaru u klienta i przygotowanie oferty.',
        relatedStatuses: ['before_measurement'],
        actor: 'installer',
        automations: [],
        checkpoints: [
            { key: 'measurement_scheduled', label: 'Pomiar umówiony', condition: (m) => !!m.measurementDate },
            { key: 'measurement_done', label: 'Pomiar wykonany', condition: (m) => !!m.floorArea }, // Simplification
            { key: 'quote_created', label: 'Oferta utworzona', condition: (m) => !!m.quotes && m.quotes.length > 0 }
        ]
    },
    {
        id: 'formalities',
        label: 'Formalności i Zaliczka',
        description: 'Podpisanie umowy i wpłata zaliczki przez klienta.',
        relatedStatuses: ['before_first_payment'],
        actor: 'client',
        automations: [],
        checkpoints: [
            { key: 'quote_accepted', label: 'Oferta zaakceptowana', condition: (m) => m.quotes?.some((q) => q.status === 'accepted') ?? false },
            { key: 'contract_signed', label: 'Umowa podpisana', condition: (m) => !!m.contractDate || (m.quotes?.some((q) => !!q.signedAt) ?? false) },
            { key: 'advance_paid', label: 'Zaliczka opłacona', condition: () => false } // Placeholder logic for now
        ]
    },
    {
        id: 'logistics',
        label: 'Logistyka i Planowanie',
        description: 'Zamówienie materiałów i ustalenie terminu montażu.',
        relatedStatuses: ['before_installation'],
        actor: 'office',
        automations: [],
        checkpoints: [
            { key: 'materials_ordered', label: 'Materiały zamówione', condition: (m) => m.materialStatus === 'ordered' || m.materialStatus === 'in_stock' || m.materialStatus === 'delivered' },
            { key: 'installation_scheduled', label: 'Montaż zaplanowany', condition: (m) => !!m.scheduledInstallationAt }
        ]
    },
    {
        id: 'realization',
        label: 'Realizacja i Odbiór',
        description: 'Fizyczny montaż, odbiór prac i rozliczenie końcowe.',
        relatedStatuses: ['before_final_invoice'],
        actor: 'installer',
        automations: [
            { id: 'auto_status_protocol', label: 'Automatyczne zakończenie', description: 'Wymusza status "Realizacja i Odbiór" po podpisaniu protokołu (jeśli montaż utknął w planowaniu). Nie cofa statusu, jeśli montaż jest już zakończony.' }
        ],
        checkpoints: [
            { key: 'installation_done', label: 'Prace zakończone', condition: () => false }, // Manual check usually
            { key: 'protocol_signed', label: 'Protokół podpisany', condition: (m) => !!m.clientSignatureUrl }
        ]
    },
    {
        id: 'completed',
        label: 'Zakończone',
        description: 'Zlecenie zamknięte i zarchiwizowane.',
        relatedStatuses: ['completed'],
        actor: 'system',
        automations: [],
        checkpoints: [
            { key: 'final_payment', label: 'Rozliczenie końcowe', condition: () => true }
        ]
    }
];
