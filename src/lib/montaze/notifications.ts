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
        action: '(Planowane) Wysyła SMS: "Dzień dobry, prosimy o kontakt..."',
        recipient: 'Klient',
        defaultEnabled: false
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
        action: '(Systemowe - zawsze aktywne) Zapisuje wpis w Historii Zdarzeń',
        recipient: 'System Logs',
        defaultEnabled: true
    },
    {
        id: 'commission_architect',
        type: 'system',
        trigger: 'Zmiana statusu na "Zakończono" (jeśli jest architekt)',
        action: '(Planowane) Nalicza prowizję dla architekta',
        recipient: 'Portfel Architekta',
        defaultEnabled: false
    },
    {
        id: 'quote_signed',
        type: 'system',
        trigger: 'Podpisanie wyceny przez klienta (Portal)',
        action: '(Systemowe - zawsze aktywne) Zmiana statusu wyceny na "Zaakceptowana" + Log systemowy',
        recipient: 'System + Admin',
        defaultEnabled: true
    },
    {
        id: 'lead_welcome',
        type: 'email',
        trigger: 'Utworzenie nowego leada',
        action: '(Planowane) Wysyła e-mail powitalny z informacjami',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'measurement_scheduled',
        type: 'sms',
        trigger: 'Ustalenie daty pomiaru',
        action: '(Planowane) Wysyła SMS z potwierdzeniem terminu',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'quote_ready',
        type: 'email',
        trigger: 'Zmiana statusu wyceny na "Gotowa"',
        action: '(Planowane) Wysyła e-mail z linkiem do wyceny',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'order_confirmation',
        type: 'email',
        trigger: 'Zatwierdzenie zamówienia',
        action: '(Planowane) Wysyła potwierdzenie przyjęcia do realizacji',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'logistics_update',
        type: 'sms',
        trigger: 'Zmiana statusu materiału na "Dostarczono"',
        action: '(Planowane) Wysyła SMS o dostępności towaru',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'installation_reminder',
        type: 'sms',
        trigger: '24h przed terminem montażu',
        action: '(Planowane) Wysyła SMS przypominający',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'satisfaction_survey',
        type: 'email',
        trigger: 'Zakończenie montażu',
        action: '(Planowane) Wysyła prośbę o opinię (Google/Facebook)',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'cron_sync_products',
        type: 'system',
        trigger: 'Harmonogram (Cron) / Ręczne wywołanie',
        action: 'Aktualizuje ceny i stany magazynowe TYLKO dla produktów z włączoną synchronizacją',
        recipient: 'Baza Danych',
        defaultEnabled: true
    },
    {
        id: 'webhook_woo_order',
        type: 'system',
        trigger: 'Nowe zamówienie w WooCommerce (Webhook)',
        action: 'Tworzy zamówienie w panelu (Status: Do weryfikacji)',
        recipient: 'Moduł Zamówień',
        defaultEnabled: true
    },
    {
        id: 'webhook_fluent_lead',
        type: 'system',
        trigger: 'Wypełnienie formularza kontaktowego (Webhook)',
        action: 'Tworzy Klienta i Montaż (Lead) z domyślną checklistą',
        recipient: 'Moduł CRM',
        defaultEnabled: true
    },
    {
        id: 'auto_status_protocol',
        type: 'system',
        trigger: 'Podpisanie protokołu odbioru',
        action: 'Zmienia status montażu na "Przed końcową fakturą"',
        recipient: 'Montaż',
        defaultEnabled: true
    }
];
