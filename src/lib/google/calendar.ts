import { google } from 'googleapis';
import { db } from '@/lib/db';
import { googleCalendarSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh_token
  });
}

export async function getTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getCalendarClient(userId: string) {
  const settings = await db.query.googleCalendarSettings.findFirst({
    where: eq(googleCalendarSettings.userId, userId),
  });

  if (!settings || !settings.refreshToken) {
    return null;
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  client.setCredentials({
    refresh_token: settings.refreshToken,
    access_token: settings.accessToken || undefined,
    expiry_date: settings.expiryDate || undefined,
  });

  // Handle token refresh automatically
  client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await db
        .update(googleCalendarSettings)
        .set({
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          expiryDate: tokens.expiry_date,
        })
        .where(eq(googleCalendarSettings.userId, userId));
    } else if (tokens.access_token) {
       await db
        .update(googleCalendarSettings)
        .set({
          accessToken: tokens.access_token,
          expiryDate: tokens.expiry_date,
        })
        .where(eq(googleCalendarSettings.userId, userId));
    }
  });

  return google.calendar({ version: 'v3', auth: client });
}
