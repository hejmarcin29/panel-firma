import { google } from 'googleapis';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

export async function getUserCalendarClient(userId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { googleRefreshToken: true }
    });

    if (!user || !user.googleRefreshToken) {
        return null;
    }

    const clientId = await getAppSetting(appSettingKeys.googleOAuthClientId);
    const clientSecret = await getAppSetting(appSettingKeys.googleOAuthClientSecret);
    // Use dynamic base URL if possible, but here we are in a library function
    // Ideally we should pass the base URL or use a default
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://b2b.primepodloga.pl'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
        console.error('Missing Google OAuth credentials in settings');
        return null;
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}
