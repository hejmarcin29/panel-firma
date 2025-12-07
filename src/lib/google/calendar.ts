import { getCalendarClient } from './client';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

export type GoogleCalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

export async function createGoogleCalendarEvent(event: GoogleCalendarEvent) {
  if (!CALENDAR_ID) return null;
  const calendar = await getCalendarClient();
  if (!calendar) return null;

  try {
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });
    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

export async function updateGoogleCalendarEvent(eventId: string, event: Partial<GoogleCalendarEvent>) {
  if (!CALENDAR_ID) return null;
  const calendar = await getCalendarClient();
  if (!calendar) return null;

  try {
    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId: eventId,
      requestBody: event,
    });
    return true;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  if (!CALENDAR_ID) return null;
  const calendar = await getCalendarClient();
  if (!calendar) return null;

  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}
