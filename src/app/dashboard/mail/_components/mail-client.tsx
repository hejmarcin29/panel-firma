'use client';

import * as React from 'react';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Mail, 
  Inbox, 
  Send, 
  Trash2, 
  MoreVertical,
  Paperclip,
  User,
  Plus,
  Reply,
  Forward
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

import { getMailMessage, listMailFolders, listMailMessages, sendMail, toggleMailMessageRead } from '../actions';
import { syncMailAccount } from '../../settings/mail/actions';
import type { MailAccountSummary, MailFolderSummary, MailMessageSummary } from '../types';
import { ComposeForm } from './compose-form';
import { useRouter } from 'next/navigation';

// --- Types & Helpers ---

type MailClientProps = {
  accounts: MailAccountSummary[];
  initialFolders: MailFolderSummary[];
  initialMessages: MailMessageSummary[];
};

type ComposeDefaults = {
  accountId?: string;
  to?: string;
  subject?: string;
  body?: string;
};

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMessageDate(value: string | null) {
  const date = parseDate(value);
  if (!date) return '';
  
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  
  return new Intl.DateTimeFormat('pl-PL', {
    hour: isToday ? '2-digit' : undefined,
    minute: isToday ? '2-digit' : undefined,
    day: !isToday ? '2-digit' : undefined,
    month: !isToday ? '2-digit' : undefined,
    year: !isToday ? 'numeric' : undefined,
  }).format(date);
}

function formatFullDate(value: string | null) {
  const date = parseDate(value);
  if (!date) return 'Brak daty';
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

// --- Compose Dialog Component ---

function ComposeDialog({ 
  open, 
  onOpenChange, 
  accounts, 
  defaults 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  accounts: MailAccountSummary[];
  defaults?: ComposeDefaults;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Nowa wiadomość</DialogTitle>
          <DialogDescription>Wypełnij formularz, aby wysłać wiadomość e-mail.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[600px]">
            <div className="p-6 pt-2">
                <ComposeForm 
                    accounts={accounts} 
                    defaults={defaults} 
                    onSuccess={() => onOpenChange(false)} 
                    onCancel={() => onOpenChange(false)}
                />
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---

export function MailClient({ accounts, initialFolders, initialMessages }: MailClientProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  
  // State
  const [selectedAccountId] = React.useState<string | null>(accounts[0]?.id ?? null);
  const [folders, setFolders] = React.useState(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(initialFolders[0]?.id ?? null);
  const [messages, setMessages] = React.useState(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Compose State
  const [isComposeOpen, setIsComposeOpen] = React.useState(false);
  const [composeDefaults, setComposeDefaults] = React.useState<ComposeDefaults | undefined>(undefined);

  // Transitions
  const [isListing, startListing] = React.useTransition();
  const [, startLoadingMessage] = React.useTransition();

  // Derived State
  const activeFolder = React.useMemo(() => 
    folders.find(f => f.id === selectedFolderId), 
  [folders, selectedFolderId]);

  const selectedMessage = React.useMemo(() => 
    messages.find(m => m.id === selectedMessageId), 
  [messages, selectedMessageId]);

  const filteredMessages = React.useMemo(() => {
    if (!searchTerm) return messages;
    const lower = searchTerm.toLowerCase();
    return messages.filter(m => 
      (m.subject?.toLowerCase().includes(lower)) ||
      (m.from.name?.toLowerCase().includes(lower)) ||
      (m.from.address?.toLowerCase().includes(lower))
    );
  }, [messages, searchTerm]);

  // Handlers
  const handleRefresh = async () => {
    if (!selectedAccountId) return;
    
    setIsRefreshing(true);
    try {
      const syncResult = await syncMailAccount(selectedAccountId);
      if (syncResult.status === 'error') {
        toast.error(syncResult.message || "Błąd synchronizacji");
      } else {
        toast.success("Skrzynka zaktualizowana");
      }

      // Reload data
      const nextFolders = await listMailFolders(selectedAccountId);
      setFolders(nextFolders);
      
      if (selectedFolderId) {
        const nextMessages = await listMailMessages({ accountId: selectedAccountId, folderId: selectedFolderId });
        setMessages(nextMessages);
      }
    } catch {
      toast.error("Wystąpił błąd podczas odświeżania");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectFolder = (folderId: string) => {
    if (folderId === selectedFolderId) return;
    
    setSelectedFolderId(folderId);
    setSelectedMessageId(null); // Clear selection when changing folder
    
    startListing(async () => {
      try {
        if (!selectedAccountId) return;
        const msgs = await listMailMessages({ accountId: selectedAccountId, folderId });
        setMessages(msgs);
      } catch {
        toast.error("Nie udało się pobrać wiadomości");
      }
    });
  };

  const handleSelectMessage = (messageId: string) => {
    if (messageId === selectedMessageId) return;
    
    setSelectedMessageId(messageId);
    
    startLoadingMessage(async () => {
      try {
        const fullMsg = await getMailMessage(messageId);
        if (fullMsg) {
          setMessages(prev => prev.map(m => m.id === fullMsg.id ? fullMsg : m));
          
          if (!fullMsg.isRead) {
             await toggleMailMessageRead(messageId, true);
             setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
             setFolders(prev => prev.map(f => 
               f.id === fullMsg.folderId ? { ...f, unreadCount: Math.max(0, (f.unreadCount || 0) - 1) } : f
             ));
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleCompose = () => {
    if (isMobile) {
        router.push('/dashboard/mail/compose');
        return;
    }
    setComposeDefaults({ accountId: selectedAccountId ?? undefined });
    setIsComposeOpen(true);
  };

  const handleReply = (msg: MailMessageSummary) => {
    setComposeDefaults({
      accountId: msg.accountId,
      to: msg.from.address || "",
      subject: msg.subject?.startsWith("Re:") ? msg.subject : `Re: ${msg.subject || "Bez tematu"}`,
      body: `\n\n\n--- Oryginalna wiadomość ---\nOd: ${msg.from.name || msg.from.address}\nData: ${formatFullDate(msg.receivedAt)}\n\n${msg.textBody || msg.snippet || ""}`
    });
    setIsComposeOpen(true);
  };

  // --- Render Components ---

  const FolderList = () => (
    <div className="flex flex-col gap-1 p-2 h-full">
      <div className="px-2 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Foldery</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Odśwież skrzynkę</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="space-y-1">
        {folders.map(folder => (
          <Button
            key={folder.id}
            variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start font-normal",
              selectedFolderId === folder.id && "bg-secondary/50"
            )}
            onClick={() => handleSelectFolder(folder.id)}
          >
            <Inbox className="mr-2 h-4 w-4" />
            <span className="truncate flex-1 text-left">{folder.name}</span>
            {folder.unreadCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
                {folder.unreadCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );

  const MessageList = () => (
    <div className="flex flex-col h-full">
      <div className="p-2 md:p-4 border-b space-y-2 md:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Tablet Folder Trigger (visible only on MD screens) */}
            <div className="hidden md:block lg:hidden">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="-ml-2">
                     <Inbox className="h-4 w-4" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="start" className="w-[200px]">
                   {folders.map(f => (
                     <DropdownMenuItem key={f.id} onClick={() => handleSelectFolder(f.id)}>
                       {f.name}
                       {f.unreadCount > 0 && <span className="ml-auto text-xs">{f.unreadCount}</span>}
                     </DropdownMenuItem>
                   ))}
                 </DropdownMenuContent>
               </DropdownMenu>
            </div>
            <h1 className="text-xl font-bold truncate hidden md:block">{activeFolder?.name || "Wiadomości"}</h1>
          </div>
          <Button size="sm" onClick={handleCompose} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nowa</span>
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Szukaj..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isListing ? (
          <div className="p-8 flex justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Brak wiadomości
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {filteredMessages.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg.id)}
                className={cn(
                  "flex w-full flex-col items-start gap-2 p-4 text-left hover:bg-accent/50 transition-colors",
                  selectedMessageId === msg.id && "bg-accent",
                  !msg.isRead && "bg-muted/30"
                )}
              >
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {!msg.isRead && (
                        <span className="flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                      <span className={cn("truncate text-sm", !msg.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                        {msg.from.name || msg.from.address}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 shrink-0">
                      {formatMessageDate(msg.receivedAt)}
                    </span>
                  </div>
                  <div className={cn("text-xs w-full truncate", !msg.isRead ? "font-semibold text-foreground" : "font-medium")}>
                    {msg.subject || "(Brak tematu)"}
                  </div>
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground w-full">
                  {msg.snippet || "Brak podglądu"}
                </div>
                {msg.hasAttachments && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 gap-1 mt-1">
                    <Paperclip className="h-3 w-3" /> Załącznik
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const MessageDetail = () => {
    if (!selectedMessage) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-muted-foreground gap-4">
          <Mail className="h-12 w-12 opacity-20" />
          <p>Wybierz wiadomość, aby ją przeczytać</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center p-4 border-b gap-2 sticky top-0 bg-background z-10">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedMessageId(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
             <h2 className="text-lg font-semibold truncate" title={selectedMessage.subject || ""}>
               {selectedMessage.subject || "(Brak tematu)"}
             </h2>
          </div>
          <div className="flex items-center gap-1">
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" onClick={() => handleReply(selectedMessage)}>
                     <Reply className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>Odpowiedz</TooltipContent>
               </Tooltip>
             </TooltipProvider>
             
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon">
                   <MoreVertical className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem disabled>
                   <Forward className="mr-2 h-4 w-4" /> Przekaż
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem className="text-destructive" disabled>
                   <Trash2 className="mr-2 h-4 w-4" /> Usuń
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 w-full">
          <div className="p-6 space-y-6 max-w-full">
            {/* Sender Info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid gap-0.5">
                  <div className="font-semibold text-sm">{selectedMessage.from.name}</div>
                  <div className="text-xs text-muted-foreground select-all">{selectedMessage.from.address}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Do: {selectedMessage.to.join(", ")}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right shrink-0">
                {formatFullDate(selectedMessage.receivedAt)}
              </div>
            </div>
            
            {selectedMessage.hasAttachments && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Paperclip className="h-3 w-3" />
                  Załączniki dostępne (pobieranie wkrótce)
                </Badge>
              </div>
            )}

            <Separator />
            
            {/* Body */}
            <div className="min-h-[200px] w-full max-w-full">
              {selectedMessage.htmlBody ? (
                 <div className="rounded-md border bg-white p-4 overflow-x-auto w-full max-w-[calc(100vw-3rem)] lg:max-w-full">
                   <div 
                     className="prose prose-sm max-w-none text-black min-w-0"
                     dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
                   />
                 </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-muted/20 p-4 rounded-md overflow-x-auto">
                  {selectedMessage.textBody || selectedMessage.snippet || "Brak treści wiadomości."}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  // --- Main Layout Logic ---

  return (
    <>
      <ComposeDialog 
        open={isComposeOpen} 
        onOpenChange={setIsComposeOpen} 
        accounts={accounts}
        defaults={composeDefaults}
      />

      {isMobile ? (
        // Mobile Layout
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {selectedMessageId ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-200 bg-background">
              <MessageDetail />
            </div>
          ) : (
            <>
              <div className="p-2 border-b flex items-center gap-2">
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="flex-1 justify-between">
                       <span className="flex items-center gap-2">
                         <Inbox className="h-4 w-4" />
                         {activeFolder?.name || "Foldery"}
                       </span>
                       <MoreVertical className="h-4 w-4 opacity-50" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="start" className="w-[200px]">
                     {folders.map(f => (
                       <DropdownMenuItem key={f.id} onClick={() => handleSelectFolder(f.id)}>
                         {f.name}
                         {f.unreadCount > 0 && <span className="ml-auto text-xs">{f.unreadCount}</span>}
                       </DropdownMenuItem>
                     ))}
                   </DropdownMenuContent>
                 </DropdownMenu>
                 <Button size="icon" variant="ghost" onClick={handleRefresh}>
                   <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                 </Button>
              </div>
              <MessageList />
            </>
          )}
        </div>
      ) : (
        // Desktop Layout
        <div className="h-[calc(100vh-4rem)] border rounded-lg overflow-hidden bg-background shadow-sm">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={25} className="hidden lg:block border-r bg-muted/10">
              <FolderList />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={35} minSize={30} className="border-r">
              <MessageList />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={45}>
              <MessageDetail />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </>
  );
}

