'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { setAppSetting, appSettingKeys } from '@/lib/settings';

export async function saveGoogleCalendarSettings(formData: FormData) {
  const user = await requireUser();
  const calendarId = formData.get('calendarId') as string;

  await setAppSetting({
    key: appSettingKeys.googleCalendarId,
    value: calendarId,
    userId: user.id,
  });

  revalidatePath('/dashboard/settings');
}

export async function getGoogleAuthUrl(): Promise<string> {
  // Placeholder implementation to fix build error
  console.warn('getGoogleAuthUrl not implemented');
  return '#';
}

export async function disconnectGoogle(): Promise<void> {
  // Placeholder implementation to fix build error
  console.warn('disconnectGoogle not implemented');
}
