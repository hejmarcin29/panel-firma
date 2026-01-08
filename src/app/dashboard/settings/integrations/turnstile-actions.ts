'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { appSettingKeys } from '@/lib/settings';

export async function saveTurnstileSettings(formData: FormData) {
    const user = await requireUser();

    const siteKey = formData.get('siteKey') as string;
    const secretKey = formData.get('secretKey') as string;

    const settingsToUpdate = [
        { key: appSettingKeys.cloudflareTurnstileSiteKey, value: siteKey },
        { key: appSettingKeys.cloudflareTurnstileSecretKey, value: secretKey },
    ];

    for (const setting of settingsToUpdate) {
        await db
            .insert(appSettings)
            .values({
                key: setting.key,
                value: setting.value || '',
                updatedBy: user.id,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: appSettings.key,
                set: {
                    value: setting.value || '',
                    updatedBy: user.id,
                    updatedAt: new Date(),
                },
            });
    }

    revalidatePath('/dashboard/settings');
}
