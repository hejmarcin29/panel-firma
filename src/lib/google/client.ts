import { google } from 'googleapis';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

export async function getGoogleAuth() {
  const clientEmail = await getAppSetting(appSettingKeys.googleClientEmail);
  let privateKey = await getAppSetting(appSettingKeys.googlePrivateKey);

  // Fallback to env vars if not in DB (handled by getAppSetting fallback logic, but explicit check here for safety if needed)
  // Actually getAppSetting already handles the fallback to process.env via readEnvFallback in settings.ts
  
  if (!clientEmail || !privateKey) {
    return null;
  }

  // Handle newlines in private key
  privateKey = privateKey.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

export async function getCalendarClient() {
  const auth = await getGoogleAuth();
  if (!auth) return null;

  return google.calendar({ version: 'v3', auth });
}
