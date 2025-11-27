import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export async function getCalendarClient() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!clientEmail || !privateKey || !calendarId) {
        // Silent return if not configured, or log warning
        return null;
    }

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
    });

    return {
        calendar: google.calendar({ version: 'v3', auth }),
        calendarId
    };
}

export async function createOrUpdateEvent({
    eventId,
    summary,
    description,
    location,
    start,
    end
}: {
    eventId?: string | null;
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
}) {
    const client = await getCalendarClient();
    if (!client) return null;

    const { calendar, calendarId } = client;

    const event = {
        summary,
        description,
        location,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
    };

    try {
        if (eventId) {
            // Try to get the event first to see if it exists
            try {
                await calendar.events.get({ calendarId, eventId });
                // Update existing
                const res = await calendar.events.update({
                    calendarId,
                    eventId,
                    requestBody: event,
                });
                return res.data.id;
            } catch {
                // If not found (404), create new
                const res = await calendar.events.insert({
                    calendarId,
                    requestBody: event,
                });
                return res.data.id;
            }
        } else {
            // Create new
            const res = await calendar.events.insert({
                calendarId,
                requestBody: event,
            });
            return res.data.id;
        }
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return null;
    }
}
