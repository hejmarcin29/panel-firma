import { type MontageStatus } from '@/lib/db/schema';
import type { Montage } from '@/app/dashboard/crm/montaze/types';

export type ProcessActor = 'client' | 'office' | 'installer' | 'system';

export type ProcessAutomation = {
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
        automations: [
            { label: 'Powiadomienie SMS', description: 'System wysyła powitanie do klienta po utworzeniu leada.' }
        ],
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
        automations: [
            { label: 'Przypomnienie o pomiarze', description: 'SMS do klienta 24h przed pomiarem.' },
            { label: 'Powiadomienie pomiarowca', description: 'Email/SMS do pomiarowca o nowym zleceniu.' }
        ],
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
        automations: [
            { label: 'Link do umowy', description: 'Wysłanie linku do akceptacji oferty i umowy.' },
            { label: 'Przypomnienie o wpłacie', description: 'SMS po 3 dniach braku wpłaty zaliczki.' }
        ],
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
        automations: [
            { label: 'Zamówienie do dostawcy', description: 'Generowanie zamówienia PDF do dostawcy.' },
            { label: 'Potwierdzenie terminu', description: 'SMS do klienta z potwierdzeniem daty montażu.' }
        ],
        checkpoints: [
            { key: 'materials_ordered', label: 'Materiały zamówione', condition: (m) => m.materialStatus === 'ordered' || m.materialStatus === 'in_stock' || m.materialStatus === 'delivered' },
            { key: 'installation_scheduled', label: 'Montaż zaplanowany', condition: (m) => !!m.scheduledInstallationAt }
        ]
    },
    {
        id: 'skirting_stage',
        label: 'Montaż Listew',
        description: 'Dokończenie montażu listew przypodłogowych.',
        relatedStatuses: ['before_skirting_installation'],
        actor: 'installer',
        automations: [
             { label: 'Powiadomienie o listwach', description: 'Przypomnienie o terminie montażu listew.' }
        ],
        checkpoints: [
            { key: 'skirting_scheduled', label: 'Termin listew', condition: (m) => !!m.scheduledSkirtingInstallationAt },
            { key: 'skirting_done', label: 'Listwy zamontowane', condition: (m) => !!m.skirtingClientSignatureUrl }
        ]
    },
    {
        id: 'realization',
        label: 'Realizacja i Odbiór',
        description: 'Fizyczny montaż, odbiór prac i rozliczenie końcowe.',
        relatedStatuses: ['before_final_invoice'],
        actor: 'installer',
        automations: [
            { label: 'Protokół odbioru', description: 'Link do elektronicznego protokołu odbioru.' },
            { label: 'Prośba o opinię', description: 'SMS z linkiem do Google Maps po zakończeniu.' }
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
