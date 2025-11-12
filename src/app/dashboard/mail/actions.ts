'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { mailFolders, mailMessages } from '@/lib/db/schema';

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

export async function toggleMailMessageRead(
	messageId: string,
	read: boolean,
): Promise<ToggleReadResult | null> {
	await requireUser();

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

	const [[folderRow], [accountRow]] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)` })
			.from(mailMessages)
			.where(and(eq(mailMessages.folderId, updated.folderId), eq(mailMessages.isRead, false)))
			.limit(1),
		db
			.select({ count: sql<number>`count(*)` })
			.from(mailMessages)
			.where(and(eq(mailMessages.accountId, updated.accountId), eq(mailMessages.isRead, false)))
			.limit(1),
	]);

	const folderUnread = Number(folderRow?.count ?? 0);
	const accountUnread = Number(accountRow?.count ?? 0);

	await db
		.update(mailFolders)
		.set({
			unreadCount: folderUnread,
			updatedAt: sql`(strftime('%s','now') * 1000)`,
		})
		.where(eq(mailFolders.id, updated.folderId));

	revalidatePath('/dashboard/mail');

	return {
		message: mapMessage(updated),
		folderUnread,
		accountUnread,
	};
}
