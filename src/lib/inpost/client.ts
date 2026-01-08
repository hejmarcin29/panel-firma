import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { CreateShipmentRequest, CreateShipmentResponse } from './types';

const PROD_API_URL = 'https://api-shipx-pl.easypack24.net/v1';
const SANDBOX_API_URL = 'https://sandbox-api-shipx-pl.easypack24.net/v1';

async function getClientConfig() {
    const [orgId, token, sandboxInfo] = await Promise.all([
        getAppSetting(appSettingKeys.inpostOrgId),
        getAppSetting(appSettingKeys.inpostToken),
        getAppSetting(appSettingKeys.inpostSandbox),
    ]);

    if (!orgId || !token) {
        throw new Error('Brak konfiguracji InPost (ID Organizacji lub Token). Skonfiguruj w Ustawieniach.');
    }

    const isSandbox = sandboxInfo === 'true';
    const baseUrl = isSandbox ? SANDBOX_API_URL : PROD_API_URL;

    return { orgId, token, baseUrl };
}

/**
 * Tworzy nową przesyłkę w systemie ShipX.
 */
export async function createShipment(payload: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    const { orgId, token, baseUrl } = await getClientConfig();
    
    // Endpoint: /organizations/{id}/shipments
    const url = `${baseUrl}/organizations/${orgId}/shipments`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorDetails = '';
        try {
            const errorBody = await response.json();
            errorDetails = JSON.stringify(errorBody);
        } catch {
            errorDetails = await response.text();
        }
        throw new Error(`Błąd tworzenia przesyłki InPost: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    return response.json();
}

/**
 * Pobiera etykietę PDF dla danej przesyłki (ID).
 * Zwraca Buffer z danymi PDF.
 */
export async function getShipmentLabel(shipmentId: number): Promise<ArrayBuffer> {
    const { token, baseUrl } = await getClientConfig();

    // Endpoint: /shipments/{id}/label?format=pdf&type=A6
    // Domyślnie bierzemy PDF A6
    const url = `${baseUrl}/shipments/${shipmentId}/label?format=pdf&type=A6`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Błąd pobierania etykiety InPost: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
}

/**
 * Pobiera listę punktów (paczkomatów) - opcjonalne, bo mamy widget na froncie.
 * Ale może się przydać do walidacji.
 */
export async function getPointDetails(pointName: string) {
    const { token, baseUrl } = await getClientConfig();
    
    const url = `${baseUrl}/points/${pointName}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) return null;
    return response.json();
}
