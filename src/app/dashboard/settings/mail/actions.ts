"use server";

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import type { AddressObject, ParsedMail } from 'mailparser';
import * as net from 'net';
import * as tls from 'tls';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { mailAccounts, mailFolders, mailMessages } from '@/lib/db/schema';
import type { MailFolderKind } from '@/lib/db/schema';
import type { MailAccountStatus } from '@/lib/db/schema';

import { fetchMailAccountsDetailed } from '@/app/dashboard/mail/queries';
import type { MailAccountSettings } from '@/app/dashboard/mail/types';

type UpsertState = {
	status: 'idle' | 'success' | 'error';
	message?: string;
	errors?: Record<string, string>;
	accountId?: string;
};

type SyncResult = {
	status: 'success' | 'error';
	message: string;
};

type SyncSummary = {
	folderCount: number;
	messageCount: number;
};

const MAX_MESSAGES_PER_FOLDER = 50;
const UPSERT_BATCH_SIZE = 10;
const NEXT_SYNC_DELAY_SECONDS = 15 * 60;

type ImapMailboxInfo = {
	path: string;
	name?: string;
	flags?: Iterable<string> | string[] | Set<string> | null;
	specialUse?: string | null;
	specialUseFlag?: string | null;
};

type ImapFetchedMessage = {
	uid?: number;
	envelope?: {
		subject?: string | null;
		messageId?: string | null;
		from?: AddressObject[] | null;
		to?: AddressObject[] | null;
		cc?: AddressObject[] | null;
		bcc?: AddressObject[] | null;
		replyTo?: AddressObject[] | null;
		date?: Date | null;
	};
	flags?: Iterable<string> | string[] | Set<string> | null;
	internalDate?: Date | null;
	threadId?: string | number | null;
	source?: Buffer | Uint8Array | string;
};

const schema = z.object({
	accountId: z.string().uuid().optional().or(z.literal('')).transform((value) => value || undefined),
	displayName: z.string().trim().min(1, 'Podaj nazwe konta.'),
	email: z.string().trim().min(1, 'Podaj adres email.').email('Adres email jest niepoprawny.'),
	provider: z.string().trim().optional(),
	imapHost: z.string().trim().min(1, 'Podaj host IMAP.'),
	imapPort: z.coerce
		.number()
		.int('Port IMAP musi byc liczba calkowita.')
		.min(1, 'Port IMAP musi byc dodatni.')
		.max(65535, 'Port IMAP jest niepoprawny.'),
	imapSecure: z.coerce.boolean(),
	smtpHost: z.string().trim().min(1, 'Podaj host SMTP.'),
	smtpPort: z.coerce
		.number()
		.int('Port SMTP musi byc liczba calkowita.')
		.min(1, 'Port SMTP musi byc dodatni.')
		.max(65535, 'Port SMTP jest niepoprawny.'),
	smtpSecure: z.coerce.boolean(),
	username: z.string().trim().min(1, 'Podaj nazwe uzytkownika.'),
	password: z.string().optional(),
	signature: z.string().optional(),
});

function encodeSecret(value: string | undefined | null) {
	if (!value) {
		return undefined;
	}

	return Buffer.from(value, 'utf8').toString('base64');
}

function decodeSecret(secret: string | undefined | null) {
	if (!secret) {
		return null;
	}

	try {
		return Buffer.from(secret, 'base64').toString('utf8');
	} catch {
		return null;
	}
}

function normalizeNullable(value: string | undefined | null) {
	if (!value) {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length === 0 ? null : trimmed;
}

export async function upsertMailAccount(_: UpsertState, formData: FormData): Promise<UpsertState> {
	await requireUser();

	const raw: Record<string, unknown> = {
		accountId: formData.get('accountId'),
		displayName: formData.get('displayName'),
		email: formData.get('email'),
		provider: formData.get('provider'),
		imapHost: formData.get('imapHost'),
		imapPort: formData.get('imapPort'),
		imapSecure: formData.get('imapSecure') ?? 'false',
		smtpHost: formData.get('smtpHost'),
		smtpPort: formData.get('smtpPort'),
		smtpSecure: formData.get('smtpSecure') ?? 'false',
		username: formData.get('username'),
		password: formData.get('password'),
		signature: formData.get('signature'),
	};

	const parsed = schema.safeParse(raw);

	if (!parsed.success) {
		const fieldErrors: Record<string, string> = {};
		for (const issue of parsed.error.issues) {
			const path = issue.path[0];
			if (typeof path === 'string' && !(path in fieldErrors)) {
				fieldErrors[path] = issue.message;
			}
		}

		return {
			status: 'error',
			message: 'Popraw bledy formularza.',
			errors: fieldErrors,
		};
	}

	const { accountId, password, ...data } = parsed.data;
	const id = accountId ?? crypto.randomUUID();

	const values = {
		displayName: data.displayName,
		email: data.email,
		provider: normalizeNullable(data.provider),
		status: 'disconnected' as MailAccountStatus,
		imapHost: data.imapHost,
		imapPort: data.imapPort,
		imapSecure: data.imapSecure,
		smtpHost: data.smtpHost,
		smtpPort: data.smtpPort,
		smtpSecure: data.smtpSecure,
		username: data.username,
		signature: normalizeNullable(data.signature),
		nextSyncAt: null,
		error: null,
		updatedAt: sql`(strftime('%s','now') * 1000)`,
	};

	const secret = encodeSecret(password?.trim() ? password : undefined);

	if (secret) {
		Object.assign(values, { passwordSecret: secret });
	}

	const existing = accountId
		? await db
			.select({ id: mailAccounts.id, status: mailAccounts.status })
			.from(mailAccounts)
			.where(eq(mailAccounts.id, accountId))
			.limit(1)
		: [];

	const baseStatus: MailAccountStatus = existing[0]?.status ?? 'disconnected';
	values.status = baseStatus;

	if (accountId && existing.length === 0) {
		return {
			status: 'error',
			message: 'Wybrane konto nie istnieje.',
		};
	}

	if (accountId) {
		await db
			.update(mailAccounts)
			.set(values)
			.where(eq(mailAccounts.id, accountId));
	} else {
		await db.insert(mailAccounts).values({
			id,
			...values,
			passwordSecret: secret ?? null,
			createdAt: sql`(strftime('%s','now') * 1000)`,
		});
	}

	revalidatePath('/dashboard/settings/mail');
	revalidatePath('/dashboard/mail');

	return {
		status: 'success',
		message: accountId ? 'Zapisano zmiany konta.' : 'Dodano nowe konto pocztowe.',
		accountId: id,
	};
}

export async function deleteMailAccount(accountId: string): Promise<void> {
	await requireUser();

	await db.delete(mailMessages).where(eq(mailMessages.accountId, accountId));
	await db.delete(mailFolders).where(eq(mailFolders.accountId, accountId));
	await db.delete(mailAccounts).where(eq(mailAccounts.id, accountId));

	revalidatePath('/dashboard/settings/mail');
	revalidatePath('/dashboard/mail');
}

export async function getMailAccountSettings(): Promise<MailAccountSettings[]> {
	await requireUser();
	return fetchMailAccountsDetailed();
}

function testConnection(service: 'IMAP' | 'SMTP', host: string, port: number, secure: boolean): Promise<void> {
	const timeoutMs = 7000;

	return new Promise((resolve, reject) => {
		let socket: net.Socket | tls.TLSSocket | null = null;

		const cleanup = () => {
			if (!socket) {
				return;
			}
			socket.removeAllListeners();
			socket.end();
			socket.destroy();
			socket = null;
		};

		const fail = (error: Error) => {
			cleanup();
			reject(new Error(`Nie udalo sie polaczyc z serwerem ${service}: ${error.message}`));
		};

		const handleTimeout = () => {
			fail(new Error('Przekroczono czas oczekiwania.'));
		};

		const handleConnect = () => {
			cleanup();
			resolve();
		};

		if (secure) {
			socket = tls.connect({ host, port, servername: host }, handleConnect);
			socket.once('error', fail);
		} else {
			socket = net.connect({ host, port }, handleConnect);
			socket.once('error', fail);
		}

		if (!socket) {
			reject(new Error(`Nie udalo sie zainicjowac polaczenia z serwerem ${service}.`));
			return;
		}

		socket.setTimeout(timeoutMs, handleTimeout);
	});
}

async function markAccountError(accountId: string, message: string): Promise<void> {
	await db
		.update(mailAccounts)
		.set({
			status: 'error',
			error: message,
			nextSyncAt: null,
			updatedAt: sql`(strftime('%s','now') * 1000)`,
		})
		.where(eq(mailAccounts.id, accountId));
}

function formatSyncError(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
}

type FolderDescriptor = {
	folderId: string;
	path: string;
	kind: MailFolderKind;
};

async function synchronizeAccount(client: ImapFlow, accountId: string): Promise<SyncSummary> {
	const existingFolders = await db
		.select({
			id: mailFolders.id,
			remoteId: mailFolders.remoteId,
			path: mailFolders.path,
		})
		.from(mailFolders)
		.where(eq(mailFolders.accountId, accountId));

	const folderMap = new Map<string, string>();
	for (const folder of existingFolders) {
		const key = folder.remoteId ?? folder.path;
		if (key) {
			folderMap.set(key, folder.id);
		}
	}

	const descriptors: FolderDescriptor[] = [];
	const timestamp = sql`(strftime('%s','now') * 1000)`;

	for await (const mailboxRaw of client.list()) {
		const mailbox = mailboxRaw as ImapMailboxInfo;
		const path = typeof mailbox.path === 'string' ? mailbox.path : null;
		if (!path) {
			continue;
		}

		const flags = normalizeFlags(mailbox.flags);
		if (flags.has('\\NOSELECT')) {
			continue;
		}

		const kind = resolveFolderKind(mailbox);
		const sortOrder = resolveSortOrder(kind);
		let unreadCount = 0;

		try {
			const status = await client.status(path, { unseen: true });
			unreadCount = Number((status as { unseen?: number }).unseen ?? 0);
		} catch {
			unreadCount = 0;
		}

		const name = mailbox.name || path;
		const existingId = folderMap.get(path);
		const folderId = existingId ?? crypto.randomUUID();

		if (existingId) {
			await db
				.update(mailFolders)
				.set({
					name,
					kind,
					remoteId: path,
					path,
					sortOrder,
					unreadCount,
					updatedAt: timestamp,
				})
				.where(eq(mailFolders.id, existingId));
		} else {
			await db.insert(mailFolders).values({
				id: folderId,
				accountId,
				name,
				kind,
				remoteId: path,
				path,
				sortOrder,
				unreadCount,
				updatedAt: timestamp,
			});
		}

		descriptors.push({
			folderId,
			path,
			kind,
		});
	}

	let messageCount = 0;

	for (const descriptor of descriptors) {
		try {
			messageCount += await synchronizeFolder(client, accountId, descriptor.folderId, descriptor.path);
		} catch {
			// ignore folder-level errors, continue with remaining folders
		}
	}

	return {
		folderCount: descriptors.length,
		messageCount,
	};
}

async function synchronizeFolder(client: ImapFlow, accountId: string, folderId: string, path: string): Promise<number> {
	const lock = await client.getMailboxLock(path);
	const timestamp = sql`(strftime('%s','now') * 1000)`;

	try {
		const mailbox = client.mailbox ?? {};
		const total = typeof mailbox.exists === 'number' ? mailbox.exists : 0;
		const unseen = typeof mailbox.unseen === 'number' ? mailbox.unseen : 0;

		await db
			.update(mailFolders)
			.set({ unreadCount: unseen, updatedAt: timestamp })
			.where(eq(mailFolders.id, folderId));

		if (total === 0) {
			return 0;
		}

		const start = Math.max(total - MAX_MESSAGES_PER_FOLDER + 1, 1);
		const range = start === total ? `${total}` : `${start}:${total}`;
		const batch: (typeof mailMessages.$inferInsert)[] = [];
		let processed = 0;

		for await (const messageRaw of client.fetch(
			{ seq: range },
			{
				envelope: true,
				flags: true,
				internalDate: true,
				uid: true,
				source: true,
				threadId: true,
			},
		)) {
			const message = messageRaw as ImapFetchedMessage;
			const record = await buildMessageRecord(accountId, folderId, message, timestamp);
			if (!record) {
				continue;
			}

			batch.push(record);
			processed += 1;

			if (batch.length >= UPSERT_BATCH_SIZE) {
				await upsertMessages(batch);
				batch.length = 0;
			}
		}

		if (batch.length > 0) {
			await upsertMessages(batch);
		}

		return processed;
	} finally {
		lock.release();
	}
}

async function upsertMessages(records: (typeof mailMessages.$inferInsert)[]): Promise<void> {
	if (records.length === 0) {
		return;
	}

	await db
		.insert(mailMessages)
		.values(records)
		.onConflictDoUpdate({
			target: [mailMessages.accountId, mailMessages.messageId],
			set: {
				folderId: sql`excluded.folder_id`,
				subject: sql`excluded.subject`,
				fromAddress: sql`excluded.from_address`,
				fromName: sql`excluded.from_name`,
				toRecipients: sql`excluded.to_recipients`,
				ccRecipients: sql`excluded.cc_recipients`,
				bccRecipients: sql`excluded.bcc_recipients`,
				replyTo: sql`excluded.reply_to`,
				snippet: sql`excluded.snippet`,
				textBody: sql`excluded.text_body`,
				htmlBody: sql`excluded.html_body`,
				threadId: sql`excluded.thread_id`,
				externalId: sql`excluded.external_id`,
				receivedAt: sql`excluded.received_at`,
				internalDate: sql`excluded.internal_date`,
				isRead: sql`excluded.is_read`,
				isStarred: sql`excluded.is_starred`,
				hasAttachments: sql`excluded.has_attachments`,
				updatedAt: sql`excluded.updated_at`,
			},
		});
}

async function buildMessageRecord(
	accountId: string,
	folderId: string,
	message: ImapFetchedMessage,
	timestamp: SQL<unknown>,
): Promise<(typeof mailMessages.$inferInsert) | null> {
	const envelope = (message?.envelope ?? {}) as ImapFetchedMessage['envelope'];
	const rawSource = message?.source as Buffer | Uint8Array | string | undefined;
	let parsed: ParsedMail | null = null;

	if (rawSource) {
		const buffer = Buffer.isBuffer(rawSource)
			? rawSource
			: typeof rawSource === 'string'
				? Buffer.from(rawSource)
				: Buffer.from(rawSource);

		try {
			parsed = await simpleParser(buffer, {
				skipHtmlToText: true,
				skipTextToHtml: true,
				skipTextLinks: true,
			});
		} catch {
			parsed = null;
		}
	}

	const messageId = normalizeMessageId(parsed?.messageId ?? envelope.messageId ?? (message?.uid ? `uid:${message.uid}` : null));
	if (!messageId) {
		return null;
	}

	const envelopeFrom = Array.isArray(envelope?.from) ? envelope?.from : undefined;
	const envelopeTo = Array.isArray(envelope?.to) ? envelope?.to : undefined;
	const envelopeCc = Array.isArray(envelope?.cc) ? envelope?.cc : undefined;
	const envelopeBcc = Array.isArray(envelope?.bcc) ? envelope?.bcc : undefined;
	const envelopeReplyTo = Array.isArray(envelope?.replyTo) ? envelope?.replyTo : undefined;

	const from = extractAddress(parsed?.from?.value?.[0] ?? envelopeFrom?.[0]);
	const toRecipients = collectAddresses(parsed?.to?.value, envelopeTo);
	const ccRecipients = collectAddresses(parsed?.cc?.value, envelopeCc);
	const bccRecipients = collectAddresses(parsed?.bcc?.value, envelopeBcc);
	const replyTo = extractAddress(parsed?.replyTo?.value?.[0] ?? envelopeReplyTo?.[0]);
	const flags = normalizeFlags(message?.flags);
	const internalDate = toTimestamp(message?.internalDate);
	const receivedDate = parsed?.date ?? envelope?.date ?? null;
	const receivedAt = toTimestamp(receivedDate) ?? internalDate;
	const textBody = parsed?.text ?? null;
	const htmlBody = parsed?.html ?? null;

	return {
		id: crypto.randomUUID(),
		accountId,
		folderId,
		subject: parsed?.subject ?? envelope.subject ?? null,
		fromAddress: from?.address ?? null,
		fromName: from?.name ?? null,
		toRecipients: serializeRecipients(toRecipients),
		ccRecipients: serializeRecipients(ccRecipients),
		bccRecipients: serializeRecipients(bccRecipients),
		replyTo: replyTo?.address ?? null,
		snippet: buildSnippet(textBody, htmlBody),
		textBody,
		htmlBody,
		messageId,
		threadId: message?.threadId ? String(message.threadId) : null,
		externalId: message?.uid ? String(message.uid) : null,
		receivedAt: receivedAt ?? null,
		internalDate: internalDate ?? null,
		isRead: flags.has('\\SEEN'),
		isStarred: flags.has('\\FLAGGED'),
		hasAttachments: Boolean(parsed?.attachments?.length),
		updatedAt: timestamp,
	};
}

function normalizeFlags(flags: Iterable<string> | string[] | Set<string> | null | undefined): Set<string> {
	if (!flags) {
		return new Set();
	}

	const entries = flags instanceof Set ? Array.from(flags) : Array.isArray(flags) ? flags : Array.from(flags);
	return new Set(entries.map((flag) => (typeof flag === 'string' ? flag.toUpperCase() : '')).filter(Boolean));
}

function resolveFolderKind(mailbox: ImapMailboxInfo): MailFolderKind {
	const specialUse = typeof mailbox.specialUse === 'string' ? mailbox.specialUse.toUpperCase() : null;
	const flag = typeof mailbox.specialUseFlag === 'string' ? mailbox.specialUseFlag.toUpperCase() : null;
	const name = typeof mailbox.name === 'string' ? mailbox.name.toLowerCase() : '';

	const lookup = specialUse ?? flag ?? '';

	switch (lookup) {
		case '\\INBOX':
			return 'inbox';
		case '\\SENT':
			return 'sent';
		case '\\DRAFTS':
			return 'drafts';
		case '\\JUNK':
			return 'spam';
		case '\\TRASH':
			return 'trash';
		case '\\ARCHIVE':
			return 'archive';
		default:
			break;
	}

	if (name.includes('inbox')) {
		return 'inbox';
	}

	if (name.includes('sent')) {
		return 'sent';
	}

	if (name.includes('draft')) {
		return 'drafts';
	}

	if (name.includes('spam') || name.includes('junk')) {
		return 'spam';
	}

	if (name.includes('trash') || name.includes('deleted')) {
		return 'trash';
	}

	if (name.includes('archive')) {
		return 'archive';
	}

	return 'custom';
}

function resolveSortOrder(kind: MailFolderKind): number {
	switch (kind) {
		case 'inbox':
			return 0;
		case 'sent':
			return 10;
		case 'drafts':
			return 20;
		case 'spam':
			return 30;
		case 'trash':
			return 40;
		case 'archive':
			return 50;
		default:
			return 100;
	}
}

function serializeRecipients(recipients: string[]): string | null {
	if (recipients.length === 0) {
		return null;
	}

	return JSON.stringify(recipients);
}

function collectAddresses(primary?: AddressObject[] | null, fallback?: AddressObject[] | null): string[] {
	const primaryList = normalizeAddressList(primary);
	if (primaryList.length > 0) {
		return primaryList;
	}

	return normalizeAddressList(fallback);
}

function normalizeAddressList(value?: AddressObject[] | AddressObject | null): string[] {
	const items = Array.isArray(value) ? value : value ? [value] : [];
	const result: string[] = [];

	for (const item of items) {
		const address = extractAddress(item)?.address;
		if (address && !result.includes(address)) {
			result.push(address);
		}
	}

	return result;
}

function extractAddress(value?: AddressObject | null): { name: string | null; address: string | null } | null {
	if (!value) {
		return null;
	}

	const name = typeof value.name === 'string' && value.name.trim().length > 0 ? value.name.trim() : null;

	if (typeof value.address === 'string' && value.address.trim().length > 0) {
		return { name, address: value.address.trim() };
	}

	const mailbox = typeof value.mailbox === 'string' ? value.mailbox.trim() : '';
	const host = typeof value.host === 'string' ? value.host.trim() : '';
	if (mailbox && host) {
		return { name, address: `${mailbox}@${host}` };
	}

	return null;
}

function toTimestamp(value: unknown): number | null {
	if (value instanceof Date) {
		const time = value.getTime();
		return Number.isNaN(time) ? null : time;
	}

	if (typeof value === 'number') {
		return Number.isNaN(value) ? null : value;
	}

	return null;
}

function normalizeMessageId(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length === 0 ? null : trimmed;
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]+>/g, ' ');
}

function buildSnippet(textBody: string | null, htmlBody: string | null): string | null {
	const source = textBody && textBody.trim().length > 0 ? textBody : htmlBody ? stripHtml(htmlBody) : '';
	const cleaned = source.replace(/\s+/g, ' ').trim();

	if (!cleaned) {
		return null;
	}

	return cleaned.slice(0, 200);
}

export async function syncMailAccount(accountId: string): Promise<SyncResult> {
	await requireUser();

	if (!accountId) {
		return {
			status: 'error',
			message: 'Brak identyfikatora konta.',
		};
	}

	const [account] = await db
		.select({
			id: mailAccounts.id,
			displayName: mailAccounts.displayName,
			imapHost: mailAccounts.imapHost,
			imapPort: mailAccounts.imapPort,
			imapSecure: mailAccounts.imapSecure,
			smtpHost: mailAccounts.smtpHost,
			smtpPort: mailAccounts.smtpPort,
			smtpSecure: mailAccounts.smtpSecure,
			username: mailAccounts.username,
			passwordSecret: mailAccounts.passwordSecret,
		})
		.from(mailAccounts)
		.where(eq(mailAccounts.id, accountId))
		.limit(1);

	if (!account) {
		return {
			status: 'error',
			message: 'Wybrane konto nie istnieje.',
		};
	}

	if (!account.imapHost || !account.imapPort) {
		return {
			status: 'error',
			message: 'Brakuje konfiguracji serwera IMAP. Zapisz poprawnie formularz i sprobuj ponownie.',
		};
	}

	if (!account.smtpHost || !account.smtpPort) {
		return {
			status: 'error',
			message: 'Brakuje konfiguracji serwera SMTP. Zapisz poprawnie formularz i sprobuj ponownie.',
		};
	}

	const password = decodeSecret(account.passwordSecret);
	if (!password) {
		return {
			status: 'error',
			message: 'Brak zapisanego hasla do skrzynki. Podaj je ponownie w formularzu i sprobuj jeszcze raz.',
		};
	}

	try {
		await testConnection('SMTP', account.smtpHost, Number(account.smtpPort), Boolean(account.smtpSecure));
	} catch (error) {
		const message = formatSyncError(error, 'Nie udalo sie nawiazac polaczenia z serwerem SMTP.');
		await markAccountError(accountId, message);
		revalidatePath('/dashboard/settings/mail');
		revalidatePath('/dashboard/mail');
		return {
			status: 'error',
			message,
		};
	}

	const client = new ImapFlow({
		host: account.imapHost,
		port: Number(account.imapPort),
		secure: Boolean(account.imapSecure),
		auth: {
			user: account.username,
			pass: password,
		},
		logger: false,
	});

	let syncSummary: SyncSummary | null = null;

	try {
		await client.connect();
		syncSummary = await synchronizeAccount(client, accountId);
	} catch (error) {
		const message = formatSyncError(error, 'Synchronizacja skrzynki nie powiodla sie.');
		await markAccountError(accountId, message);
		try {
			await client.logout();
		} catch {
			// ignore logout errors
		}
		revalidatePath('/dashboard/settings/mail');
		revalidatePath('/dashboard/mail');
		return {
			status: 'error',
			message,
		};
	}

	try {
		await client.logout();
	} catch {
		// ignore logout errors
	}

	await db
		.update(mailAccounts)
		.set({
			status: 'connected',
			error: null,
			lastSyncAt: sql`(strftime('%s','now') * 1000)`,
			nextSyncAt: sql`((strftime('%s','now') + ${NEXT_SYNC_DELAY_SECONDS}) * 1000)`,
			updatedAt: sql`(strftime('%s','now') * 1000)`,
		})
		.where(eq(mailAccounts.id, accountId));

	revalidatePath('/dashboard/settings/mail');
	revalidatePath('/dashboard/mail');

	return {
		status: 'success',
		message: syncSummary
			? `Synchronizacja zakonczona sukcesem. Zaktualizowano ${syncSummary.messageCount} wiadomosci w ${syncSummary.folderCount} folderach.`
			: 'Synchronizacja zakonczona sukcesem.',
	};
}
