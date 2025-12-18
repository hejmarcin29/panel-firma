export const MONTAGE_ROOT_PREFIX = 'montaze';
export const ORDER_ROOT_PREFIX = 'zamowienia';
export const TASK_ROOT_PREFIX = 'zadania';
export const CLIENT_ROOT_PREFIX = 'klienci';

export const MontageCategories = {
    DOCUMENTS: 'dokumenty',
    GALLERY: 'galeria',
} as const;

export const MontageSubCategories = {
    QUOTES: 'wyceny',
    CONTRACTS: 'umowy',
    INVOICES: 'faktury',
    PROTOCOLS: 'protokoly',
    MEASUREMENT_BEFORE: 'pomiar_przed',
    IN_PROGRESS: 'w_trakcie',
    REALIZATION: 'realizacja',
    COMPLAINTS: 'reklamacje',
} as const;
