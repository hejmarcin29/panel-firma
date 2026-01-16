import { sendSms } from '@/lib/sms';

export async function sendSmsChannel(recipient: string, message: string) {
    // Basic wrapper
    const result = await sendSms(recipient, message);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    return { success: true, providerId: 'sms-api' };
}
