'use server';

import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { mailAccounts, mailFolders, mailMessages } from '@/lib/db/schema';

import type {
	MailAccountSettings,
	MailAccountSummary,
	MailFolderSummary,
	MailMessageSummary,
} from './types';

function toIso(value: number | Date | null | undefined): string | null {
	if (value === null || value === undefined) {
		return null;
	}

	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseRecipients(value: string | null | undefined): string[] {
	if (!value) {
		return [];
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return [];
	}

	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) {
			return parsed.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
		}
	} catch {
		// fall back to splitting by comma
	}

	return trimmed
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

function mapAccountRow(row: typeof mailAccounts.$inferSelect & { unreadCount?: number | null }): MailAccountSummary {
	return {
		id: row.id,
		displayName: row.displayName,
		email: row.email,
		provider: row.provider ?? null,
		status: row.status,
		unreadCount: typeof row.unreadCount === 'number' ? row.unreadCount : 0,
		lastSyncAt: toIso(row.lastSyncAt),
		nextSyncAt: toIso(row.nextSyncAt),
	};
}

function mapFolderRow(row: typeof mailFolders.$inferSelect): MailFolderSummary {
	return {
		id: row.id,
		accountId: row.accountId,
		name: row.name,
		kind: row.kind,
		unreadCount: row.unreadCount ?? 0,
		sortOrder: row.sortOrder ?? 0,
	};
}

function mapMessageRow(row: typeof mailMessages.$inferSelect): MailMessageSummary {
	return {
		id: row.id,
		accountId: row.accountId,
		folderId: row.folderId,
		subject: row.subject ?? null,
		from: {
			name: row.fromName ?? null,
			address: row.fromAddress ?? null,
		},
		to: parseRecipients(row.toRecipients),
		cc: parseRecipients(row.ccRecipients),
		bcc: parseRecipients(row.bccRecipients),
		replyTo: row.replyTo ?? null,
		snippet: row.snippet ?? null,
		textBody: row.textBody ?? null,
		htmlBody: row.htmlBody ?? null,
		messageId: row.messageId ?? null,
		threadId: row.threadId ?? null,
		externalId: row.externalId ?? null,
		receivedAt: toIso(row.receivedAt),
		internalDate: toIso(row.internalDate),
		isRead: Boolean(row.isRead),
		isStarred: Boolean(row.isStarred),
		hasAttachments: Boolean(row.hasAttachments),
	};
}

export async function fetchMailAccounts(): Promise<MailAccountSummary[]> {
	const accountRows = await db
		.select()
		.from(mailAccounts)
		.orderBy(asc(mailAccounts.displayName));

	if (accountRows.length === 0) {
		return [];
	}

	const unreadRows = await db
		.select({
			accountId: mailMessages.accountId,
			count: sql<number>`count(*)`,
		})
		.from(mailMessages)
		.where(eq(mailMessages.isRead, false))
		.groupBy(mailMessages.accountId);

	const unreadMap = new Map<string, number>();
	for (const row of unreadRows) {
		if (!row.accountId) {
			continue;
		}
		unreadMap.set(row.accountId, Number(row.count ?? 0));
	}

	return accountRows.map((row) =>
		mapAccountRow({
			...row,
			unreadCount: unreadMap.get(row.id) ?? 0,
		}),
	);
}

export async function fetchMailAccountsDetailed(): Promise<MailAccountSettings[]> {
	const rows = await db
		.select()
		.from(mailAccounts)
		.orderBy(asc(mailAccounts.displayName));

	return rows.map((row) => ({
		id: row.id,
		displayName: row.displayName,
		email: row.email,
		provider: row.provider ?? null,
		status: row.status,
		imapHost: row.imapHost ?? null,
		imapPort: row.imapPort ?? null,
		imapSecure: Boolean(row.imapSecure),
		smtpHost: row.smtpHost ?? null,
		smtpPort: row.smtpPort ?? null,
		smtpSecure: Boolean(row.smtpSecure),
		username: row.username,
		signature: row.signature ?? null,
		hasPassword: Boolean(row.passwordSecret),
		lastSyncAt: toIso(row.lastSyncAt),
		nextSyncAt: toIso(row.nextSyncAt),
	}));
}

export async function fetchMailFolders(accountId: string): Promise<MailFolderSummary[]> {
	const rows = await db
		.select()
		.from(mailFolders)
		.where(eq(mailFolders.accountId, accountId))
		.orderBy(asc(mailFolders.sortOrder), asc(mailFolders.name));

	return rows.map(mapFolderRow);
}

export async function fetchMailMessages({
	accountId,
	folderId,
	limit = 50,
}: {
	accountId: string;
	folderId?: string | null;
	limit?: number;
}): Promise<MailMessageSummary[]> {
	const whereClause = folderId
		? and(eq(mailMessages.accountId, accountId), eq(mailMessages.folderId, folderId))
		: eq(mailMessages.accountId, accountId);

	const rows = await db
		.select()
		.from(mailMessages)
		.where(whereClause)
		.orderBy(desc(mailMessages.receivedAt), desc(mailMessages.createdAt))
		.limit(limit);

	return rows.map(mapMessageRow);
}

export async function fetchMailMessage(messageId: string): Promise<MailMessageSummary | null> {
	const [row] = await db
		.select()
		.from(mailMessages)
		.where(eq(mailMessages.id, messageId))
		.limit(1);

	return row ? mapMessageRow(row) : null;
}

export function mapMessage(row: typeof mailMessages.$inferSelect): MailMessageSummary {
	return mapMessageRow(row);
}
