import { z } from "zod";

export const emailSettingsModes = ["MOCK", "SMTP"] as const;

export type EmailSettingsMode = (typeof emailSettingsModes)[number];

const nullableString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

const nullableEmail = nullableString.refine(
  (value) => value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  "Podaj poprawny adres e-mail.",
);

const nullableLimitedString = (limit: number, message: string) =>
  nullableString.refine(
    (value) => value === null || value.length <= limit,
    message,
  );

export const emailSettingsSchema = z
  .object({
    mode: z.enum(emailSettingsModes),
    fromName: nullableLimitedString(
      120,
      "Nazwa nadawcy może mieć maksymalnie 120 znaków.",
    ).default(null),
    fromEmail: nullableEmail.default(null),
    replyToEmail: nullableEmail.default(null),
    smtpHost: nullableLimitedString(
      200,
      "Adres hosta SMTP może mieć maksymalnie 200 znaków.",
    ).default(null),
    smtpPort: z
      .union([
        z
          .number()
          .int("Port musi być liczbą całkowitą.")
          .min(1, "Port musi być większy od zera.")
          .max(65535, "Port musi być mniejszy lub równy 65535."),
        z.literal(null),
      ])
      .default(null),
    smtpSecure: z.boolean().default(true),
    smtpUser: nullableLimitedString(200, "Login może mieć maksymalnie 200 znaków.").default(null),
    smtpPassword: nullableLimitedString(
      200,
      "Hasło SMTP może mieć maksymalnie 200 znaków.",
    ).default(null),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "SMTP") {
      if (!value.smtpHost) {
        ctx.addIssue({
          path: ["smtpHost"],
          code: z.ZodIssueCode.custom,
          message: "Podaj adres serwera SMTP.",
        });
      }

      if (!value.smtpPort) {
        ctx.addIssue({
          path: ["smtpPort"],
          code: z.ZodIssueCode.custom,
          message: "Podaj port serwera SMTP.",
        });
      }

      if (!value.smtpUser) {
        ctx.addIssue({
          path: ["smtpUser"],
          code: z.ZodIssueCode.custom,
          message: "Podaj login do serwera SMTP.",
        });
      }

      if (!value.smtpPassword) {
        ctx.addIssue({
          path: ["smtpPassword"],
          code: z.ZodIssueCode.custom,
          message: "Podaj hasło do serwera SMTP.",
        });
      }

      if (!value.fromEmail) {
        ctx.addIssue({
          path: ["fromEmail"],
          code: z.ZodIssueCode.custom,
          message: "Podaj adres e-mail nadawcy.",
        });
      }
    }
  });

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

export type EmailSettings = EmailSettingsInput;

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  mode: "MOCK",
  fromName: null,
  fromEmail: null,
  replyToEmail: null,
  smtpHost: null,
  smtpPort: null,
  smtpSecure: true,
  smtpUser: null,
  smtpPassword: null,
};