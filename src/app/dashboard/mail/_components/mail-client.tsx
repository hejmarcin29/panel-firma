'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import { getMailMessage, listMailFolders, listMailMessages, toggleMailMessageRead } from '../actions';
import type { MailAccountSummary, MailFolderSummary, MailMessageSummary } from '../types';

type MailClientProps = {
	accounts: MailAccountSummary[];
	initialFolders: MailFolderSummary[];
	initialMessages: MailMessageSummary[];
};

type ToggleFormState = {
	status: 'idle' | 'success' | 'error';
	error?: string;
};

const initialToggleState: ToggleFormState = { status: 'idle' };

function formatDate(value: string | null) {
	if (!value) {
		return 'brak daty';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return 'brak daty';
	}

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date);
}

function formatAddress(address: { name: string | null; address: string | null }) {
	if (address.name && address.address) {
		return `${address.name} <${address.address}>`;
	}

	return address.address ?? address.name ?? 'Nieznany nadawca';
}

function renderRecipients(recipients: string[]) {
	if (recipients.length === 0) {
		return '—';
	}

	return recipients.join(', ');
}

export function MailClient({ accounts, initialFolders, initialMessages }: MailClientProps) {
	const [accountList, setAccountList] = useState(accounts);
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id ?? null);
	const [folders, setFolders] = useState(initialFolders);
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolders[0]?.id ?? null);
	const [messages, setMessages] = useState(initialMessages);
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(initialMessages[0]?.id ?? null);
	const [error, setError] = useState<string | null>(null);
	const [isListing, startListingTransition] = useTransition();
	const [isLoadingMessage, startMessageTransition] = useTransition();
	const [, toggleAction, isToggling] = useActionState(toggleMailMessageReadHandler, initialToggleState);

	const selectedMessage = useMemo(
		() => messages.find((message) => message.id === selectedMessageId) ?? null,
		[messages, selectedMessageId],
	);

	async function toggleMailMessageReadHandler(
		_prevState: ToggleFormState,
		formData: FormData,
	): Promise<ToggleFormState> {
		const messageId = formData.get('messageId');
		const desiredState = formData.get('read');

		if (typeof messageId !== 'string' || typeof desiredState !== 'string') {
			const formError = 'Niepoprawne dane formularza.';
			setError(formError);
			return { status: 'error', error: formError };
		}

		try {
			const result = await toggleMailMessageRead(messageId, desiredState === 'true');
			if (!result) {
				const toggleError = 'Nie udalo sie zaktualizowac statusu wiadomosci.';
				setError(toggleError);
				return { status: 'error', error: toggleError };
			}

			setMessages((prev) => prev.map((message) => (message.id === result.message.id ? result.message : message)));
			setFolders((prev) => prev.map((folder) => (folder.id === result.message.folderId ? { ...folder, unreadCount: result.folderUnread } : folder)));
			setAccountList((prev) =>
				prev.map((account) =>
					account.id === result.message.accountId ? { ...account, unreadCount: result.accountUnread } : account,
				),
			);
			setError(null);

			return { status: 'success' };
		} catch (actionError) {
			const errorMessage =
				actionError instanceof Error ? actionError.message : 'Wystapil nieoczekiwany blad podczas aktualizacji.';
			setError(errorMessage);
			return {
				status: 'error',
				error: errorMessage,
			};
		}
	}

	function handleSelectAccount(accountId: string) {
		if (accountId === selectedAccountId) {
			return;
		}

		setSelectedAccountId(accountId);
		setSelectedFolderId(null);
		setSelectedMessageId(null);
		setMessages([]);
		setFolders([]);
		setError(null);

		startListingTransition(async () => {
			try {
				const nextFolders = await listMailFolders(accountId);
				setFolders(nextFolders);

				const firstFolderId = nextFolders[0]?.id ?? null;
				setSelectedFolderId(firstFolderId);

				if (firstFolderId) {
					const nextMessages = await listMailMessages({ accountId, folderId: firstFolderId });
					setMessages(nextMessages);
					setSelectedMessageId(nextMessages[0]?.id ?? null);
				} else {
					setMessages([]);
					setSelectedMessageId(null);
				}
			} catch (listError) {
				setError(listError instanceof Error ? listError.message : 'Nie udalo sie pobrac folderow skrzynki.');
			}
		});
	}

	function handleSelectFolder(folderId: string) {
		if (folderId === selectedFolderId || !selectedAccountId) {
			return;
		}

		setSelectedFolderId(folderId);
		setSelectedMessageId(null);
		setMessages([]);
		setError(null);

		startListingTransition(async () => {
			try {
				const nextMessages = await listMailMessages({ accountId: selectedAccountId, folderId });
				setMessages(nextMessages);
				setSelectedMessageId(nextMessages[0]?.id ?? null);
			} catch (listError) {
				setError(listError instanceof Error ? listError.message : 'Nie udalo sie pobrac wiadomosci.');
			}
		});
	}

	function handleSelectMessage(messageId: string) {
		if (messageId === selectedMessageId) {
			return;
		}

		setSelectedMessageId(messageId);

		if (!selectedAccountId) {
			return;
		}

		startMessageTransition(async () => {
			try {
				const message = await getMailMessage(messageId);
				if (message) {
					setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
				}
			} catch (messageError) {
				setError(messageError instanceof Error ? messageError.message : 'Nie udalo sie pobrac tresci wiadomosci.');
			}
		});
	}

	return (
		<section className="space-y-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Poczta firmowa</h1>
					<p className="text-sm text-muted-foreground">
						Monitoruj korespondencje z klientami bez opuszczania panelu administracyjnego.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/dashboard/settings/mail">Konfiguracja kont</Link>
				</Button>
			</header>

			{error && (
				<Alert variant="destructive">
					<AlertTitle>Wystapil blad</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_minmax(0,1.1fr)]">
				<Card className="h-full">
					<CardHeader>
						<CardTitle>Skrzynki</CardTitle>
						<CardDescription>Zmien skrzynke, aby zobaczyc odpowiadajace foldery.</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-[520px]">
							<ul className="divide-y">
								{accountList.map((account) => {
									const isActive = account.id === selectedAccountId;
									return (
										<li key={account.id}>
											<button
												type="button"
												onClick={() => handleSelectAccount(account.id)}
												className={cn(
													'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors',
													isActive ? 'bg-muted' : 'hover:bg-muted/60',
												)}
											>
												<span className="text-sm font-semibold text-foreground">{account.displayName}</span>
												<span className="text-xs text-muted-foreground">{account.email}</span>
												<div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
													<Badge variant="secondary">{account.status}</Badge>
													{account.unreadCount > 0 ? (
														<Badge variant="destructive">{account.unreadCount} nieprzeczytane</Badge>
													) : (
														<span className="text-muted-foreground">Brak nieprzeczytanych</span>
													)}
												</div>
											</button>
										</li>
									);
								})}
							</ul>
						</ScrollArea>
					</CardContent>
				</Card>

				<Card className="h-full">
					<CardHeader>
						<CardTitle>Foldery</CardTitle>
						<CardDescription>Wybierz folder, aby przegladac zawartosc.</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{isListing ? (
							<div className="flex h-[520px] items-center justify-center">
								<Spinner className="size-6" />
							</div>
						) : folders.length === 0 ? (
							<div className="flex h-[520px] items-center justify-center px-6 text-sm text-muted-foreground">
								Brak folderow dla tej skrzynki.
							</div>
						) : (
							<ScrollArea className="h-[520px]">
								<ul className="divide-y">
									{folders.map((folder) => {
										const isActive = folder.id === selectedFolderId;
										return (
											<li key={folder.id}>
												<button
													type="button"
													onClick={() => handleSelectFolder(folder.id)}
													className={cn(
														'flex w-full items-center justify-between px-4 py-3 text-left transition-colors',
														isActive ? 'bg-muted' : 'hover:bg-muted/60',
													)}
												>
													<div>
														<p className="text-sm font-medium text-foreground">{folder.name}</p>
														<p className="text-xs text-muted-foreground">{folder.kind}</p>
													</div>
													{folder.unreadCount > 0 ? (
														<Badge variant="outline">{folder.unreadCount}</Badge>
													) : null}
												</button>
											</li>
										);
									})}
								</ul>
							</ScrollArea>
						)}
					</CardContent>
				</Card>

				<Card className="h-full xl:col-span-1 xl:row-span-1">
					<CardHeader>
						<CardTitle>Wiadomosci</CardTitle>
						<CardDescription>Podglad tematow i szybkie akcje.</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{isListing ? (
							<div className="flex h-[520px] items-center justify-center">
								<Spinner className="size-6" />
							</div>
						) : messages.length === 0 ? (
							<div className="flex h-[520px] items-center justify-center px-6 text-sm text-muted-foreground">
								Brak wiadomosci do wyswietlenia.
							</div>
						) : (
							<ScrollArea className="h-[520px]">
								<ul className="divide-y">
									{messages.map((message) => {
										const isActive = message.id === selectedMessageId;
										return (
											<li key={message.id}>
												<button
													type="button"
													onClick={() => handleSelectMessage(message.id)}
													className={cn(
														'flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors',
														isActive ? 'bg-muted' : 'hover:bg-muted/60',
												)}
												>
													<div className="flex items-start justify-between gap-3">
														<p className="text-sm font-medium text-foreground line-clamp-1">{message.subject ?? '(brak tematu)'}</p>
														<span className="text-xs text-muted-foreground">{formatDate(message.receivedAt)}</span>
													</div>
													<p className="text-xs text-muted-foreground line-clamp-1">{formatAddress(message.from)}</p>
													<p className="text-xs text-muted-foreground line-clamp-2">{message.snippet ?? message.textBody ?? 'Brak podgladu tresci.'}</p>
													<div className="flex flex-wrap items-center gap-2">
														{!message.isRead ? <Badge variant="destructive">Nowa</Badge> : null}
														{message.hasAttachments ? <Badge variant="outline">Zalacznik</Badge> : null}
													</div>
												</button>
											</li>
										);
									})}
								</ul>
							</ScrollArea>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Podglad</CardTitle>
					<CardDescription>Pelna tresc zaznaczonej wiadomosci.</CardDescription>
				</CardHeader>
				<CardContent>
					{selectedMessage ? (
						<div className="space-y-6">
							<header className="space-y-2">
								<h2 className="text-xl font-semibold text-foreground">{selectedMessage.subject ?? '(brak tematu)'}</h2>
								<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
									<span>Od: {formatAddress(selectedMessage.from)}</span>
									<span>Do: {renderRecipients(selectedMessage.to)}</span>
									{selectedMessage.cc.length > 0 ? <span>DW: {renderRecipients(selectedMessage.cc)}</span> : null}
									{selectedMessage.bcc.length > 0 ? <span>UDW: {renderRecipients(selectedMessage.bcc)}</span> : null}
									<span>Odebrano: {formatDate(selectedMessage.receivedAt)}</span>
								</div>
							</header>

							<div className="flex flex-wrap items-center gap-2">
								<form action={toggleAction}>
									<input type="hidden" name="messageId" value={selectedMessage.id} />
									<input type="hidden" name="read" value={(!selectedMessage.isRead).toString()} />
									<Button type="submit" size="sm" disabled={isToggling} variant="outline">
										{isToggling ? 'Aktualizowanie…' : selectedMessage.isRead ? 'Oznacz jako nieprzeczytane' : 'Oznacz jako przeczytane'}
									</Button>
								</form>
								<Button variant="secondary" size="sm" asChild>
									<Link href={`mailto:${selectedMessage.from.address ?? ''}`}>Odpowiedz</Link>
								</Button>
							</div>

							<Separator />

							{isLoadingMessage ? (
								<div className="space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-2/3" />
								</div>
							) : selectedMessage.htmlBody ? (
								<div
									className="prose max-w-none prose-sm"
									dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
								/>
							) : (
								<pre className="whitespace-pre-wrap text-sm text-foreground/90">
									{selectedMessage.textBody ?? 'Brak tresci do wyswietlenia.'}
								</pre>
							)}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">Wybierz wiadomosc, aby wyswietlic szczegoly.</p>
					)}
				</CardContent>
			</Card>
		</section>
	);
}
