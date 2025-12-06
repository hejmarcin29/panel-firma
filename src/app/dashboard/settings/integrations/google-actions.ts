'use server';

import { google } from 'googleapis';
import { db } from '@/lib/db';
import { googleIntegrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth credentials');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getGoogleAuthUrl() {
  const oauth2Client = getOAuth2Client();
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
  });

  return url;
}

export async function getGoogleIntegrationStatus() {
  const user = await requireUser();
  
  const integration = await db.query.googleIntegrations.findFirst({
    where: eq(googleIntegrations.userId, user.id),
  });

  if (!integration) {
    return { isConnected: false };
  }

  // Check if token is expired and refresh if needed could be done here, 
  // but for status check, existence is enough for UI.
  // We might want to store the connected email in the DB or fetch it here.
  
  return { 
    isConnected: true,
    // We could fetch the user profile to show the email, but that requires another API call.
    // For now, just showing connected status.
  };
}

export async function disconnectGoogle() {
  const user = await requireUser();

  await db.delete(googleIntegrations)
    .where(eq(googleIntegrations.userId, user.id));

  revalidatePath('/dashboard/settings');
}
