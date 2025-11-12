"use server";

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import * as net from 'net';
import * as tls from 'tls';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { mailAccounts, mailFolders, mailMessages } from '@/lib/db/schema';
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

	try {
		await testConnection('IMAP', account.imapHost, Number(account.imapPort), Boolean(account.imapSecure));
		await testConnection('SMTP', account.smtpHost, Number(account.smtpPort), Boolean(account.smtpSecure));
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Test polaczenia zakonczyl sie niepowodzeniem.';

		await db
			.update(mailAccounts)
			.set({
				status: 'error',
				error: message,
				nextSyncAt: null,
				updatedAt: sql`(strftime('%s','now') * 1000)`,
			})
			.where(eq(mailAccounts.id, accountId));

		revalidatePath('/dashboard/settings/mail');
		revalidatePath('/dashboard/mail');

		return {
			status: 'error',
			message,
		};
	}

	await db
		.update(mailAccounts)
		.set({
			status: 'connected',
			error: null,
			lastSyncAt: sql`(strftime('%s','now') * 1000)`,
			nextSyncAt: sql`((strftime('%s','now') + 900) * 1000)`,
			updatedAt: sql`(strftime('%s','now') * 1000)`,
		})
		.where(eq(mailAccounts.id, accountId));

	revalidatePath('/dashboard/settings/mail');
	revalidatePath('/dashboard/mail');

	return {
		status: 'success',
		message: 'Polaczenie z serwerami IMAP i SMTP powiodlo sie. Zaplanowano kolejna synchronizacje.',
	};
}
