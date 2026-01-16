export const NOTIFICATION_EVENTS = {
    // 🛒 Shop
    ORDER_CREATED: {
        id: 'ORDER_CREATED',
        label: 'Nowe Zamówienie',
        category: 'shop',
        variables: ['order_id', 'client_name', 'total_amount', 'order_link']
    },
    ORDER_PAID: {
        id: 'ORDER_PAID',
        label: 'Zamówienie Opłacone',
        category: 'shop',
        variables: ['order_id', 'client_name', 'payment_method']
    },
    ORDER_SHIPPED: {
        id: 'ORDER_SHIPPED',
        label: 'Zamówienie Wysłane',
        category: 'shop',
        variables: ['order_id', 'client_name', 'tracking_number', 'carrier', 'tracking_link']
    },
    
    // 📄 Offers & Docs
    QUOTE_SENT: {
        id: 'QUOTE_SENT',
        label: 'Wysłano Wycenę',
        category: 'crm',
        variables: ['quote_number', 'client_name', 'total_amount', 'quote_link']
    },
    
    // 🛠️ CRM / Montages
    MONTAGE_SCHEDULED: {
        id: 'MONTAGE_SCHEDULED',
        label: 'Ustalono Termin Montażu',
        category: 'crm',
        variables: ['montage_number', 'client_name', 'date', 'time', 'address', 'installer_name']
    },
    MEASUREMENT_SCHEDULED: {
        id: 'MEASUREMENT_SCHEDULED',
        label: 'Ustalono Termin Pomiaru',
        category: 'crm',
        variables: ['montage_number', 'client_name', 'date', 'time', 'address']
    },
    CLIENT_DATA_REQUEST: {
        id: 'CLIENT_DATA_REQUEST',
        label: 'Prośba o dane (Panel Klienta)',
        category: 'crm',
        variables: ['client_name', 'portal_link']
    },
    
    // 🤝 B2B
    PARTNER_WELCOME: {
        id: 'PARTNER_WELCOME',
        label: 'Rejestracja Partnera',
        category: 'b2b',
        variables: ['partner_name', 'login_link']
    }
} as const;

export type NotificationEventId = keyof typeof NOTIFICATION_EVENTS;

export type NotificationData = {
    [key: string]: string | number | undefined | null;
};
