'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { setAppSetting, appSettingKeys, getAppSetting } from '@/lib/settings';
import { getCalendarClient } from '@/lib/google/client';

export async function testGoogleCalendarConnection() {
  await requireUser();
  
  const calendarId = await getAppSetting(appSettingKeys.googleCalendarId);
  if (!calendarId) {
    return { success: false, message: 'Brak skonfigurowanego ID kalendarza.' };
  }

  const calendar = await getCalendarClient();
  if (!calendar) {
    return { success: false, message: 'Błąd autoryzacji (sprawdź e-mail i klucz prywatny).' };
  }

  try {
    // Try to get the calendar details to verify access
    await calendar.calendars.get({
      calendarId: calendarId,
    });
    return { success: true, message: `Połączono z kalendarzem: ${calendarId}` };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Google Calendar Test Error:', error);
    // Check for common errors
    if (error.code === 404) {
         return { success: false, message: `Nie znaleziono kalendarza o ID: ${calendarId}. Sprawdź czy ID jest poprawne oraz czy udostępniłeś ten kalendarz dla adresu e-mail konta usługi (Service Account).` };
    }
    if (error.code === 403) {
         return { success: false, message: `Brak dostępu do kalendarza. Upewnij się, że udostępniłeś kalendarz dla adresu e-mail konta usługi.` };
    }
    return { success: false, message: `Błąd połączenia: ${error.message || 'Nieznany błąd'}` };
  }
}

export async function saveGoogleCalendarSettings(formData: FormData) {
  const user = await requireUser();
  const calendarId = formData.get('calendarId') as string;
  const clientEmail = formData.get('clientEmail') as string;
  const privateKey = formData.get('privateKey') as string;

  await setAppSetting({
    key: appSettingKeys.googleCalendarId,
    value: calendarId,
    userId: user.id,
  });

  await setAppSetting({
    key: appSettingKeys.googleClientEmail,
    value: clientEmail,
    userId: user.id,
  });

  await setAppSetting({
    key: appSettingKeys.googlePrivateKey,
    value: privateKey,
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
