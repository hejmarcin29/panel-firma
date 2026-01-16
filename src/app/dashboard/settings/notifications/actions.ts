'use server';

import { db } from '@/lib/db';
import { notificationTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { sendEmailChannel } from '@/lib/notifications/channels/email';
import { sendSmsChannel } from '@/lib/notifications/channels/sms';
import { NOTIFICATION_EVENTS } from '@/lib/notifications/events';

export async function getTemplates() {
    return await db.query.notificationTemplates.findMany();
}

export async function updateTemplate(id: string, data: { subject?: string; content?: string; isActive?: boolean }) {
    await db.update(notificationTemplates)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(notificationTemplates.id, id));
    revalidatePath('/dashboard/settings');
}

export async function toggleChannel(eventId: string, channel: 'email' | 'sms' | 'system', state: boolean) {
    const existing = await db.query.notificationTemplates.findFirst({
        where: and(
            eq(notificationTemplates.eventId, eventId),
            eq(notificationTemplates.channel, channel)
        )
    });

    if (existing) {
        await db.update(notificationTemplates)
            .set({ isActive: state })
            .where(eq(notificationTemplates.id, existing.id));
    } else {
        // Create default if not exists
        if (state) {
            const eventDef = Object.values(NOTIFICATION_EVENTS).find(e => e.id === eventId);
            const defaultSubject = eventDef ? eventDef.label : 'Powiadomienie';
            
            await db.insert(notificationTemplates).values({
                eventId,
                channel,
                content: channel === 'email' ? '<p>Wpisz treść powiadomienia...</p>' : 'Wpisz treść SMS...',
                isActive: true,
                subject: channel === 'email' ? defaultSubject : null
            });
        }
    }
    revalidatePath('/dashboard/settings');
}

export async function sendTest(templateId: string, recipient: string) {
    console.log('[NotificationTest] Sending test for', templateId, 'to', recipient);
    
    const template = await db.query.notificationTemplates.findFirst({
        where: eq(notificationTemplates.id, templateId)
    });
    
    if (!template) return { success: false, error: 'Szablon nie istnieje' };
    
    // 1. Mock Data Injection
    let subject = template.subject || 'Test Subject';
    let content = template.content;
    
    const mockData: Record<string, string> = {
        order_id: 'TEST-12345',
        client_name: 'Jan Testowy',
        total_amount: '1 234,00 PLN',
        quote_link: 'https://primepodloga.pl/oferta/123',
        tracking_link: 'https://inpost.pl/sledzenie?number=123',
        tracking_number: '623000000000',
        carrier: 'InPost',
        date: '01.01.2026',
        time: '10:00',
        address: 'ul. Przykładowa 1/2, Warszawa',
        partner_name: 'Firma Partnerska Sp. z o.o.',
        login_link: 'https://b2b.primepodloga.pl/login'
    };
    
    // Replace Variables
    Object.entries(mockData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        content = content.replace(regex, value);
        subject = subject.replace(regex, value);
    });
    
    // 2. Send via Channel
    if (template.channel === 'email') {
        return await sendEmailChannel(recipient, subject, content);
    } else if (template.channel === 'sms') {
        return await sendSmsChannel(recipient, content);
    } else {
        return { success: true, providerId: 'system-test-ok' };
    }
}
