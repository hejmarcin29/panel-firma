import { createTransport } from 'nodemailer';
import { db } from '@/lib/db';
import { mailAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decodeSecret } from '@/lib/utils';

export async function sendEmailChannel(to: string, subject: string, html: string) {
    // 1. Get default connected account (or any connected)
    const account = await db.query.mailAccounts.findFirst({
        where: eq(mailAccounts.status, 'connected')
    });
    
    if (!account) {
        console.error('CoreNotification: No connected mail account found.');
        return { success: false, error: 'No mail account' };
    }
    
    if (!account.smtpHost || !account.smtpPort || !account.passwordSecret) {
        console.error('CoreNotification: Incomplete SMTP config for account', account.email);
        return { success: false, error: 'Incomplete SMTP config' };
    }

    const password = decodeSecret(account.passwordSecret);
    if (!password) {
        return { success: false, error: 'Password decode failed' };
    }
    
    try {
        const transporter = createTransport({
            host: account.smtpHost,
            port: account.smtpPort,
            secure: Boolean(account.smtpSecure),
            auth: {
                user: account.username,
                pass: password,
            }
        });
        
        // 2. Send
        await transporter.sendMail({
            from: `"${account.displayName}" <${account.email}>`,
            to,
            subject,
            html
        });
        
        return { success: true, providerId: `smtp-${Date.now()}` };
    } catch (e: any) {
        console.error('CoreNotification: Email send failed', e);
        return { success: false, error: e.message || 'Unknown error' };
    }
}
