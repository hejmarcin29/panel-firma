import type { MailAccountStatus, MailFolderKind } from '@/lib/db/schema';

export type MailAccountSummary = {
	id: string;
	displayName: string;
	email: string;
	provider: string | null;
	status: MailAccountStatus;
	unreadCount: number;
	lastSyncAt: string | null;
	nextSyncAt: string | null;
};

export type MailFolderSummary = {
	id: string;
	accountId: string;
	name: string;
	kind: MailFolderKind;
	unreadCount: number;
	sortOrder: number;
};

export type MailRecipientList = string[];

export type MailMessageSummary = {
	id: string;
	accountId: string;
	folderId: string;
	subject: string | null;
	from: {
		name: string | null;
		address: string | null;
	};
	to: MailRecipientList;
	cc: MailRecipientList;
	bcc: MailRecipientList;
	replyTo: string | null;
	snippet: string | null;
	textBody: string | null;
	htmlBody: string | null;
	messageId: string | null;
	threadId: string | null;
	externalId: string | null;
	receivedAt: string | null;
	internalDate: string | null;
	isRead: boolean;
	isStarred: boolean;
	hasAttachments: boolean;
};

export type MailAccountSettings = {
	id: string;
	displayName: string;
	email: string;
	provider: string | null;
	status: MailAccountStatus;
	imapHost: string | null;
	imapPort: number | null;
	imapSecure: boolean;
	smtpHost: string | null;
	smtpPort: number | null;
	smtpSecure: boolean;
	username: string;
	signature: string | null;
	hasPassword: boolean;
	lastSyncAt: string | null;
	nextSyncAt: string | null;
};
