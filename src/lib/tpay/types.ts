export interface TpayConfig {
    clientId: string;
    clientSecret: string;
    isSandbox: boolean;
}

export interface CreatePaymentParams {
    amount: number; // in GROSZE (e.g. 15000 for 150.00 PLN)
    description: string;
    email: string;
    name: string;
    crc: string; // Unique identifier (ORDER_123 or MONTAGE_456)
    returnUrl: string; // Where user goes after payment
    hiddenDescription?: string;
}

export interface TpayTransaction {
    transactionId: string;
    title: string;
    url: string; // Payment link
    amount: number;
    crc: string;
}

export interface TpayNotification {
    id: string; // Transaction ID
    tr_id: string; // Transaction ID (Tpay uses both)
    tr_date: string;
    tr_crc: string;
    tr_amount: number;
    tr_paid: number;
    tr_desc: string;
    tr_status: 'TRUE' | 'FALSE' | 'CHARGEBACK';
    tr_error: string;
    tr_email: string;
    md5sum: string; // Legacy signature
    test_mode?: number; 
    wallet?: string;
}
