export type SystemNotificationDefinition = {
    id: string;
    type: 'sms' | 'email' | 'calendar' | 'system';
    trigger: string;
    action: string;
    recipient: string;
    defaultEnabled: boolean;
};

export const SYSTEM_NOTIFICATIONS: SystemNotificationDefinition[] = [
    {
        id: 'sms_measurement_request',
        type: 'sms',
        trigger: 'Ręczne kliknięcie "Wyślij prośbę o pomiar"',
        action: 'Wysyła SMS: "Dzień dobry, prosimy o kontakt..."',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'calendar_create',
        type: 'calendar',
        trigger: 'Utworzenie montażu z datą szacowaną',
        action: 'Tworzy wydarzenie w Google Calendar',
        recipient: 'Kalendarz Firmowy + Montażysta',
        defaultEnabled: true
    },
    {
        id: 'calendar_update',
        type: 'calendar',
        trigger: 'Zmiana daty montażu lub przypisanie montażysty',
        action: 'Aktualizuje wydarzenie w Google Calendar',
        recipient: 'Kalendarz Firmowy + Montażysta',
        defaultEnabled: true
    },
    {
        id: 'log_history',
        type: 'system',
        trigger: 'Każda kluczowa akcja (edycja, status, checklista)',
        action: 'Zapisuje wpis w Historii Zdarzeń',
        recipient: 'System Logs',
        defaultEnabled: true
    },
    {
        id: 'commission_architect',
        type: 'system',
        trigger: 'Zmiana statusu na "Zakończono" (jeśli jest architekt)',
        action: 'Nalicza prowizję dla architekta',
        recipient: 'Portfel Architekta',
        defaultEnabled: true
    },
    {
        id: 'quote_signed',
        type: 'system',
        trigger: 'Podpisanie wyceny przez klienta (Portal)',
        action: 'Zmiana statusu wyceny na "Zaakceptowana" + Log systemowy',
        recipient: 'System + Admin',
        defaultEnabled: true
    }
];
