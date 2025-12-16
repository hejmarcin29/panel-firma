'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { appSettingKeys, setAppSetting } from '@/lib/settings';

export async function updateReferralSettings(enabled: boolean) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) {
        throw new Error('Brak uprawnień');
    }

    await setAppSetting({
        key: appSettingKeys.referralProgramEnabled,
        value: enabled ? 'true' : 'false',
        userId: user.id,
    });

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard/montaze');
}
