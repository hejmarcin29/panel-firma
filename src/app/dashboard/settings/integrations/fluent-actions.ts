'use server';

import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { requireUser } from '@/lib/auth/session';

const SETTING_KEY = 'fluent_forms_secret';

export async function getFluentFormsSecret() {
    await requireUser();
    
    const setting = await db.query.appSettings.findFirst({
        where: eq(appSettings.key, SETTING_KEY),
    });

    return setting?.value || null;
}

export async function regenerateFluentFormsSecret() {
    const user = await requireUser();
    
    // Generate a random secret starting with sk_
    const newSecret = `sk_${crypto.randomBytes(24).toString('hex')}`;

    await db.insert(appSettings)
        .values({
            key: SETTING_KEY,
            value: newSecret,
            updatedBy: user.id,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: appSettings.key,
            set: {
                value: newSecret,
                updatedBy: user.id,
                updatedAt: new Date(),
            },
        });

    revalidatePath('/dashboard/settings');
    return newSecret;
}
