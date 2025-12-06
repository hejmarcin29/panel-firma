import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/db';
import { googleIntegrations } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth credentials');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=google_auth_error', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', request.url));
  }

  try {
    // We need the user session to link the integration
    // Note: This route handler needs to be able to access the session cookie.
    const user = await requireUser();

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Save tokens to DB
    // Check if integration already exists
    const existing = await db.query.googleIntegrations.findFirst({
      where: eq(googleIntegrations.userId, user.id),
    });

    const integrationData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined, // Only update if present (it's only returned on first consent or if prompt=consent)
      scope: tokens.scope || '',
      tokenType: tokens.token_type || 'Bearer',
      expiryDate: tokens.expiry_date || 0,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(googleIntegrations)
        .set(integrationData)
        .where(eq(googleIntegrations.userId, user.id));
    } else {
      await db.insert(googleIntegrations).values({
        id: crypto.randomUUID(),
        userId: user.id,
        ...integrationData,
        refreshToken: tokens.refresh_token || null, // Required for new insert if we want offline access
      });
    }

    return NextResponse.redirect(new URL('/dashboard/settings?success=google_connected', request.url));

  } catch (err) {
    console.error('Error exchanging code for token:', err);
    return NextResponse.redirect(new URL('/dashboard/settings?error=token_exchange_failed', request.url));
  }
}
