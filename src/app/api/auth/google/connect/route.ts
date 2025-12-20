import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Ensure user is logged in
    // Note: In a real scenario, we might want to pass a state parameter to prevent CSRF
    // and to know where to redirect back.
    
    const clientId = await getAppSetting(appSettingKeys.googleOAuthClientId);
    const clientSecret = await getAppSetting(appSettingKeys.googleOAuthClientSecret);
    
    // Determine base URL dynamically if env var is missing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Missing Google OAuth credentials in settings' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // 'offline' gets refresh_token
        scope: [
            'https://www.googleapis.com/auth/calendar.events', // Manage events
            'https://www.googleapis.com/auth/calendar.readonly' // Read calendars
        ],
        prompt: 'consent', // Force consent to ensure we get a refresh token
    });

    return NextResponse.redirect(authorizeUrl);
}
