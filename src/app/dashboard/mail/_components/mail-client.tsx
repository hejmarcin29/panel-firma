'use client';

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { getMailMessage, listMailFolders, listMailMessages, sendMail, toggleMailMessageRead } from '../actions';
import type { SendMailState } from '../actions';
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

type QuickFilterKey = 'all' | 'unread' | 'withAttachments' | 'starred';

type MessageGroup = {
  label: string;
  messages: MailMessageSummary[];
};

const QUICK_FILTERS: Array<{ key: QuickFilterKey; label: string }> = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'unread', label: 'Nieprzeczytane' },
  { key: 'withAttachments', label: 'Z załącznikami' },
  { key: 'starred', label: 'Oznaczone' },
];

const PRIMARY_FOLDER_COUNT = 5;

const initialToggleState: ToggleFormState = { status: 'idle' };
const initialSendState: SendMailState = { status: 'idle' };

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatFullTimestamp(value: string | null) {
  const date = parseDate(value);
  if (!date) {
    return 'brak daty';
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

function formatListTimestamp(value: string | null) {
  const date = parseDate(value);
  if (!date) {
    return '—';
  }

  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();

  return new Intl.DateTimeFormat('pl-PL', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit' }).format(date);
}

function formatGroupLabel(date: Date | null) {
  if (!date) {
    return 'Bez daty';
  }

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInDays = Math.round((todayMidnight.getTime() - dateMidnight.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Dzisiaj';
  }
  if (diffInDays === 1) {
    return 'Wczoraj';
  }

  return new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

function formatLastRefresh(value: Date | null) {
  if (!value) {
    return null;
  }

  const now = new Date();
  const sameDay = now.toDateString() === value.toDateString();
  const formatted = new Intl.DateTimeFormat('pl-PL', sameDay ? { hour: '2-digit', minute: '2-digit' } : { dateStyle: 'medium', timeStyle: 'short' }).format(value);

  return sameDay ? `Ostatnio odświeżono o ${formatted}` : `Ostatnio odświeżono: ${formatted}`;
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

function matchesQuickFilter(message: MailMessageSummary, filter: QuickFilterKey) {
  switch (filter) {
    case 'unread':
      return !message.isRead;
    case 'withAttachments':
      return message.hasAttachments;
    case 'starred':
      return message.isStarred;
    default:
      return true;
  }
}

function matchesSearchTerm(message: MailMessageSummary, normalizedTerm: string) {
  if (!normalizedTerm) {
    return true;
  }

  return (
    (message.subject ?? '').toLowerCase().includes(normalizedTerm) ||
    (message.from.name ?? '').toLowerCase().includes(normalizedTerm) ||
    (message.from.address ?? '').toLowerCase().includes(normalizedTerm) ||
    (message.snippet ?? '').toLowerCase().includes(normalizedTerm)
  );
}

function groupMessagesByDay(messages: MailMessageSummary[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const pointer = new Map<string, MessageGroup>();

  for (const message of messages) {
    const date = parseDate(message.receivedAt);
    const label = formatGroupLabel(date);
    const existing = pointer.get(label);

    if (existing) {
      existing.messages.push(message);
    } else {
      const group = { label, messages: [message] };
      pointer.set(label, group);
      groups.push(group);
    }
  }

  return groups;
}

function splitFoldersForDisplay(folders: MailFolderSummary[]) {
  return {
    primary: folders.slice(0, PRIMARY_FOLDER_COUNT),
    extra: folders.slice(PRIMARY_FOLDER_COUNT),
  };
}

export function MailClient({ accounts, initialFolders, initialMessages }: MailClientProps) {
  const [accountList, setAccountList] = useState(accounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [folders, setFolders] = useState(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolders[0]?.id ?? null);
  const [messages, setMessages] = useState(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(initialMessages[0]?.id ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearch = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey>('all');
  const [error, setError] = useState<string | null>(null);
  const [isListing, startListingTransition] = useTransition();
  const [isLoadingMessage, startMessageTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [sendState, sendAction, isSending] = useActionState(sendMail, initialSendState);
  const [, toggleAction, isToggling] = useActionState(toggleMailMessageReadHandler, initialToggleState);
  const composeFormRef = useRef<HTMLFormElement>(null);
  const [composeAccountId, setComposeAccountId] = useState<string | null>(accounts[0]?.id ?? null);

  const activeAccount = useMemo(
    () => accountList.find((account) => account.id === selectedAccountId) ?? null,
    [accountList, selectedAccountId],
  );

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId],
  );

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) ?? null,
    [messages, selectedMessageId],
  );

  const filteredMessages = useMemo(() => {
    if (quickFilter === 'all' && normalizedSearch === '') {
      return messages;
    }

    return messages.filter(
      (message) => matchesQuickFilter(message, quickFilter) && matchesSearchTerm(message, normalizedSearch),
    );
  }, [messages, quickFilter, normalizedSearch]);

  const groupedMessages = useMemo(() => groupMessagesByDay(filteredMessages), [filteredMessages]);

  const folderSplit = useMemo(() => splitFoldersForDisplay(folders), [folders]);

  useEffect(() => {
    if (sendState.status === 'success') {
      composeFormRef.current?.reset();
    }
  }, [sendState]);

  useEffect(() => {
    setComposeAccountId(selectedAccountId);
  }, [selectedAccountId]);

  useEffect(() => {
    if (filteredMessages.length === 0) {
      if (selectedMessageId !== null) {
        setSelectedMessageId(null);
      }
      return;
    }

    if (!selectedMessageId || !filteredMessages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedMessageId]);

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
        const toggleError = 'Nie udało się zaktualizować statusu wiadomości.';
        setError(toggleError);
        return { status: 'error', error: toggleError };
      }

      setMessages((prev) => prev.map((message) => (message.id === result.message.id ? result.message : message)));
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === result.message.folderId ? { ...folder, unreadCount: result.folderUnread } : folder,
        ),
      );
      setAccountList((prev) =>
        prev.map((account) =>
          account.id === result.message.accountId ? { ...account, unreadCount: result.accountUnread } : account,
        ),
      );
      setError(null);

      return { status: 'success' };
    } catch (actionError) {
      const errorMessage =
        actionError instanceof Error ? actionError.message : 'Wystąpił nieoczekiwany błąd podczas aktualizacji.';
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
    setComposeAccountId(accountId);
    setSelectedFolderId(null);
    setSelectedMessageId(null);
    setMessages([]);
    setFolders([]);
    setSearchTerm('');
    setQuickFilter('all');
    setError(null);

    startListingTransition(async () => {
      try {
        const nextFolders = await listMailFolders(accountId);
        setFolders(nextFolders);

        const nextFolderId = nextFolders[0]?.id ?? null;
        setSelectedFolderId(nextFolderId);

        if (nextFolderId) {
          const nextMessages = await listMailMessages({ accountId, folderId: nextFolderId });
          setMessages(nextMessages);
          setSelectedMessageId(nextMessages[0]?.id ?? null);
        } else {
          setMessages([]);
          setSelectedMessageId(null);
        }

        setLastRefreshAt(new Date());
      } catch (listError) {
        setError(listError instanceof Error ? listError.message : 'Nie udało się pobrać folderów skrzynki.');
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
        setLastRefreshAt(new Date());
      } catch (listError) {
        setError(listError instanceof Error ? listError.message : 'Nie udało się pobrać wiadomości.');
      }
    });
  }

  function handleSelectMessage(messageId: string) {
    if (messageId === selectedMessageId) {
      return;
    }

    setSelectedMessageId(messageId);

    startMessageTransition(async () => {
      try {
        const message = await getMailMessage(messageId);
        if (message) {
          setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
        }
      } catch (messageError) {
        setError(messageError instanceof Error ? messageError.message : 'Nie udało się pobrać treści wiadomości.');
      }
    });
  }

  async function handleRefresh() {
    if (!selectedAccountId) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const nextFolders = await listMailFolders(selectedAccountId);
      setFolders(nextFolders);

      const folderExists = selectedFolderId && nextFolders.some((folder) => folder.id === selectedFolderId);
      const nextFolderId = folderExists ? selectedFolderId : nextFolders[0]?.id ?? null;
      setSelectedFolderId(nextFolderId);

      let nextMessages: MailMessageSummary[] = [];
      if (nextFolderId) {
        nextMessages = await listMailMessages({ accountId: selectedAccountId, folderId: nextFolderId });
      }
      setMessages(nextMessages);

      const nextSelectedMessageId =
        nextMessages.length > 0 && selectedMessageId && nextMessages.some((item) => item.id === selectedMessageId)
          ? selectedMessageId
          : nextMessages[0]?.id ?? null;
      setSelectedMessageId(nextSelectedMessageId);

      const unreadTotal = nextFolders.reduce((total, folder) => total + (folder.unreadCount ?? 0), 0);
      setAccountList((prev) =>
        prev.map((account) =>
          account.id === selectedAccountId ? { ...account, unreadCount: unreadTotal } : account,
        ),
      );

      setLastRefreshAt(new Date());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Nie udało się odświeżyć skrzynki.');
    } finally {
      setIsRefreshing(false);
    }
  }

  const lastRefreshLabel = formatLastRefresh(lastRefreshAt);
  const activeFilterLabel = QUICK_FILTERS.find((filter) => filter.key === quickFilter)?.label ?? 'Wszystkie';

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Poczta firmowa</h1>
          <p className="text-sm text-muted-foreground">
            Monitoruj korespondencję z klientami bez opuszczania panelu administracyjnego.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isListing || !selectedAccountId}
          >
            {isRefreshing ? (
              <span className="flex items-center gap-2">
                <Spinner className="size-4" />
                <span>Odświeżanie…</span>
              </span>
            ) : (
              'Odśwież'
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/mail">Konfiguracja kont</Link>
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Wystąpił błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="flex h-full flex-col">
          <CardHeader className="space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div className="space-y-1">
                <CardTitle>Wiadomości</CardTitle>
                <CardDescription>
                  {activeAccount
                    ? `${activeAccount.unreadCount} nieprzeczytanych w skrzynce ${activeAccount.displayName}`
                    : 'Wybierz konto, aby rozpocząć pracę.'}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing || isListing || !selectedAccountId}
              >
                {isRefreshing ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-3.5" />
                    <span>Odświeżanie…</span>
                  </span>
                ) : (
                  'Odśwież'
                )}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {accountList.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <span className="truncate">
                        {activeAccount
                          ? `${activeAccount.displayName} (${activeAccount.email})`
                          : 'Wybierz konto'}
                      </span>
                      {activeAccount && activeAccount.unreadCount > 0 ? (
                        <Badge variant="secondary">{activeAccount.unreadCount}</Badge>
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[16rem]">
                    {accountList.map((account) => (
                      <DropdownMenuItem
                        key={account.id}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleSelectAccount(account.id);
                        }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">{account.displayName}</span>
                          <span className="truncate text-xs text-muted-foreground">{account.email}</span>
                        </div>
                        {account.unreadCount > 0 ? (
                          <Badge variant="secondary" className="ml-auto">
                            {account.unreadCount}
                          </Badge>
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="rounded-md border px-3 py-1.5 text-sm">
                  {activeAccount
                    ? `${activeAccount.displayName} (${activeAccount.email})`
                    : 'Brak skonfigurowanych kont'}
                </div>
              )}
              {activeAccount?.lastSyncAt ? (
                <span className="text-xs text-muted-foreground">
                  Ostatnia synchronizacja: {formatFullTimestamp(activeAccount.lastSyncAt)}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_FILTERS.map((filter) => (
                <Button
                  key={filter.key}
                  size="sm"
                  variant={quickFilter === filter.key ? 'secondary' : 'ghost'}
                  onClick={() => setQuickFilter(filter.key)}
                  disabled={isListing}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Szukaj po temacie, nadawcy lub treści…"
                disabled={isListing}
              />
              <span className="text-xs text-muted-foreground">
                {searchTerm
                  ? `Filtr aktywny: fraza „${searchTerm}”.`
                  : `Aktywny filtr: ${activeFilterLabel.toLowerCase()}.`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {folderSplit.primary.map((folder) => {
                const isActive = folder.id === selectedFolderId;
                return (
                  <Button
                    key={folder.id}
                    size="sm"
                    variant={isActive ? 'secondary' : 'outline'}
                    onClick={() => handleSelectFolder(folder.id)}
                    disabled={isListing}
                    className="gap-2"
                  >
                    <span>{folder.name}</span>
                    {folder.unreadCount > 0 ? (
                      <Badge variant={isActive ? 'default' : 'secondary'}>{folder.unreadCount}</Badge>
                    ) : null}
                  </Button>
                );
              })}
              {folderSplit.extra.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      Pozostałe
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {folderSplit.extra.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleSelectFolder(folder.id);
                        }}
                        className="flex items-center gap-3"
                      >
                        <span className="truncate">{folder.name}</span>
                        {folder.unreadCount > 0 ? (
                          <Badge variant="secondary" className="ml-auto">
                            {folder.unreadCount}
                          </Badge>
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            {lastRefreshLabel ? (
              <div className="text-xs text-muted-foreground">{lastRefreshLabel}</div>
            ) : null}
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden px-0">
            {isListing ? (
              <div className="flex h-full items-center justify-center">
                <Spinner className="size-6" />
              </div>
            ) : groupedMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
                {messages.length === 0
                  ? 'Brak wiadomości w tym folderze.'
                  : 'Brak wyników spełniających kryteria wyszukiwania.'}
              </div>
            ) : (
              <ScrollArea className="h-[520px]">
                <div className="flex flex-col">
                  {groupedMessages.map((group) => (
                    <div key={group.label}>
                      <div className="sticky top-0 z-10 border-b bg-background px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
                        {group.label}
                      </div>
                      <ul className="divide-y">
                        {group.messages.map((message) => {
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
                                  <p className="line-clamp-1 text-sm font-medium text-foreground">
                                    {message.subject ?? '(brak tematu)'}
                                  </p>
                                  <span className="shrink-0 text-xs text-muted-foreground">
                                    {formatListTimestamp(message.receivedAt)}
                                  </span>
                                </div>
                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                  {formatAddress(message.from)}
                                </p>
                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                  {message.snippet ?? message.textBody ?? 'Brak podglądu treści.'}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  {!message.isRead ? <Badge variant="destructive">Nowa</Badge> : null}
                                  {message.isStarred ? <Badge variant="outline">Oznaczona</Badge> : null}
                                  {message.hasAttachments ? <Badge variant="outline">Załączniki</Badge> : null}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>Podgląd</CardTitle>
            <CardDescription>
              {selectedMessage
                ? `Wiadomość z folderu ${activeFolder?.name ?? 'nieznany folder'}.`
                : 'Wybierz wiadomość, aby wyświetlić szczegóły.'}
            </CardDescription>
          </CardHeader>
          {selectedMessage ? (
            <>
              <CardContent className="flex-1 space-y-4 overflow-auto">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedMessage.subject ?? '(brak tematu)'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Odebrano: {formatFullTimestamp(selectedMessage.receivedAt)}
                  </p>
                </div>

                <div className="grid gap-2 text-sm">
                  <div>
                    <span className="font-medium">Od:</span> {formatAddress(selectedMessage.from)}
                  </div>
                  <div>
                    <span className="font-medium">Do:</span> {renderRecipients(selectedMessage.to)}
                  </div>
                  {selectedMessage.cc.length > 0 ? (
                    <div>
                      <span className="font-medium">DW:</span> {renderRecipients(selectedMessage.cc)}
                    </div>
                  ) : null}
                  {selectedMessage.bcc.length > 0 ? (
                    <div>
                      <span className="font-medium">UDW:</span> {renderRecipients(selectedMessage.bcc)}
                    </div>
                  ) : null}
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
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-foreground/90">
                    {selectedMessage.textBody ?? 'Brak treści do wyświetlenia.'}
                  </pre>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap items-center gap-1.5">
                <form action={toggleAction}>
                  <input type="hidden" name="messageId" value={selectedMessage.id} />
                  <input type="hidden" name="read" value={(!selectedMessage.isRead).toString()} />
                  <Button type="submit" size="sm" variant="outline" disabled={isToggling}>
                    {isToggling
                      ? 'Aktualizowanie…'
                      : selectedMessage.isRead
                        ? 'Oznacz jako nieprzeczytaną'
                        : 'Oznacz jako przeczytaną'}
                  </Button>
                </form>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`mailto:${selectedMessage.from.address ?? ''}`}>Odpowiedz</Link>
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">Wybierz wiadomość, aby wyświetlić szczegóły.</p>
            </CardContent>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nowa wiadomość</CardTitle>
          <CardDescription>Wyślij e-mail bezpośrednio z panelu administracyjnego.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {sendState.status === 'success' && sendState.message ? (
            <Alert>
              <AlertTitle>Sukces</AlertTitle>
              <AlertDescription>{sendState.message}</AlertDescription>
            </Alert>
          ) : null}
          {sendState.status === 'error' && sendState.message ? (
            <Alert variant="destructive">
              <AlertTitle>Nie udało się wysłać wiadomości</AlertTitle>
              <AlertDescription>{sendState.message}</AlertDescription>
            </Alert>
          ) : null}
          <form
            ref={composeFormRef}
            action={sendAction}
            encType="multipart/form-data"
            className="space-y-3.5"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="accountId">Konto nadawcze</Label>
                <select
                  id="accountId"
                  name="accountId"
                  value={composeAccountId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setComposeAccountId(value ? value : null);
                  }}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                  disabled={isSending}
                  required
                >
                  <option value="" disabled>
                    Wybierz konto
                  </option>
                  {accountList.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.displayName} ({account.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Temat</Label>
                <Input id="subject" name="subject" placeholder="Np. Aktualizacja statusu zamówienia" disabled={isSending} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to">Adresaci</Label>
              <Input
                id="to"
                name="to"
                placeholder="adres@example.com, drugi@example.com"
                required
                disabled={isSending}
              />
              {sendState.errors?.to ? (
                <p className="text-sm text-destructive">{sendState.errors.to}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Oddziel adresy przecinkiem, średnikiem lub nową linią.</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cc">DW</Label>
                <Input id="cc" name="cc" placeholder="(opcjonalnie)" disabled={isSending} />
                {sendState.errors?.cc ? <p className="text-sm text-destructive">{sendState.errors.cc}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bcc">UDW</Label>
                <Input id="bcc" name="bcc" placeholder="(opcjonalnie)" disabled={isSending} />
                {sendState.errors?.bcc ? <p className="text-sm text-destructive">{sendState.errors.bcc}</p> : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body">Wiadomość</Label>
              <Textarea id="body" name="body" rows={8} placeholder="Wpisz treść wiadomości" required disabled={isSending} />
              {sendState.errors?.body ? <p className="text-sm text-destructive">{sendState.errors.body}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="attachments">Załączniki</Label>
              <Input id="attachments" name="attachments" type="file" multiple disabled={isSending} />
              <p className="text-xs text-muted-foreground">Maksymalnie 10 MB na plik, łącznie do 25 MB.</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button type="submit" disabled={isSending || !composeAccountId}>
                {isSending ? 'Wysyłanie…' : 'Wyślij wiadomość'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

