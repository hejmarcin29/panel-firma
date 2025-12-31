
export type PortalStepDefinition = {
    id: string;
    label: string;
    description: string; // Opis dla klienta
    iconName: 'FileText' | 'Ruler' | 'Calculator' | 'CheckCircle2' | 'Truck' | 'Hammer' | 'Check';
    
    // Dokumentacja dla Admina
    adminDescription: string; // Co to za etap biznesowo
    conditionActive: string; // Kiedy jest "W toku"
    conditionCompleted: string; // Kiedy jest "Zakończony"
};

export const PORTAL_STEPS: PortalStepDefinition[] = [
    {
        id: 'lead',
        label: 'Zgłoszenie przyjęte',
        description: 'Twoje zapytanie trafiło do systemu',
        iconName: 'FileText',
        adminDescription: 'Potwierdzenie wpłynięcia leada do systemu.',
        conditionActive: 'Nigdy (zawsze minione)',
        conditionCompleted: 'Zawsze (od momentu utworzenia)'
    },
    {
        id: 'before_measurement',
        label: 'Pomiar',
        description: 'Weryfikacja wymiarów i warunków',
        iconName: 'Ruler',
        adminDescription: 'Etap realizacji pomiaru przez montażystę.',
        conditionActive: 'Status zlecenia to "Przed pomiarem" ORAZ brak wpisanego metrażu.',
        conditionCompleted: 'Wpisano metraż (floorArea > 0) - niezależnie od statusu zlecenia.'
    },
    {
        id: 'quote_preparation',
        label: 'Przygotowanie Oferty',
        description: 'Analiza pomiaru i wycena',
        iconName: 'Calculator',
        adminDescription: 'Biuro analizuje pomiar i tworzy ofertę.',
        conditionActive: 'Pomiar wykonany (metraż > 0), ale brak utworzonej oferty w systemie.',
        conditionCompleted: 'Biuro utworzyło ofertę (status oferty: draft/sent).'
    },
    {
        id: 'quote_acceptance',
        label: 'Akceptacja Oferty',
        description: 'Czekamy na Twoją decyzję',
        iconName: 'CheckCircle2',
        adminDescription: 'Klient widzi ofertę i musi ją zaakceptować.',
        conditionActive: 'Oferta istnieje, ale nie ma statusu "accepted".',
        conditionCompleted: 'Klient lub Biuro zaakceptowało ofertę.'
    },
    {
        id: 'before_first_payment',
        label: 'Zaliczka',
        description: 'Potwierdzenie zamówienia',
        iconName: 'CheckCircle2',
        adminDescription: 'Oczekiwanie na wpłatę zaliczki.',
        conditionActive: 'Oferta zaakceptowana, ale status zlecenia to nadal "Przed zaliczką".',
        conditionCompleted: 'Zaliczka zaksięgowana (Status zlecenia zmienił się na "Przed montażem" lub dalszy).'
    },
    {
        id: 'before_installation',
        label: 'W realizacji',
        description: 'Kompletowanie materiałów',
        iconName: 'Truck',
        adminDescription: 'Logistyka materiałowa i oczekiwanie na termin.',
        conditionActive: 'Status zlecenia to "Przed montażem" (before_installation).',
        conditionCompleted: 'Status zlecenia to "Przed końcową fakturą" (before_final_invoice) lub dalszy.'
    },
    {
        id: 'floor_install',
        label: 'Montaż',
        description: 'Realizacja prac u klienta',
        iconName: 'Hammer',
        adminDescription: 'Fizyczny montaż podłogi.',
        conditionActive: 'Status zlecenia to "Przed końcową fakturą" (before_final_invoice).',
        conditionCompleted: 'Status zlecenia to "Zakończone" (completed).'
    },
    {
        id: 'completed',
        label: 'Zakończono',
        description: 'Prace odebrane',
        iconName: 'Check',
        adminDescription: 'Proces zakończony.',
        conditionActive: 'Nigdy',
        conditionCompleted: 'Status zlecenia to "Zakończone" (completed).'
    }
];
