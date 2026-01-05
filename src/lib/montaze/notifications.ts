export type SystemNotificationDefinition = {
    id: string;
    type: 'sms' | 'email' | 'calendar' | 'system';
    trigger: string;
    action: string;
    recipient: string;
    defaultEnabled: boolean;
    locked?: boolean;
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
        id: 'data_request_sms',
        type: 'sms',
        trigger: 'Ręczne kliknięcie "Poproś o dane"',
        action: 'Wysyła SMS z linkiem do Portalu Klienta',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'data_request_email',
        type: 'email',
        trigger: 'Ręczne kliknięcie "Poproś o dane"',
        action: 'Wysyła E-mail z linkiem do Portalu Klienta',
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
        action: '(Systemowe - zawsze aktywne) Zapisuje wpis w Historii Zdarzeń',
        recipient: 'System Logs',
        defaultEnabled: true,
        locked: true
    },
    {
        id: 'quote_signed',
        type: 'system',
        trigger: 'Podpisanie wyceny przez klienta (Portal)',
        action: '(Systemowe - zawsze aktywne) Zmiana statusu wyceny na "Zaakceptowana" + Log systemowy',
        recipient: 'System + Admin',
        defaultEnabled: true,
        locked: true
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
        id: 'measurement_scheduled_email',
        type: 'email',
        trigger: 'Ustalenie daty pomiaru',
        action: 'Wysyła E-mail z potwierdzeniem terminu i instrukcją',
        recipient: 'Klient',
        defaultEnabled: true
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
        action: 'Tworzy zamówienie i inteligentnie łączy z istniejącym klientem (Silent Match)',
        recipient: 'Moduł Zamówień',
        defaultEnabled: true
    },
    {
        id: 'admin_duplicate_check',
        type: 'system',
        trigger: 'Ręczne dodawanie leada (Admin)',
        action: 'Wykrywa duplikaty (email/tel) i proponuje połączenie z istniejącym klientem',
        recipient: 'Panel Admina',
        defaultEnabled: true,
        locked: true
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
        defaultEnabled: true,
        locked: true // Controlled by Process Map
    },
    {
        id: 'sms_lead_welcome',
        type: 'sms',
        trigger: 'Utworzenie nowego leada',
        action: '(Planowane) Wysyła SMS powitalny',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'sms_measurement_reminder',
        type: 'sms',
        trigger: '24h przed pomiarem',
        action: '(Planowane) Wysyła SMS przypominający o pomiarze',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'remind_advance_payment',
        type: 'sms',
        trigger: '3 dni braku wpłaty zaliczki',
        action: '(Planowane) Wysyła SMS przypominający o wpłacie',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'confirm_installation_date',
        type: 'sms',
        trigger: 'Ustalenie daty montażu',
        action: '(Planowane) Wysyła SMS z potwierdzeniem terminu',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'request_review',
        type: 'sms',
        trigger: 'Zakończenie montażu',
        action: '(Planowane) Wysyła SMS z prośbą o opinię',
        recipient: 'Klient',
        defaultEnabled: false
    },
    {
        id: 'notify_measurer_new_job',
        type: 'email',
        trigger: 'Przypisanie pomiarowca do zlecenia',
        action: 'Wysyła powiadomienie o nowym zleceniu',
        recipient: 'Montażysta',
        defaultEnabled: true
    },
    {
        id: 'send_contract_link',
        type: 'email',
        trigger: 'Zmiana statusu na "Formalności"',
        action: 'Wysyła link do umowy i zaliczki',
        recipient: 'Klient',
        defaultEnabled: true
    },
    {
        id: 'send_protocol_link',
        type: 'sms',
        trigger: 'Zakończenie prac montażowych',
        action: 'Wysyła link do protokołu odbioru',
        recipient: 'Klient',
        defaultEnabled: true
    }
];
