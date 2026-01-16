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

export type NotificationRecipient = string | { email?: string | null; phone?: string | null };

export async function sendNotification(
    eventId: NotificationEventId, 
    recipient: NotificationRecipient, 
    data: NotificationData,
    relatedEntity?: NotifiableEntity
) {
    console.log(`[NotificationService] Processing ${eventId}`);

    // Resolve targets
    const emailTarget = typeof recipient === 'string' ? recipient : recipient.email;
    const phoneTarget = typeof recipient === 'string' ? recipient : recipient.phone;

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
        Object.entries(data).forEach(([key, value]) => {
            const valStr = value === null || value === undefined ? '' : String(value);
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
            content = content.replace(regex, valStr);
            subject = subject.replace(regex, valStr);
        });

        // B. Send
        let result: { success: boolean; error?: string; providerId?: string | undefined; } = { success: false, error: 'Unknown' };
        let actualRecipient = '';

        if (template.channel === 'email') {
            if (emailTarget) {
                actualRecipient = emailTarget;
                result = await sendEmailChannel(emailTarget, subject, content);
            } else {
                result = { success: false, error: 'No email address provided' };
            }
        } else if (template.channel === 'sms') {
            if (phoneTarget) {
                actualRecipient = phoneTarget;
                result = await sendSmsChannel(phoneTarget, content); 
            } else {
                result = { success: false, error: 'No phone number provided' };
            }
        } else if (template.channel === 'system') {
            result = { success: true, providerId: 'system-mock' };
        }

        if (result.error === 'No email address provided' || result.error === 'No phone number provided') {
           // Skip logging or log as skipped?
           // Probably skip to avoid noise.
           continue; 
        }

        // C. Log
        try {
            await db.insert(notificationLogs).values({
                eventId,
                channel: template.channel,
                recipient: actualRecipient,
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
