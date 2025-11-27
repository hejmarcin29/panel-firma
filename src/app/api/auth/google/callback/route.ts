import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/google/calendar';
import { db } from '@/lib/db';
import { googleCalendarSettings } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=google_auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', request.url));
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const tokens = await getTokens(code);

    // Check if settings exist
    const existingSettings = await db.query.googleCalendarSettings.findFirst({
      where: eq(googleCalendarSettings.userId, user.id),
    });

    if (existingSettings) {
      await db
        .update(googleCalendarSettings)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingSettings.refreshToken, // Keep old refresh token if not returned
          expiryDate: tokens.expiry_date,
          updatedAt: new Date(),
        })
        .where(eq(googleCalendarSettings.userId, user.id));
    } else {
      await db.insert(googleCalendarSettings).values({
        id: randomUUID(),
        userId: user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      });
    }

    return NextResponse.redirect(new URL('/dashboard/settings?success=google_connected', request.url));
  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.redirect(new URL('/dashboard/settings?error=server_error', request.url));
  }
}
