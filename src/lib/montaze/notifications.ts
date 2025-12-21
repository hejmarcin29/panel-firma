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
        id: 'workflow_skirting_split',
        type: 'system',
        trigger: 'Podpisanie protokołu (gdy listwy osobno)',
        action: 'Przenosi do etapu "Przed montażem listew"',
        recipient: 'System Workflow',
        defaultEnabled: true
    },
    {
        id: 'alert_skirting_pickup',
        type: 'system',
        trigger: 'Status "Na magazynie" + Odbiór własny',
        action: 'Wyświetla alert "ZABIERZ LISTWY" w aplikacji',
        recipient: 'Montażysta',
        defaultEnabled: true
    },
    {
        id: 'quote_signed',
        type: 'system',
        trigger: 'Podpisanie wyceny przez klienta (Portal)',
        action: 'Zmiana statusu wyceny na "Zaakceptowana" + Log systemowy',
        recipient: 'System + Admin',
        defaultEnabled: true
    },
    {
        id: 'lead_welcome',
        type: 'email',
        trigger: 'Utworzenie nowego leada',
        action: 'Wysyła e-mail powitalny z informacjami',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'measurement_scheduled',
        type: 'sms',
        trigger: 'Ustalenie daty pomiaru',
        action: 'Wysyła SMS z potwierdzeniem terminu',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'quote_ready',
        type: 'email',
        trigger: 'Zmiana statusu wyceny na "Gotowa"',
        action: 'Wysyła e-mail z linkiem do wyceny',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'order_confirmation',
        type: 'email',
        trigger: 'Zatwierdzenie zamówienia',
        action: 'Wysyła potwierdzenie przyjęcia do realizacji',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'logistics_update',
        type: 'sms',
        trigger: 'Zmiana statusu materiału na "Dostarczono"',
        action: 'Wysyła SMS o dostępności towaru',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'installation_reminder',
        type: 'sms',
        trigger: '24h przed terminem montażu',
        action: 'Wysyła SMS przypominający',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'satisfaction_survey',
        type: 'email',
        trigger: 'Zakończenie montażu',
        action: 'Wysyła prośbę o opinię (Google/Facebook)',
        recipient: 'Klient',
        defaultEnabled: true
    }
];
