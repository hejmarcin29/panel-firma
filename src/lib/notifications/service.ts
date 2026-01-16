import { db } from '@/lib/db';
import { notificationLogs, notificationTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmailChannel } from './channels/email';
import { sendSmsChannel } from './channels/sms';
import { NotificationEventId, NotificationData } from './events';

type NotifiableEntity = {
    id: string;
    type: 'order' | 'montage' | 'quote' | 'customer' | 'partner' | 'invoice';
};

export async function sendNotification(
    eventId: NotificationEventId, 
    recipient: string, 
    data: NotificationData,
    relatedEntity?: NotifiableEntity
) {
    console.log(`[NotificationService] Processing ${eventId} for ${recipient}`);

    // VALIDATION: Ensure recipient is valid
    if (!recipient || recipient.trim() === '') {
        console.warn(`[NotificationService] Empty recipient for ${eventId}. Skipping.`);
        return;
    }

    // 1. Fetch active templates for this event
    const templates = await db.query.notificationTemplates.findMany({
        where: and(
            eq(notificationTemplates.eventId, eventId),
            eq(notificationTemplates.isActive, true)
        )
    });

    if (templates.length === 0) {
        console.log(`[NotificationService] No active templates for ${eventId}. Skipping.`);
        return;
    }

    const results = [];

    // 2. Process each template (Channel)
    for (const template of templates) {
        // A. Render content
        let subject = template.subject || '';
        let content = template.content || '';
        
        // Replace variables {{var}}
        // Simple regex replace for now. Could use Handlebars/Mustache if needed.
        Object.entries(data).forEach(([key, value]) => {
            const valStr = value === null || value === undefined ? '' : String(value);
            // Case insensitive replace {{KEY}} or {{key}}
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
            content = content.replace(regex, valStr);
            subject = subject.replace(regex, valStr);
        });

        // B. Send
        let result: { success: boolean; error?: string; providerId?: string | undefined; } = { success: false, error: 'Unknown' };
        
        if (template.channel === 'email') {
            result = await sendEmailChannel(recipient, subject, content);
        } else if (template.channel === 'sms') {
            result = await sendSmsChannel(recipient, content); 
        } else if (template.channel === 'system') {
            // TODO: In-app notification integration
            result = { success: true, providerId: 'system-mock' };
        }

        // C. Log
        try {
            await db.insert(notificationLogs).values({
                eventId,
                channel: template.channel,
                recipient,
                subject: template.channel === 'email' ? subject : null,
                content: content.slice(0, 5000), // Safety clip
                status: result.success ? 'sent' : 'failed',
                error: result.error || null,
                providerId: result.providerId || null,
                relatedEntityId: relatedEntity?.id,
                relatedEntityType: relatedEntity?.type
            });
        } catch (logErr) {
            console.error('Failed to log notification', logErr);
        }
        
        results.push(result);
    }
    
    return results;
}
