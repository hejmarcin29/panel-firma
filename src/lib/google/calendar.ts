import { getCalendarClient, getUserCalendarClient } from './client';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

export type GoogleCalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: { email: string }[];
};

/**
 * Creates an event in the COMPANY calendar (Service Account)
 */
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

/**
 * Creates an event in a USER'S private calendar (OAuth)
 */
export async function createUserCalendarEvent(userId: string, event: GoogleCalendarEvent) {
    const calendar = await getUserCalendarClient(userId);
    if (!calendar) return null;

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary', // Use the user's primary calendar
            requestBody: event,
        });
        return response.data.id;
    } catch (error) {
        console.error(`Error creating User Calendar event for ${userId}:`, error);
        return null;
    }
}

export async function updateUserCalendarEvent(userId: string, eventId: string, event: Partial<GoogleCalendarEvent>) {
    const calendar = await getUserCalendarClient(userId);
    if (!calendar) return null;

    try {
        await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: event,
        });
        return true;
    } catch (error) {
        console.error(`Error updating User Calendar event for ${userId}:`, error);
        return false;
    }
}

export async function deleteUserCalendarEvent(userId: string, eventId: string) {
    const calendar = await getUserCalendarClient(userId);
    if (!calendar) return null;

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        return true;
    } catch (error) {
        console.error(`Error deleting User Calendar event for ${userId}:`, error);
        return false;
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

