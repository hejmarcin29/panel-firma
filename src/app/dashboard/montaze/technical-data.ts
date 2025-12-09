export interface TechnicalAuditData {
    humidity: number | null;
    humidityMethod: 'CM' | 'electric' | 'other';
    flatness: 'ok' | 'grinding' | 'leveling' | null;
    subfloorType: 'concrete' | 'anhydrite' | 'osb' | 'other' | null;
    heating: boolean;
    heatingProtocol: boolean;
    notes: string;
    photos: string[]; // URLs
}

export interface MaterialItem {
    id: string;
    name: string;
    unit: 'szt' | 'kg' | 'l' | 'op';
    issued: number;
    consumed: number;
    returned: number;
}

export interface MaterialLogData {
    items: MaterialItem[];
    subfloorAccepted: boolean;
    subfloorAcceptedAt: string | null; // ISO date
    subfloorAcceptedBy: string | null; // User ID
    notes: string;
}
