'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { createTransport } from 'nodemailer';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { mailAccounts, mailFolders, mailMessages } from '@/lib/db/schema';
import type { MailFolderKind } from '@/lib/db/schema';

import { fetchMailFolders, fetchMailMessage, fetchMailMessages, mapMessage } from './queries';
import type { MailFolderSummary, MailMessageSummary } from './types';

type MessageListOptions = {
	accountId: string;
	folderId?: string | null;
	limit?: number;
};

type ToggleReadResult = {
	message: MailMessageSummary;
	folderUnread: number;
	accountUnread: number;
};

async function getFolderUnreadCount(folderId: string): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(mailMessages)
		.where(and(eq(mailMessages.folderId, folderId), eq(mailMessages.isRead, false)));

	return Number(row?.count ?? 0);
}

async function getAccountUnreadCount(accountId: string): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`count(*)` })
		.from(mailMessages)
		.where(and(eq(mailMessages.accountId, accountId), eq(mailMessages.isRead, false)));

	return Number(row?.count ?? 0);
}

export async function listMailFolders(accountId: string): Promise<MailFolderSummary[]> {
	await requireUser();
	return fetchMailFolders(accountId);
}

export async function listMailMessages(options: MessageListOptions): Promise<MailMessageSummary[]> {
	await requireUser();
	return fetchMailMessages(options);
}

export async function getMailMessage(messageId: string): Promise<MailMessageSummary | null> {
	await requireUser();
	return fetchMailMessage(messageId);
}

export async function toggleMailMessageRead(messageId: string, read: boolean): Promise<ToggleReadResult | null> {
	await requireUser();

	const [existing] = await db
		.select()
		.from(mailMessages)
		.where(eq(mailMessages.id, messageId))
		.limit(1);

	if (!existing) {
		return null;
	}

	if (Boolean(existing.isRead) === read) {
		const folderUnread = await getFolderUnreadCount(existing.folderId);
		const accountUnread = await getAccountUnreadCount(existing.accountId);
		return {
			message: mapMessage(existing),
			folderUnread,
			accountUnread,
		};
	}

	const [updated] = await db
		.update(mailMessages)
		.set({
			isRead: read,
			updatedAt: sql`(strftime('%s','now') * 1000)`,
		})
		.where(eq(mailMessages.id, messageId))
		.returning();

	if (!updated) {
		return null;
	}

	const folderUnread = await getFolderUnreadCount(updated.folderId);
	const accountUnread = await getAccountUnreadCount(updated.accountId);
	revalidatePath('/dashboard/mail');

	return {
		message: mapMessage(updated),
		folderUnread,
		accountUnread,
	};
}

const sendMailSchema = z.object({
	accountId: z.string().uuid('Wybierz poprawne konto pocztowe.'),
	to: z.string().trim().min(1, 'Podaj przynajmniej jednego odbiorce.'),
	cc: z.string().trim().optional(),
	bcc: z.string().trim().optional(),
	subject: z.string().trim().optional(),
	body: z.string().trim().min(1, 'Wpisz tresc wiadomości.'),
});

const MAX_RECIPIENTS = 50;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB
const DEFAULT_SENT_FOLDER_KINDS: MailFolderKind[] = ['sent'];

type SentFolderCandidate = {
	id: string;
	name: string;
	path: string | null;
	kind: MailFolderKind;
};

function resolveSentFolder(folders: SentFolderCandidate[]): SentFolderCandidate | null {
	return (
		folders.find((folder) => DEFAULT_SENT_FOLDER_KINDS.includes(folder.kind)) ??
		folders.find((folder) => folder.path?.toLowerCase().includes('sent')) ??
		folders.find((folder) => folder.name.toLowerCase().includes('sent')) ??
		null
	);
}

type SendMailPayload = z.infer<typeof sendMailSchema>;

export type SendMailState = {
	status: 'idle' | 'success' | 'error';
	message?: string;
	errors?: Record<string, string>;
};

const initialErrorMessage = 'Nie udalo sie wyslac wiadomosci.';

function decodeSecret(secret: string | null | undefined): string | null {
	if (!secret) {
		return null;
	}

	try {
		return Buffer.from(secret, 'base64').toString('utf8');
	} catch {
		return null;
	}
}

function splitRecipients(value: string | null | undefined): string[] {
	if (!value) {
		return [];
	}

	return value
		.split(/[,;\n]+/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateRecipientList(list: string[]): string | null {
	if (list.length === 0) {
		return 'Podaj przynajmniej jednego odbiorce.';
	}

	if (list.length > MAX_RECIPIENTS) {
		return `Maksymalna liczba odbiorcow to ${MAX_RECIPIENTS}.`;
	}

	const invalid = list.find((item) => !isValidEmail(item));
	if (invalid) {
		return `Adres "${invalid}" jest niepoprawny.`;
	}

	return null;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function convertToHtml(text: string): string {
	return escapeHtml(text).replace(/\r?\n/g, '<br />');
}

function buildBodies(body: string, signature: string | null | undefined): { text: string; html?: string } {
	const parts = [body.trim()];
	const signatureValue = signature?.trim() ?? '';
	if (signatureValue) {
		parts.push(signatureValue);
	}

	const text = parts.filter(Boolean).join('\n\n');
	const htmlParts = parts.filter(Boolean).map(convertToHtml);
	const html = htmlParts.length > 0 ? htmlParts.join('<br /><br />') : undefined;

	return { text, html };
}

export async function sendMail(_: SendMailState, formData: FormData): Promise<SendMailState> {
	await requireUser();

	const raw: Record<keyof SendMailPayload, unknown> = {
		accountId: formData.get('accountId'),
		to: formData.get('to'),
		cc: formData.get('cc'),
		bcc: formData.get('bcc'),
		subject: formData.get('subject'),
		body: formData.get('body'),
	};

	const parsed = sendMailSchema.safeParse(raw);
	if (!parsed.success) {
		const errors: Record<string, string> = {};
		for (const issue of parsed.error.issues) {
			const field = issue.path[0];
			if (typeof field === 'string' && !(field in errors)) {
				errors[field] = issue.message;
			}
		}

		return {
			status: 'error',
			message: 'Popraw bledy formularza.',
			errors,
		};
	}

	const data = parsed.data;
	const fieldErrors: Record<string, string> = {};

	const toRecipients = splitRecipients(data.to);
	const toError = validateRecipientList(toRecipients);
	if (toError) {
		fieldErrors.to = toError;
	}

	const ccRecipients = splitRecipients(data.cc);
	const ccError = ccRecipients.length > 0 ? validateRecipientList(ccRecipients) : null;
	if (ccError) {
		fieldErrors.cc = ccError;
	}

	const bccRecipients = splitRecipients(data.bcc);
	const bccError = bccRecipients.length > 0 ? validateRecipientList(bccRecipients) : null;
	if (bccError) {
		fieldErrors.bcc = bccError;
	}

	if (Object.keys(fieldErrors).length > 0) {
		return {
			status: 'error',
			message: 'Popraw bledy formularza.',
			errors: fieldErrors,
		};
	}

	const [account] = await db
		.select({
			id: mailAccounts.id,
			displayName: mailAccounts.displayName,
			email: mailAccounts.email,
			signature: mailAccounts.signature,
			smtpHost: mailAccounts.smtpHost,
			smtpPort: mailAccounts.smtpPort,
			smtpSecure: mailAccounts.smtpSecure,
			username: mailAccounts.username,
			passwordSecret: mailAccounts.passwordSecret,
		})
		.from(mailAccounts)
		.where(eq(mailAccounts.id, data.accountId));

	if (!account) {
		return {
			status: 'error',
			message: 'Nie znaleziono wybranego konta pocztowego.',
		};
	}

	const sentFolderCandidates = await db
		.select({
			id: mailFolders.id,
			name: mailFolders.name,
			path: mailFolders.path,
			kind: mailFolders.kind,
		})
		.from(mailFolders)
		.where(eq(mailFolders.accountId, account.id));

	const sentFolder = resolveSentFolder(sentFolderCandidates);

	if (!account.smtpHost || !account.smtpPort) {
		return {
			status: 'error',
			message: 'Konto nie ma skonfigurowanego serwera SMTP.',
		};
	}

	const password = decodeSecret(account.passwordSecret);
	if (!password) {
		return {
			status: 'error',
			message: 'Brak hasla SMTP dla wybranego konta.',
		};
	}

	const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
	let totalAttachmentSize = 0;
	const files = formData.getAll('attachments');

	for (const file of files) {
		if (!(file instanceof File)) {
			continue;
		}

		if (file.size === 0) {
			continue;
		}

		if (file.size > MAX_ATTACHMENT_SIZE) {
			return {
				status: 'error',
				message: `Zalacznik "${file.name}" przekracza limit 10 MB.`,
			};
		}

		totalAttachmentSize += file.size;
		if (totalAttachmentSize > MAX_TOTAL_ATTACHMENT_SIZE) {
			return {
				status: 'error',
				message: 'Laczny rozmiar zalacznikow przekracza 25 MB.',
			};
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		attachments.push({
			filename: file.name || 'zalacznik',
			content: buffer,
			contentType: file.type || undefined,
		});
	}

	const { text, html } = buildBodies(data.body, account.signature);
	const subject = data.subject && data.subject.length > 0 ? data.subject : '(bez tematu)';

	const transporter = createTransport({
		host: account.smtpHost,
		port: account.smtpPort,
		secure: Boolean(account.smtpSecure),
		auth: {
			user: account.username,
			pass: password,
		},
	});

	let deliveredMessageId: string | undefined;

	try {
		const info = await transporter.sendMail({
			from: `${account.displayName} <${account.email}>`,
			to: toRecipients.join(', '),
			cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
			bcc: bccRecipients.length > 0 ? bccRecipients.join(', ') : undefined,
			subject,
			text,
			html,
			replyTo: account.email,
			attachments: attachments.length > 0 ? attachments : undefined,
		});
		deliveredMessageId = typeof info.messageId === 'string' ? info.messageId : undefined;
	} catch (error) {
		const reason = error instanceof Error ? error.message : initialErrorMessage;
		return {
			status: 'error',
			message: `Nie udalo sie wyslac wiadomosci: ${reason}`,
		};
	} finally {
		if ('close' in transporter && typeof transporter.close === 'function') {
			transporter.close();
		}
	}

	if (sentFolder) {
		try {
			const now = new Date();
			const sentMessage: typeof mailMessages.$inferInsert = {
				id: randomUUID(),
				accountId: account.id,
				folderId: sentFolder.id,
				subject,
				fromAddress: account.email,
				fromName: account.displayName,
				toRecipients: JSON.stringify(toRecipients),
				ccRecipients: ccRecipients.length > 0 ? JSON.stringify(ccRecipients) : null,
				bccRecipients: bccRecipients.length > 0 ? JSON.stringify(bccRecipients) : null,
				replyTo: account.email,
				snippet: text.slice(0, 240),
				textBody: text,
				htmlBody: html ?? null,
				messageId: deliveredMessageId ?? null,
				threadId: null,
				externalId: null,
				receivedAt: now,
				internalDate: now,
				isRead: true,
				isStarred: false,
				hasAttachments: attachments.length > 0,
				createdAt: now,
				updatedAt: now,
			};

			await db.insert(mailMessages).values(sentMessage);
		} catch {
			// intentionally swallow errors: storing in Sent is best-effort only
		}
	}

	revalidatePath('/dashboard/mail');

	return {
		status: 'success',
		message: 'Wiadomosc zostala wyslana.',
	};
}
