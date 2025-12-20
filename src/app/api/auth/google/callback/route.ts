import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=google_auth_failed`);
    }

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`);
    }

    try {
        // We need the user session to know who is connecting
        // Since this is a callback, the cookie should be present
        const user = await requireUser();

        const clientId = await getAppSetting(appSettingKeys.googleOAuthClientId);
        const clientSecret = await getAppSetting(appSettingKeys.googleOAuthClientSecret);
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

        if (!clientId || !clientSecret) {
             console.error('Missing Google OAuth credentials in settings');
             return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=config_missing`);
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);

        if (tokens.refresh_token) {
            // Save the refresh token to the user's record
            await db.update(users)
                .set({ googleRefreshToken: tokens.refresh_token })
                .where(eq(users.id, user.id));
        } else {
            // If no refresh token (e.g. user re-authorized without prompt='consent'), 
            // we might already have it, or we missed it. 
            // Ideally we force prompt='consent' in the connect route.
            console.warn('No refresh token received from Google');
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=google_connected`);

    } catch (err) {
        console.error('Error exchanging code for token:', err);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=exchange_failed`);
    }
}
