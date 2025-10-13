import nodemailer from "nodemailer";

import { getEmailSettings } from "@/lib/settings/email";
import type { EmailSettings } from "@/lib/settings/schemas";

export type SendEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = {
  status: "mock" | "sent";
  messageId?: string;
  settings: EmailSettings;
};

function buildFromHeader(settings: EmailSettings) {
  if (!settings.fromEmail) {
    throw new Error("Brakuje adresu nadawcy w ustawieniach e-mail.");
  }

  return settings.fromName ? `${settings.fromName} <${settings.fromEmail}>` : settings.fromEmail;
}

async function sendViaMock(payload: SendEmailPayload, settings: EmailSettings): Promise<SendEmailResult> {
  console.info("[EMAIL MOCK]", {
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    htmlPreview: payload.html?.slice(0, 200),
  });
  return { status: "mock", settings };
}

async function ensureSmtpReady(settings: EmailSettings) {
  if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPassword || !settings.fromEmail) {
    throw new Error("Konfiguracja SMTP jest niekompletna. Uzupełnij adres serwera, port, login, hasło i e-mail nadawcy.");
  }
}

async function sendViaSmtp(payload: SendEmailPayload, settings: EmailSettings): Promise<SendEmailResult> {
  await ensureSmtpReady(settings);

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort ?? 587,
    secure: settings.smtpSecure ?? false,
    auth: {
      user: settings.smtpUser ?? undefined,
      pass: settings.smtpPassword ?? undefined,
    },
  });

  const info = await transporter.sendMail({
    from: buildFromHeader(settings),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    replyTo: settings.replyToEmail ?? undefined,
  });

  return { status: "sent", messageId: info.messageId, settings };
}

export async function sendSystemEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { settings } = await getEmailSettings();

  if (!payload.to) {
    throw new Error("Brakuje adresata wiadomości e-mail.");
  }

  if (settings.mode === "MOCK") {
    return sendViaMock(payload, settings);
  }

  return sendViaSmtp(payload, settings);
}

export async function sendPasswordChangedNotification(input: {
  to: string;
  username: string;
  actorName?: string;
}): Promise<SendEmailResult> {
  if (!input.to) {
    throw new Error("Brakuje adresu e-mail użytkownika.");
  }

  const subject = "Hasło do panelu zostało zresetowane";
  const greeting = input.username ? `Cześć ${input.username},` : "Cześć,";
  const actor = input.actorName ? ` przez ${input.actorName}` : "";

  const text = [
    greeting,
    "",
    `Twoje hasło do panelu administracyjnego zostało zmienione${actor}.`,
    "Jeśli to nie Ty inicjowałeś zmianę, skontaktuj się z administratorem systemu jak najszybciej.",
    "",
    "Pozdrawiamy,",
    "Zespół SolarPro",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Twoje hasło do panelu administracyjnego zostało zmienione${actor}.</p>
    <p>Jeśli to nie Ty inicjowałeś zmianę, skontaktuj się z administratorem systemu jak najszybciej.</p>
    <p style="margin-top: 16px;">Pozdrawiamy,<br />Zespół SolarPro</p>
  `;

  return sendSystemEmail({ to: input.to, subject, text, html });
}
