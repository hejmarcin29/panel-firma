import { getCalendarClient } from './client';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

export type GoogleCalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: { email: string }[];
};

export async function createGoogleCalendarEvent(event: GoogleCalendarEvent) {
  const calendarId = await getAppSetting(appSettingKeys.googleCalendarId);
  if (!calendarId) return null;
  const calendar = await getCalendarClient();
  if (!calendar) return null;

  try {
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });
    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

export async function updateGoogleCalendarEvent(eventId: string, event: Partial<GoogleCalendarEvent>) {
  const calendarId = await getAppSetting(appSettingKeys.googleCalendarId);
  if (!calendarId) return null;
  const calendar = await getCalendarClient();
  if (!calendar) return null;

  try {
    await calendar.events.patch({
      calendarId: calendarId,
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
  const calendarId = await getAppSetting(appSettingKeys.googleCalendarId);
  if (!calendarId) return null;
  const calendar = await getCalendarClient();
  if (!calendar) return null;

  try {
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}
