'use server';

import { db } from '@/lib/db';
import { users, mailAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';
import { createTransport } from 'nodemailer';

function decodeSecret(secret: string | null | undefined): string | null {
    if (!secret) return null;
    try {
        return Buffer.from(secret, 'base64').toString('utf8');
    } catch {
        return null;
    }
}

export async function registerPartner(formData: FormData) {
    const name = formData.get('name') as string;
    const companyName = formData.get('companyName') as string;
    const nip = formData.get('nip') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!name || !email || !nip) {
        return { error: 'Wypełnij wymagane pola.' };
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        return { error: 'Użytkownik z tym adresem email już istnieje.' };
    }

    // Create user
    const passwordHash = await hash(randomUUID(), 10); 
    
    await db.insert(users).values({
        id: randomUUID(),
        email,
        name,
        passwordHash,
        roles: ['partner'], // Role: Partner
        isActive: false, // Inactive by default
        partnerProfile: {
            companyName,
            nip,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Send notification to admin
    try {
        const account = await db.query.mailAccounts.findFirst({
            where: eq(mailAccounts.status, 'connected'),
        });

        if (account && account.smtpHost && account.smtpPort) {
            const password = decodeSecret(account.passwordSecret);
            if (password) {
                const transporter = createTransport({
                    host: account.smtpHost,
                    port: account.smtpPort,
                    secure: Boolean(account.smtpSecure),
                    auth: {
                        user: account.username,
                        pass: password,
                    },
                });

                await transporter.sendMail({
                    from: `"${account.displayName}" <${account.email}>`,
                    to: 'kontakt@primepodloga.pl',
                    subject: `Nowe zgłoszenie partnerskie (B2B): ${companyName}`,
                    html: `
                        <h3>Nowe zgłoszenie od Partnera B2B</h3>
                        <p><strong>Imię i nazwisko:</strong> ${name}</p>
                        <p><strong>Firma:</strong> ${companyName}</p>
                        <p><strong>NIP:</strong> ${nip}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Telefon:</strong> ${phone}</p>
                        <p>Zaloguj się do panelu, aby zweryfikować i aktywować konto.</p>
                    `,
                });
            }
        }
    } catch (error) {
        console.error('Failed to send admin notification', error);
    }

    return { success: true };
}
