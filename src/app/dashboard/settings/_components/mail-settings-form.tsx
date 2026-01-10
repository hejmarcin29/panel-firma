'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Check } from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const DEFAULT_SIGNATURE_TEMPLATE = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <p>Pozdrawiamy,</p>
  <p>
    <strong>Zespół Prime Podłoga</strong><br>
    <a href="https://b2b.primepodloga.pl" style="color: #ea580c; text-decoration: none;">b2b.primepodloga.pl</a>
  </p>
  <div style="margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 8px; color: #6b7280; font-size: 12px;">
    Wiadoomość wygenerowana automatycznie z Systemu Obsługi Montaży.
  </div>
</div>`;

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

// Auto-save state
const [isSaving, setIsSaving] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const selectedAccount = useMemo(
    () => (selectedAccountId === NEW_ACCOUNT_ID ? null : findAccount(accounts, selectedAccountId)),
    [accounts, selectedAccountId],
  );

  useEffect(() => {
    setFormValues(toFormValues(selectedAccount));
    setSyncResult(null);
    setLastSaved(null);
  }, [selectedAccount]);useEffect(() => {
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


const debouncedSave = useDebouncedCallback(async (values: FormValues) => {
if (selectedAccountId === NEW_ACCOUNT_ID) return;

setIsSaving(true);
try {
const formData = new FormData();
Object.entries(values).forEach(([key, value]) => {
if (value !== null && value !== undefined) {
formData.append(key, value);
}
});

const result = await upsertMailAccount({ status: 'idle' }, formData);

if (result.status === 'success') {
setLastSaved(new Date());
router.refresh();
} else {
// Handle error silently or show toast? 
// For now we rely on the fact that invalid data won't save but won't crash
console.error('Auto-save failed:', result.message, result.errors);
}
} catch (error) {
console.error('Auto-save error:', error);
} finally {
setIsSaving(false);
}
}, 1000);

function handleSelect(accountId: string) {
setSelectedAccountId(accountId);
setDeleteError(null);
setSyncResult(null);
}

function handleChange(field: keyof FormValues, value: string) {
const newValues = { ...formValues, [field]: value };
setFormValues(newValues);
setSyncResult(null);

if (selectedAccountId !== NEW_ACCOUNT_ID) {
debouncedSave(newValues);
}
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
<div className='grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'>
<Card className='h-full'>
<CardHeader>
<CardTitle>Skonfigurowane konta</CardTitle>
<CardDescription>Wybierz konto do edycji lub dodaj nowe.</CardDescription>
</CardHeader>
<CardContent className='p-0'>
<ScrollArea className='h-[460px]'>
<ul className='divide-y'>
<li>
<button
type='button'
onClick={() => handleSelect(NEW_ACCOUNT_ID)}
className={cn(
'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors',
selectedAccountId === NEW_ACCOUNT_ID ? 'bg-muted' : 'hover:bg-muted/60',
)}
>
<span className='text-sm font-semibold text-foreground'>Dodaj nowe konto</span>
<span className='text-xs text-muted-foreground'>Skonfiguruj skrzynke IMAP/SMTP</span>
</button>
</li>
{accounts.map((account) => (
<li key={account.id}>
<button
type='button'
onClick={() => handleSelect(account.id)}
className={cn(
'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors',
selectedAccountId === account.id ? 'bg-muted' : 'hover:bg-muted/60',
)}
>
<span className='text-sm font-semibold text-foreground'>{account.displayName}</span>
<span className='text-xs text-muted-foreground'>{account.email}</span>
<div className='flex flex-wrap items-center gap-2'>
<Badge variant='secondary'>{account.status}</Badge>
{account.lastSyncAt ? (
<span className='text-[10px] uppercase tracking-wide text-muted-foreground'>
Ostatnia synchronizacja {new Date(account.lastSyncAt).toLocaleString('pl-PL')}
</span>
) : (
<span className='text-[10px] uppercase tracking-wide text-muted-foreground'>Brak synchronizacji</span>
)}
</div>
</button>
</li>
))}
</ul>
</ScrollArea>
</CardContent>
</Card>

<Card className='h-full'>
<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
<div className='space-y-1.5'>
<CardTitle>{selectedAccount ? 'Edytuj konto' : 'Nowe konto pocztowe'}</CardTitle>
<CardDescription>
Podaj dane serwera IMAP/SMTP. Haslo jest opcjonalne przy edycji – pozostaw puste, aby go nie zmieniac.
</CardDescription>
</div>
{selectedAccountId !== NEW_ACCOUNT_ID && (
<div className='flex items-center gap-2'>
{isSaving ? (
<span className='text-xs text-muted-foreground flex items-center gap-1'>
<Loader2 className='w-3 h-3 animate-spin' />
Zapisywanie...
</span>
) : (
<span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!!lastSaved}>
<Check className='w-3 h-3' />
Zapisano
</span>
)}
</div>
)}
</CardHeader>
<CardContent>
<div className='space-y-4'>
{state.status !== 'idle' && state.message && selectedAccountId === NEW_ACCOUNT_ID ? (
<Alert variant={state.status === 'error' ? 'destructive' : 'default'}>
<AlertTitle>{state.status === 'error' ? 'Nie udalo sie zapisac' : 'Zapisano'}</AlertTitle>
<AlertDescription>{state.message}</AlertDescription>
</Alert>
) : null}

{deleteError ? (
<Alert variant='destructive'>
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

<form action={formAction} className='space-y-6'>
<input type='hidden' name='accountId' value={formValues.accountId ?? ''} />
<input type='hidden' name='imapSecure' value={formValues.imapSecure} />
<input type='hidden' name='smtpSecure' value={formValues.smtpSecure} />

<div className='grid gap-4 md:grid-cols-2'>
<div className='space-y-2'>
<Label htmlFor='displayName'>Nazwa konta</Label>
<Input
required
id='displayName'
name='displayName'
value={formValues.displayName}
onChange={(event) => handleChange('displayName', event.target.value)}
/>
{state.errors?.displayName && selectedAccountId === NEW_ACCOUNT_ID ? (
<p className='text-xs text-destructive'>{state.errors.displayName}</p>
) : null}
</div>
<div className='space-y-2'>
<Label htmlFor='email'>Adres email</Label>
<Input
required
type='email'
id='email'
name='email'
value={formValues.email}
onChange={(event) => handleChange('email', event.target.value)}
/>
{state.errors?.email && selectedAccountId === NEW_ACCOUNT_ID ? <p className='text-xs text-destructive'>{state.errors.email}</p> : null}
</div>
<div className='space-y-2'>
<Label htmlFor='provider'>Dostawca (opcjonalnie)</Label>
<Input
id='provider'
name='provider'
value={formValues.provider}
onChange={(event) => handleChange('provider', event.target.value)}
/>
</div>
</div>

<Separator />

<div className='grid gap-4 md:grid-cols-2'>
<div className='space-y-2'>
<Label htmlFor='imapHost'>Host IMAP</Label>
<Input
required
id='imapHost'
name='imapHost'
value={formValues.imapHost}
onChange={(event) => handleChange('imapHost', event.target.value)}
/>
{state.errors?.imapHost && selectedAccountId === NEW_ACCOUNT_ID ? <p className='text-xs text-destructive'>{state.errors.imapHost}</p> : null}
</div>
<div className='space-y-2'>
<Label htmlFor='imapPort'>Port IMAP</Label>
<Input
required
type='number'
min={1}
max={65535}
id='imapPort'
name='imapPort'
value={formValues.imapPort}
onChange={(event) => handleChange('imapPort', event.target.value)}
/>
{state.errors?.imapPort && selectedAccountId === NEW_ACCOUNT_ID ? <p className='text-xs text-destructive'>{state.errors.imapPort}</p> : null}
</div>
<div className='space-y-2'>
<Label>Polaczenie IMAP</Label>
<Select
value={formValues.imapSecure}
onValueChange={(value) => handleChange('imapSecure', value as 'true' | 'false')}
>
<SelectTrigger>
<SelectValue />
</SelectTrigger>
<SelectContent>
<SelectItem value='true'>SSL/TLS</SelectItem>
<SelectItem value='false'>Nieszyfrowane</SelectItem>
</SelectContent>
</Select>
</div>
<div className='space-y-2'>
<Label htmlFor='username'>Login</Label>
<Input
required
id='username'
name='username'
value={formValues.username}
onChange={(event) => handleChange('username', event.target.value)}
/>
{state.errors?.username && selectedAccountId === NEW_ACCOUNT_ID ? <p className='text-xs text-destructive'>{state.errors.username}</p> : null}
</div>
</div>

<div className='grid gap-4 md:grid-cols-2'>
<div className='space-y-2'>
<Label htmlFor='smtpHost'>Host SMTP</Label>
<Input
required
id='smtpHost'
name='smtpHost'
value={formValues.smtpHost}
onChange={(event) => handleChange('smtpHost', event.target.value)}
/>
{state.errors?.smtpHost && selectedAccountId === NEW_ACCOUNT_ID ? <p className='text-xs text-destructive'>{state.errors.smtpHost}</p> : null}
</div>
<div className='space-y-2'>
<Label htmlFor='smtpPort'>Port SMTP</Label>
<Input
required
type='number'
min={1}
max={65535}
id='smtpPort'
name='smtpPort'
value={formValues.smtpPort}
onChange={(event) => handleChange('smtpPort', event.target.value)}
/>
{state.errors?.smtpPort && selectedAccountId === NEW_ACCOUNT_ID ? <p className='text-xs text-destructive'>{state.errors.smtpPort}</p> : null}
</div>
<div className='space-y-2'>
<Label>Polaczenie SMTP</Label>
<Select
value={formValues.smtpSecure}
onValueChange={(value) => handleChange('smtpSecure', value as 'true' | 'false')}
>
<SelectTrigger>
<SelectValue />
</SelectTrigger>
<SelectContent>
<SelectItem value='true'>SSL/TLS</SelectItem>
<SelectItem value='false'>Nieszyfrowane</SelectItem>
</SelectContent>
</Select>
</div>
<div className='space-y-2'>
<Label htmlFor='password'>Haslo / token</Label>
<Input
type='password'
id='password'
name='password'
value={formValues.password}
onChange={(event) => handleChange('password', event.target.value)}
placeholder={selectedAccount ? 'Pozostaw puste, aby nie zmieniac' : ''}
/>
</div>
</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label htmlFor="signature">Stopka / Podpis (HTML)</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => handleChange('signature', DEFAULT_SIGNATURE_TEMPLATE)}
										className="h-7 text-xs"
									>
										Wstaw szablon
									</Button>
								</div>
								
								<Tabs defaultValue="edit" className="w-full">
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="edit">Edycja HTML</TabsTrigger>
										<TabsTrigger value="preview">Podgląd</TabsTrigger>
									</TabsList>
									<TabsContent value="edit" className="mt-2">
										<Textarea
											id="signature"
											name="signature"
											rows={8}
											value={formValues.signature}
											onChange={(event) => handleChange('signature', event.target.value)}
											placeholder="<div>Pozdrawiamy,<br>Zespół...</div>"
											className="font-mono text-xs"
										/>
										<p className="text-[10px] text-muted-foreground mt-1">
											Możesz używać znaczników HTML do formatowania tekstu, dodawania linków i obrazków.
										</p>
									</TabsContent>
									<TabsContent value="preview" className="mt-2">
										<div className="rounded-md border bg-card p-4 min-h-[190px]">
											{formValues.signature ? (
												<div 
													className="prose-sm max-w-none"
													dangerouslySetInnerHTML={{ __html: formValues.signature }} 
												/>
											) : (
												<div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">
													Brak podpisu do wyświetlenia
												</div>
											)}
										</div>
									</TabsContent>
								</Tabs>
							</div>

							<div className="flex flex-wrap items-center gap-3">
{selectedAccountId === NEW_ACCOUNT_ID && (
<Button type='submit' disabled={isSubmitting}>
{isSubmitting ? 'Zapisywanie…' : 'Dodaj konto'}
</Button>
)}

{selectedAccount ? (
<>
<Button type='button' variant='secondary' onClick={handleSync} disabled={isSyncing}>
{isSyncing ? 'Sprawdzanie...' : 'Sprawdz polaczenie'}
</Button>
<Button
type='button'
variant='destructive'
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
