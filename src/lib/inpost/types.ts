export interface InPostAddress {
    street: string;
    building_number: string;
    city: string;
    post_code: string;
    country_code: string;
}

export interface InPostReceiver {
    first_name?: string;
    last_name?: string;
    company_name?: string; // opcjonalne, ale warto mieć
    email: string;
    phone: string;
    address?: InPostAddress; // przy dostawie do paczkomatu adres odbiorcy nie zawsze jest wymagany, ale warto go mieć
}

export interface InPostSender {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email: string;
    phone: string;
    address: InPostAddress;
}

export interface InPostParcel {
    id?: string;
    template: 'small' | 'medium' | 'large'; // gabaryt A, B, C
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: 'mm';
    };
    weight?: {
        amount: number;
        unit: 'kg';
    };
}

// Główny payload do tworzenia przesyłki
export interface CreateShipmentRequest {
    receiver: InPostReceiver;
    parcels: InPostParcel[];
    service: 'inpost_locker_standard' | 'inpost_courier_standard'; // uproszczone, InPost ma ich więcej
    custom_attributes?: {
        target_point: string; // np. kod paczkomatu "WAW123"
    };
    reference?: string; // np. numer zamówienia / montażu
    comments?: string;
}

export interface CreateShipmentResponse {
    id: number;
    status: string;
    tracking_number: string;
    // ... inne pola
}
