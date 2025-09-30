import { db } from "@/db";
import {
  accounts,
  installerGooglePrefs,
  orderGoogleEvents,
  orders,
  clients,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function refreshGoogleToken(userId: string) {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")))
    .limit(1);
  const acc = rows[0];
  if (!acc) return null;
  const now = Math.floor(Date.now() / 1000);
  if (acc.expires_at && acc.expires_at > now + 60 && acc.access_token) {
    return { accessToken: acc.access_token };
  }
  if (!acc.refresh_token)
    return acc.access_token ? { accessToken: acc.access_token } : null;
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: acc.refresh_token,
  });
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!resp.ok)
    return acc.access_token ? { accessToken: acc.access_token } : null;
  const data = (await resp.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  if (data.access_token) {
    const expiresAt = data.expires_in ? now + data.expires_in : undefined;
    await db
      .update(accounts)
      .set({ access_token: data.access_token, expires_at: expiresAt })
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));
    return { accessToken: data.access_token };
  }
  return acc.access_token ? { accessToken: acc.access_token } : null;
}

export async function listMyCalendars(userId: string) {
  const tok = await refreshGoogleToken(userId);
  if (!tok?.accessToken) throw new Error("Brak tokenu Google");
  const resp = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: { Authorization: `Bearer ${tok.accessToken}` },
    },
  );
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error?.message || "Błąd Google API");
  return json;
}

export async function getPrefs(userId: string) {
  const rows = await db
    .select()
    .from(installerGooglePrefs)
    .where(eq(installerGooglePrefs.userId, userId))
    .limit(1);
  return rows[0] || null;
}

type PrefsInput = Partial<{
  calendarId: string | null;
  timeZone: string;
  defaultReminderMinutes: number;
  autoSync: boolean;
}>;
export async function savePrefs(userId: string, prefs: PrefsInput) {
  const existing = await getPrefs(userId);
  const payload: {
    calendarId?: string | null;
    timeZone?: string;
    defaultReminderMinutes?: number;
    autoSync?: boolean;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (prefs.calendarId !== undefined) payload.calendarId = prefs.calendarId;
  if (prefs.timeZone) payload.timeZone = prefs.timeZone;
  if (typeof prefs.defaultReminderMinutes === "number")
    payload.defaultReminderMinutes = prefs.defaultReminderMinutes;
  if (typeof prefs.autoSync === "boolean") payload.autoSync = prefs.autoSync;
  if (existing) {
    await db
      .update(installerGooglePrefs)
      .set(payload)
      .where(eq(installerGooglePrefs.userId, userId));
  } else {
    await db.insert(installerGooglePrefs).values({
      userId,
      calendarId: payload.calendarId ?? null,
      timeZone: payload.timeZone ?? "Europe/Warsaw",
      defaultReminderMinutes: payload.defaultReminderMinutes ?? 60,
      autoSync: payload.autoSync ?? true,
      updatedAt: new Date(),
    });
  }
}

function buildOrderSummary(orderNo: string | null, clientName: string | null) {
  return `Montaż${orderNo ? " #" + orderNo : ""}${clientName ? " – " + clientName : ""}`;
}

export async function upsertOrderEvent({ orderId }: { orderId: string }) {
  const [ord] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!ord) return;
  if (!ord.installerId || !ord.scheduledDate) return;
  // Completed/Cancelled shouldn't sync
  if (ord.status === "completed" || ord.status === "cancelled") return;
  const prefs = await getPrefs(ord.installerId);
  if (!prefs?.autoSync || !prefs.calendarId) return;
  const tok = await refreshGoogleToken(ord.installerId);
  if (!tok?.accessToken) return;
  // Get client name and orderNo
  const rows = await db
    .select({ clientName: clients.name, orderNo: orders.orderNo })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(eq(orders.id, orderId))
    .limit(1);
  const data = rows[0];
  const summary = buildOrderSummary(
    data?.orderNo ?? null,
    data?.clientName ?? null,
  );
  const dateIso = new Date(ord.scheduledDate as unknown as number)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD
  const eventBody = {
    summary,
    start: { date: dateIso, timeZone: prefs.timeZone },
    end: { date: dateIso, timeZone: prefs.timeZone },
    reminders: prefs.defaultReminderMinutes
      ? {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: prefs.defaultReminderMinutes },
          ],
        }
      : { useDefault: true },
  };
  // Check existing mapping
  const mrows = await db
    .select()
    .from(orderGoogleEvents)
    .where(eq(orderGoogleEvents.orderId, orderId))
    .limit(1);
  const mapping = mrows[0];
  if (!mapping) {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(prefs.calendarId!)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tok.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      },
    );
    const created = await resp.json().catch(() => ({}));
    if (resp.ok && created.id) {
      await db.insert(orderGoogleEvents).values({
        orderId,
        installerId: ord.installerId,
        calendarId: prefs.calendarId!,
        googleEventId: created.id,
        lastSyncedAt: new Date(),
      });
    }
  } else {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(mapping.calendarId)}/events/${encodeURIComponent(mapping.googleEventId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tok.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      },
    );
    if (resp.ok) {
      await db
        .update(orderGoogleEvents)
        .set({ lastSyncedAt: new Date() })
        .where(eq(orderGoogleEvents.orderId, orderId));
    }
  }
}

export async function deleteOrderEvent({ orderId }: { orderId: string }) {
  const mrows = await db
    .select()
    .from(orderGoogleEvents)
    .where(eq(orderGoogleEvents.orderId, orderId))
    .limit(1);
  const mapping = mrows[0];
  if (!mapping) return;
  const tok = await refreshGoogleToken(mapping.installerId);
  if (!tok?.accessToken) return;
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(mapping.calendarId)}/events/${encodeURIComponent(mapping.googleEventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tok.accessToken}` },
    },
  );
  await db
    .delete(orderGoogleEvents)
    .where(eq(orderGoogleEvents.orderId, orderId));
}
