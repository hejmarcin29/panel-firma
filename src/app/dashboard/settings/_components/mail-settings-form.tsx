'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import type { MailAccountSettings } from '@/app/dashboard/mail/types';
import { deleteMailAccount, syncMailAccount, upsertMailAccount } from '../mail/actions';

type MailSettingsFormProps = {
	accounts: MailAccountSettings[];
};

type FormValues = {
	accountId: string | null;
	displayName: string;
	email: string;
	provider: string;
	imapHost: string;
	imapPort: string;
	imapSecure: 'true' | 'false';
	smtpHost: string;
	smtpPort: string;
	smtpSecure: 'true' | 'false';
	username: string;
	password: string;
	signature: string;
};

const NEW_ACCOUNT_ID = '__new__';
const INITIAL_ACTION_STATE = { status: 'idle' as const };

function toFormValues(account: MailAccountSettings | null): FormValues {
	return {
		accountId: account?.id ?? null,
		displayName: account?.displayName ?? '',
		email: account?.email ?? '',
		provider: account?.provider ?? '',
		imapHost: account?.imapHost ?? '',
		imapPort: account?.imapPort ? String(account.imapPort) : '',
		imapSecure: account?.imapSecure ? 'true' : 'false',
		smtpHost: account?.smtpHost ?? '',
		smtpPort: account?.smtpPort ? String(account.smtpPort) : '',
		smtpSecure: account?.smtpSecure ? 'true' : 'false',
		username: account?.username ?? '',
		password: '',
		signature: account?.signature ?? '',
	};
}

function findAccount(accounts: MailAccountSettings[], id: string | null): MailAccountSettings | null {
	if (!id) {
		return null;
	}

	return accounts.find((account) => account.id === id) ?? null;
}

export function MailSettingsForm({ accounts }: MailSettingsFormProps) {
	const router = useRouter();
	const [state, formAction, isSubmitting] = useActionState(upsertMailAccount, INITIAL_ACTION_STATE);
	const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
	const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id ?? NEW_ACCOUNT_ID);
	const [formValues, setFormValues] = useState<FormValues>(() => toFormValues(findAccount(accounts, accounts[0]?.id ?? null)));
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleting, startDeleteTransition] = useTransition();
	const [isSyncing, startSyncTransition] = useTransition();
	const [syncResult, setSyncResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

	const selectedAccount = useMemo(
		() => (selectedAccountId === NEW_ACCOUNT_ID ? null : findAccount(accounts, selectedAccountId)),
		[accounts, selectedAccountId],
	);

/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		setFormValues(toFormValues(selectedAccount));
		setSyncResult(null);
	}, [selectedAccount]);

	useEffect(() => {
		if (state.status === 'success') {
			setPendingAccountId(state.accountId ?? null);
			router.refresh();
		}
	}, [router, state]);

	useEffect(() => {
		if (!pendingAccountId) {
			return;
		}

		const exists = accounts.some((account) => account.id === pendingAccountId);
		if (exists) {
			setSelectedAccountId(pendingAccountId);
			setPendingAccountId(null);
		}
	}, [accounts, pendingAccountId]);
/* eslint-enable react-hooks/set-state-in-effect */

	function handleSelect(accountId: string) {
		setSelectedAccountId(accountId);
		setDeleteError(null);
		setSyncResult(null);
	}

	function handleChange(field: keyof FormValues, value: string) {
		setFormValues((prev) => ({ ...prev, [field]: value }));
		setSyncResult(null);
	}

	function handleDelete() {
		if (selectedAccountId === NEW_ACCOUNT_ID) {
			return;
		}

		setDeleteError(null);
		setSyncResult(null);
		startDeleteTransition(async () => {
			try {
				await deleteMailAccount(selectedAccountId);
				router.refresh();
				setSelectedAccountId(NEW_ACCOUNT_ID);
			} catch (error) {
				setDeleteError(error instanceof Error ? error.message : 'Nie udalo sie usunac konta.');
			}
		});
	}

	function handleSync() {
		if (!selectedAccount) {
			return;
		}

		setSyncResult(null);
		startSyncTransition(async () => {
			try {
				const result = await syncMailAccount(selectedAccount.id);
				setSyncResult(result);
				router.refresh();
			} catch (error) {
				setSyncResult({
					status: 'error',
					message: error instanceof Error ? error.message : 'Nie udalo sie wykonac testu polaczenia.',
				});
			}
		});
	}

	return (
		<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
			<Card className="h-full">
				<CardHeader>
					<CardTitle>Skonfigurowane konta</CardTitle>
					<CardDescription>Wybierz konto do edycji lub dodaj nowe.</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<ScrollArea className="h-[460px]">
						<ul className="divide-y">
							<li>
								<button
									type="button"
									onClick={() => handleSelect(NEW_ACCOUNT_ID)}
									className={cn(
										'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors',
										selectedAccountId === NEW_ACCOUNT_ID ? 'bg-muted' : 'hover:bg-muted/60',
									)}
								>
									<span className="text-sm font-semibold text-foreground">Dodaj nowe konto</span>
									<span className="text-xs text-muted-foreground">Skonfiguruj skrzynke IMAP/SMTP</span>
								</button>
							</li>
							{accounts.map((account) => (
								<li key={account.id}>
									<button
										type="button"
										onClick={() => handleSelect(account.id)}
										className={cn(
											'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors',
											selectedAccountId === account.id ? 'bg-muted' : 'hover:bg-muted/60',
										)}
									>
										<span className="text-sm font-semibold text-foreground">{account.displayName}</span>
										<span className="text-xs text-muted-foreground">{account.email}</span>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="secondary">{account.status}</Badge>
											{account.lastSyncAt ? (
												<span className="text-[10px] uppercase tracking-wide text-muted-foreground">
													Ostatnia synchronizacja {new Date(account.lastSyncAt).toLocaleString('pl-PL')}
												</span>
											) : (
												<span className="text-[10px] uppercase tracking-wide text-muted-foreground">Brak synchronizacji</span>
											)}
										</div>
									</button>
								</li>
							))}
						</ul>
					</ScrollArea>
				</CardContent>
			</Card>

			<Card className="h-full">
				<CardHeader>
					<CardTitle>{selectedAccount ? 'Edytuj konto' : 'Nowe konto pocztowe'}</CardTitle>
					<CardDescription>
						Podaj dane serwera IMAP/SMTP. Haslo jest opcjonalne przy edycji – pozostaw puste, aby go nie zmieniac.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{state.status !== 'idle' && state.message ? (
							<Alert variant={state.status === 'error' ? 'destructive' : 'default'}>
								<AlertTitle>{state.status === 'error' ? 'Nie udalo sie zapisac' : 'Zapisano'}</AlertTitle>
								<AlertDescription>{state.message}</AlertDescription>
							</Alert>
						) : null}

						{deleteError ? (
							<Alert variant="destructive">
								<AlertTitle>Nie udalo sie usunac konta</AlertTitle>
								<AlertDescription>{deleteError}</AlertDescription>
							</Alert>
						) : null}

						{syncResult ? (
							<Alert variant={syncResult.status === 'error' ? 'destructive' : 'default'}>
								<AlertTitle>
									{syncResult.status === 'error' ? 'Test polaczenia nie powiodl sie' : 'Polaczenie przetestowane'}
								</AlertTitle>
								<AlertDescription>{syncResult.message}</AlertDescription>
							</Alert>
						) : null}

						<form action={formAction} className="space-y-6">
							<input type="hidden" name="accountId" value={formValues.accountId ?? ''} />
							<input type="hidden" name="imapSecure" value={formValues.imapSecure} />
							<input type="hidden" name="smtpSecure" value={formValues.smtpSecure} />

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="displayName">Nazwa konta</Label>
									<Input
										required
										id="displayName"
										name="displayName"
										value={formValues.displayName}
										onChange={(event) => handleChange('displayName', event.target.value)}
									/>
									{state.errors?.displayName ? (
										<p className="text-xs text-destructive">{state.errors.displayName}</p>
									) : null}
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Adres email</Label>
									<Input
										required
										type="email"
										id="email"
										name="email"
										value={formValues.email}
										onChange={(event) => handleChange('email', event.target.value)}
									/>
									{state.errors?.email ? <p className="text-xs text-destructive">{state.errors.email}</p> : null}
								</div>
								<div className="space-y-2">
									<Label htmlFor="provider">Dostawca (opcjonalnie)</Label>
									<Input
										id="provider"
										name="provider"
										value={formValues.provider}
										onChange={(event) => handleChange('provider', event.target.value)}
									/>
								</div>
							</div>

							<Separator />

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="imapHost">Host IMAP</Label>
									<Input
										required
										id="imapHost"
										name="imapHost"
										value={formValues.imapHost}
										onChange={(event) => handleChange('imapHost', event.target.value)}
									/>
									{state.errors?.imapHost ? <p className="text-xs text-destructive">{state.errors.imapHost}</p> : null}
								</div>
								<div className="space-y-2">
									<Label htmlFor="imapPort">Port IMAP</Label>
									<Input
										required
										type="number"
										min={1}
										max={65535}
										id="imapPort"
										name="imapPort"
										value={formValues.imapPort}
										onChange={(event) => handleChange('imapPort', event.target.value)}
									/>
									{state.errors?.imapPort ? <p className="text-xs text-destructive">{state.errors.imapPort}</p> : null}
								</div>
								<div className="space-y-2">
									<Label>Polaczenie IMAP</Label>
									<Select
										value={formValues.imapSecure}
										onValueChange={(value) => handleChange('imapSecure', value as 'true' | 'false')}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="true">SSL/TLS</SelectItem>
											<SelectItem value="false">Nieszyfrowane</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="username">Login</Label>
									<Input
										required
										id="username"
										name="username"
										value={formValues.username}
										onChange={(event) => handleChange('username', event.target.value)}
									/>
									{state.errors?.username ? <p className="text-xs text-destructive">{state.errors.username}</p> : null}
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="smtpHost">Host SMTP</Label>
									<Input
										required
										id="smtpHost"
										name="smtpHost"
										value={formValues.smtpHost}
										onChange={(event) => handleChange('smtpHost', event.target.value)}
									/>
									{state.errors?.smtpHost ? <p className="text-xs text-destructive">{state.errors.smtpHost}</p> : null}
								</div>
								<div className="space-y-2">
									<Label htmlFor="smtpPort">Port SMTP</Label>
									<Input
										required
										type="number"
										min={1}
										max={65535}
										id="smtpPort"
										name="smtpPort"
										value={formValues.smtpPort}
										onChange={(event) => handleChange('smtpPort', event.target.value)}
									/>
									{state.errors?.smtpPort ? <p className="text-xs text-destructive">{state.errors.smtpPort}</p> : null}
								</div>
								<div className="space-y-2">
									<Label>Polaczenie SMTP</Label>
									<Select
										value={formValues.smtpSecure}
										onValueChange={(value) => handleChange('smtpSecure', value as 'true' | 'false')}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="true">SSL/TLS</SelectItem>
											<SelectItem value="false">Nieszyfrowane</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">Haslo / token</Label>
									<Input
										type="password"
										id="password"
										name="password"
										value={formValues.password}
										onChange={(event) => handleChange('password', event.target.value)}
										placeholder={selectedAccount ? 'Pozostaw puste, aby nie zmieniac' : ''}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="signature">Podpis (opcjonalnie)</Label>
								<Textarea
									id="signature"
									name="signature"
									rows={4}
									value={formValues.signature}
									onChange={(event) => handleChange('signature', event.target.value)}
									placeholder="Pozdrowienia, Zespół ..."
								/>
							</div>

							<div className="flex flex-wrap items-center gap-3">
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? 'Zapisywanie…' : selectedAccount ? 'Zapisz zmiany' : 'Dodaj konto'}
								</Button>
								{selectedAccount ? (
									<>
										<Button type="button" variant="secondary" onClick={handleSync} disabled={isSyncing}>
											{isSyncing ? 'Sprawdzanie...' : 'Sprawdz polaczenie'}
										</Button>
										<Button
											type="button"
											variant="destructive"
											onClick={handleDelete}
											disabled={isDeleting}
										>
											{isDeleting ? 'Usuwanie…' : 'Usun konto'}
										</Button>
									</>
								) : null}
							</div>
						</form>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
