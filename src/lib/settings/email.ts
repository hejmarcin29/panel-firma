import { eq } from "drizzle-orm";

import { db } from "@db/index";
import { settings } from "@db/schema";
import { DEFAULT_EMAIL_SETTINGS, type EmailSettings, type EmailSettingsInput, emailSettingsSchema } from "./schemas";

const EMAIL_SETTINGS_KEY = "email.settings";

export type EmailSettingsWithMeta = {
  settings: EmailSettings;
  updatedAt: Date | null;
  updatedById: string | null;
};

function parseStoredValue(value: string | null): EmailSettings {
  if (!value) {
    return DEFAULT_EMAIL_SETTINGS;
  }

  try {
    const parsed = JSON.parse(value);
    return emailSettingsSchema.parse(parsed);
  } catch (error) {
    console.error("Nie udało się zdeserializować ustawień e-mail.", error);
    return DEFAULT_EMAIL_SETTINGS;
  }
}

export async function getEmailSettings(): Promise<EmailSettingsWithMeta> {
  const entry = await db
    .select({ value: settings.value, updatedAt: settings.updatedAt, updatedById: settings.updatedById })
    .from(settings)
    .where(eq(settings.key, EMAIL_SETTINGS_KEY))
    .limit(1)
    .get();

  if (!entry) {
    return { settings: DEFAULT_EMAIL_SETTINGS, updatedAt: null, updatedById: null };
  }

  return {
    settings: parseStoredValue(entry.value),
    updatedAt: entry.updatedAt ?? null,
    updatedById: entry.updatedById ?? null,
  };
}

export async function saveEmailSettings(input: EmailSettingsInput, options?: { updatedById?: string | null }) {
  const payload = emailSettingsSchema.parse(input);
  const now = new Date();

  await db
    .insert(settings)
    .values({
      key: EMAIL_SETTINGS_KEY,
      value: JSON.stringify(payload),
      updatedById: options?.updatedById ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: JSON.stringify(payload),
        updatedById: options?.updatedById ?? null,
        updatedAt: now,
      },
    });

  return payload;
}
