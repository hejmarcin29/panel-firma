import 'server-only';

import { appSettingKeys, getAppSetting } from './settings';

interface SmsResult {
    success: boolean;
    error?: string;
    messageId?: string;
}

export async function sendSms(phoneNumber: string, message: string): Promise<SmsResult> {
    try {
        const [provider, token, senderName] = await Promise.all([
            getAppSetting(appSettingKeys.smsProvider),
            getAppSetting(appSettingKeys.smsToken),
            getAppSetting(appSettingKeys.smsSenderName),
        ]);

        if (!token) {
            return { success: false, error: 'Brak konfiguracji bramki SMS (brak tokenu).' };
        }

        // Normalize phone number (remove spaces, dashes, ensure +48 or similar if needed)
        // SMSAPI usually expects numbers like 48xxxxxxxxx or just xxxxxxxxx
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // Basic validation
        if (cleanPhone.length < 9) {
            return { success: false, error: 'Nieprawidłowy numer telefonu.' };
        }

        if (provider === 'smsapi' || !provider) { // Default to smsapi
            return await sendViaSmsApi(token, senderName || 'Info', cleanPhone, message);
        }

        return { success: false, error: `Nieobsługiwany dostawca SMS: ${provider}` };

    } catch (error) {
        console.error('SMS Send Error:', error);
        return { success: false, error: 'Wystąpił błąd podczas wysyłania SMS.' };
    }
}

async function sendViaSmsApi(token: string, from: string, to: string, message: string): Promise<SmsResult> {
    const params = new URLSearchParams({
        to: to,
        from: from,
        message: message,
        format: 'json',
    });

    try {
        const response = await fetch('https://api.smsapi.pl/sms.do', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('SMSAPI Error Response:', text);
            return { success: false, error: `Błąd API SMS: ${response.statusText}` };
        }

        const data = await response.json();

        // SMSAPI returns a list of messages sent or an error object
        if (data.error) {
             return { success: false, error: `Błąd SMSAPI: ${data.message || data.error}` };
        }

        if (data.list && data.list.length > 0) {
             return { success: true, messageId: data.list[0].id };
        }
        
        // Fallback success check
        return { success: true };

    } catch (error) {
        console.error('SMSAPI Fetch Error:', error);
        return { success: false, error: 'Błąd połączenia z bramką SMS.' };
    }
}
