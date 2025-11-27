import { db } from '@/lib/db';
import { montages, googleCalendarSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCalendarClient } from './calendar';
import { format } from 'date-fns';

export async function syncMontageToGoogle(montageId: string, userId: string) {
  const montage = await db.query.montages.findFirst({
    where: eq(montages.id, montageId),
  });

  if (!montage || !montage.scheduledInstallationAt) {
    return;
  }

  const settings = await db.query.googleCalendarSettings.findFirst({
    where: eq(googleCalendarSettings.userId, userId),
  });

  if (!settings || !settings.targetCalendarId) {
    return;
  }

  const calendar = await getCalendarClient(userId);
  if (!calendar) {
    return;
  }

  const startDate = montage.scheduledInstallationAt;
  const endDate = montage.scheduledInstallationEndAt || startDate;

  // Google Calendar requires end date to be at least the next day for all-day events
  // or specific time. Assuming all-day events for now.
  // For all-day events, end date is exclusive.
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(new Date(endDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const event = {
    summary: `Montaż: ${montage.clientName}`,
    description: `Adres: ${montage.address || 'Brak adresu'}\nTelefon: ${montage.contactPhone || 'Brak'}\nSzczegóły: ${montage.materialDetails || 'Brak'}`,
    location: montage.address || undefined,
    start: {
      date: startStr,
    },
    end: {
      date: endStr,
    },
  };

  try {
    if (montage.googleEventId) {
      try {
        await calendar.events.update({
          calendarId: settings.targetCalendarId,
          eventId: montage.googleEventId,
          requestBody: event,
        });
        console.log('Updated Google Calendar event:', montage.googleEventId);
      } catch (error: any) {
        if (error.code === 404 || error.code === 410) {
           // Event deleted in Google, recreate
           const res = await calendar.events.insert({
            calendarId: settings.targetCalendarId,
            requestBody: event,
          });
          if (res.data.id) {
            await db.update(montages).set({ googleEventId: res.data.id }).where(eq(montages.id, montageId));
            console.log('Recreated Google Calendar event:', res.data.id);
          }
        } else {
          throw error;
        }
      }
    } else {
      const res = await calendar.events.insert({
        calendarId: settings.targetCalendarId,
        requestBody: event,
      });
      if (res.data.id) {
        await db.update(montages).set({ googleEventId: res.data.id }).where(eq(montages.id, montageId));
        console.log('Created Google Calendar event:', res.data.id);
      }
    }
  } catch (error) {
    console.error('Failed to sync with Google Calendar:', error);
  }
}

export async function deleteGoogleEvent(montageId: string, userId: string) {
  const montage = await db.query.montages.findFirst({
    where: eq(montages.id, montageId),
  });

  if (!montage || !montage.googleEventId) {
    return;
  }

  const settings = await db.query.googleCalendarSettings.findFirst({
    where: eq(googleCalendarSettings.userId, userId),
  });

  if (!settings || !settings.targetCalendarId) {
    return;
  }

  const calendar = await getCalendarClient(userId);
  if (!calendar) {
    return;
  }

  try {
    await calendar.events.delete({
      calendarId: settings.targetCalendarId,
      eventId: montage.googleEventId,
    });
    await db.update(montages).set({ googleEventId: null }).where(eq(montages.id, montageId));
    console.log('Deleted Google Calendar event:', montage.googleEventId);
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
  }
}
