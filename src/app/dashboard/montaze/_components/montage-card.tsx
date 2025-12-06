'use client';

import { useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import {
CalendarDays,
CheckCircle2Icon,
ClockIcon,
FileIcon,
Mail,
MessageSquareIcon,
Phone,
User,
Loader2,
Check
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
addMontageNote,
addMontageTask,
toggleMontageChecklistItem,
toggleMontageTask,
updateMontageMaterialDetails,
updateMontageContactDetails,
updateMontageStatus,
  uploadChecklistAttachment,
} from '../actions';
import type { MontageStatus } from '@/lib/db/schema';
import type { Montage, MontageAttachment, StatusOption, TimestampValue } from '../types';
import { MontageMeasurementTab } from './montage-measurement-tab';

function formatTimestamp(value: TimestampValue) {
if (!value) {
return 'brak daty';
}

const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : Number(value));

if (Number.isNaN(date.getTime())) {
return 'brak daty';
}

return new Intl.DateTimeFormat('pl-PL', {
dateStyle: 'short',
timeStyle: 'short',
}).format(date);
}

function formatDateInputValue(value: TimestampValue) {
if (!value) {
return '';
}

const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : Number(value));

if (Number.isNaN(date.getTime())) {
return '';
}

return date.toISOString().slice(0, 10);
}

function attachmentDisplayName(attachment: MontageAttachment) {
if (attachment.title) {
return attachment.title;
}

const url = attachment.url;
const clean = url.split('?')[0] ?? url;
const segments = clean.split('/');
return segments[segments.length - 1] ?? url;
}

type TimelineEventType = 'note' | 'task' | 'task-completed' | 'milestone';

type TimelineEvent = {
id: string;
type: TimelineEventType;
  date: Date;
  content: string;
  author?: string;
  meta?: Record<string, unknown>;
};type Props = {
montage: Montage;
statusOptions: StatusOption[];
};

export function MontageCard({ montage, statusOptions }: Props) {
const router = useRouter();
const [activeTab, setActiveTab] = useState('overview');

// Status
const [statusPending, startStatusTransition] = useTransition();
  const handleStatusChange = (value: string) => {
    startStatusTransition(async () => {
      await updateMontageStatus({ montageId: montage.id, status: value as MontageStatus });
      router.refresh();
    });
  };// Notes
const [noteContent, setNoteContent] = useState('');
const [notePending, startNoteTransition] = useTransition();
  const submitNote = (e: FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    startNoteTransition(async () => {
      const formData = new FormData();
      formData.append('montageId', montage.id);
      formData.append('content', noteContent);
      await addMontageNote(formData);
      setNoteContent('');
      router.refresh();
    });
  };// Tasks
const [taskContent, setTaskContent] = useState('');
const [taskPending, startTaskTransition] = useTransition();
  const submitTask = (e: FormEvent) => {
    e.preventDefault();
    if (!taskContent.trim()) return;
    startTaskTransition(async () => {
      await addMontageTask({ montageId: montage.id, title: taskContent, source: 'manual' });
      setTaskContent('');
      router.refresh();
    });
  };const handleTaskToggle = (taskId: string, completed: boolean) => {
startTaskTransition(async () => {
      await toggleMontageTask({ taskId, montageId: montage.id, completed });
router.refresh();
});
};

// Contact Details - Auto-save
const [contactDraft, setContactDraft] = useState({
clientName: montage.clientName,
contactPhone: montage.contactPhone ?? '',
contactEmail: montage.contactEmail ?? '',
billingAddress: montage.billingAddress ?? '',
billingCity: montage.billingCity ?? '',
installationAddress: montage.installationAddress ?? '',
installationCity: montage.installationCity ?? '',
scheduledInstallationDate: formatDateInputValue(montage.scheduledInstallationAt),
});
  const [contactPending, startContactTransition] = useTransition();
  const [contactError, setContactError] = useState<string | null>(null);
  const [isContactSaving, setIsContactSaving] = useState(false);

  const debouncedContactSave = useDebouncedCallback(async (data: typeof contactDraft) => {
    setIsContactSaving(true);
    setContactError(null);

    startContactTransition(async () => {
      try {
        await updateMontageContactDetails({
          montageId: montage.id,
          clientName: data.clientName,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          billingAddress: data.billingAddress,
          billingCity: data.billingCity,
          installationAddress: data.installationAddress,
          installationCity: data.installationCity,
          scheduledInstallationDate: data.scheduledInstallationDate || undefined,
        });
        router.refresh();
      } catch {
        setContactError('Wystąpił błąd podczas zapisu.');
      } finally {
        setIsContactSaving(false);
      }
    });
  }, 1000);const handleContactFieldChange = (field: keyof typeof contactDraft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
const val = e.target.value;
const newData = { ...contactDraft, [field]: val };
setContactDraft(newData);
debouncedContactSave(newData);
};

  // Materials - Auto-save
  const [materialsDraft, setMaterialsDraft] = useState(montage.materialDetails ?? '');
  const [materialsPending, startMaterialsTransition] = useTransition();
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [isMaterialsSaving, setIsMaterialsSaving] = useState(false);

  const debouncedMaterialsSave = useDebouncedCallback(async (value: string) => {
    setIsMaterialsSaving(true);
    setMaterialsError(null);

    startMaterialsTransition(async () => {
      try {
        await updateMontageMaterialDetails({ montageId: montage.id, materialDetails: value });
        router.refresh();
      } catch {
        setMaterialsError('Błąd zapisu materiałów.');
      } finally {
        setIsMaterialsSaving(false);
      }
    });
  }, 1000);const handleMaterialsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
const val = e.target.value;
setMaterialsDraft(val);
debouncedMaterialsSave(val);
};

// Checklist
const [checklistPending, startChecklistTransition] = useTransition();
const [checklistPendingId, setChecklistPendingId] = useState<string | null>(null);
const [checklistError, setChecklistError] = useState<string | null>(null);

const handleChecklistToggle = (itemId: string, completed: boolean) => {
setChecklistPendingId(itemId);
startChecklistTransition(async () => {
try {
        await toggleMontageChecklistItem({ itemId, montageId: montage.id, completed });
router.refresh();
} catch {
setChecklistError('Nie udało się zaktualizować etapu.');
} finally {
setChecklistPendingId(null);
}
});
};

const submitChecklistAttachment = (itemId: string) => (e: FormEvent<HTMLFormElement>) => {
e.preventDefault();
const formData = new FormData(e.currentTarget);
setChecklistPendingId(itemId);
startChecklistTransition(async () => {
try {
await uploadChecklistAttachment(formData);
router.refresh();
} catch {
setChecklistError('Błąd wysyłania załącznika.');
} finally {
setChecklistPendingId(null);
}
});
};

// Derived state
const installationAddress = montage.installationAddress || montage.billingAddress;
const installationCity = montage.installationCity || montage.billingCity;
const draftAddressesMatch =
contactDraft.billingAddress === contactDraft.installationAddress &&
contactDraft.billingCity === contactDraft.installationCity;

// Timeline construction
const timelineEvents: TimelineEvent[] = [
...montage.notes.map((n) => ({
id: n.id,
type: 'note' as TimelineEventType,
date: new Date(n.createdAt ?? new Date()),
content: n.content,
author: n.authorName,
})),
...montage.tasks.map((t) => ({
id: t.id,
type: (t.completed ? 'task-completed' : 'task') as TimelineEventType,
date: new Date(t.createdAt ?? new Date()),
content: t.content,
author: undefined,
})),
].sort((a, b) => b.date.getTime() - a.date.getTime());

const totalChecklistItems = montage.checklistItems.length;
const completedChecklistItems = montage.checklistItems.filter((i) => i.completed).length;
const checklistProgressLabel = `${completedChecklistItems}/${totalChecklistItems}`;
const openTasks = montage.tasks.filter((t) => !t.completed).length;

return (
<div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
{/* Left Column: Main Content */}
<div className='flex-1 space-y-6'>
{/* Header Card */}
<div className='rounded-3xl border border-border/60 bg-card p-5 shadow-sm md:p-6'>
<div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
<div className='space-y-1.5'>
<div className='flex items-center gap-2'>
<Badge variant='outline' className='rounded-md border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary'>
#{montage.orderNumber}
</Badge>
<span className='text-xs text-muted-foreground'>Utworzono: {formatTimestamp(montage.createdAt)}</span>
</div>
<h1 className='text-2xl font-bold tracking-tight text-foreground md:text-3xl'>{montage.clientName}</h1>
<div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
{montage.contactPhone && (
<a href={`tel:${montage.contactPhone}`} className='flex items-center gap-1.5 hover:text-foreground transition-colors'>
<Phone className='size-3.5' />
{montage.contactPhone}
</a>
)}
{montage.contactEmail && (
<a href={`mailto:${montage.contactEmail}`} className='flex items-center gap-1.5 hover:text-foreground transition-colors'>
<Mail className='size-3.5' />
{montage.contactEmail}
</a>
)}
</div>
</div>
<div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
<Select value={montage.status} onValueChange={handleStatusChange} disabled={statusPending}>
<SelectTrigger className={cn('h-9 w-[180px] border-border/60 bg-background/50 transition-colors hover:bg-accent/50', {
'border-emerald-500/50 text-emerald-700 bg-emerald-50/50': montage.status === 'completed',
'border-blue-500/50 text-blue-700 bg-blue-50/50': montage.status === 'in_progress',
})}>
<SelectValue />
</SelectTrigger>
<SelectContent>
{statusOptions.map((opt) => (
<SelectItem key={opt.value} value={opt.value}>
{opt.label}
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>
</div>

{/* Tabs & Content */}
<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
<div className='mb-4 overflow-x-auto pb-1 scrollbar-hide'>
<TabsList className='inline-flex h-10 items-center justify-start rounded-xl bg-muted/50 p-1 text-muted-foreground'>
<TabsTrigger value='overview' className='rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'>
Przegląd
</TabsTrigger>
<TabsTrigger value='contact' className='rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'>
Dane i Termin
</TabsTrigger>
<TabsTrigger value='materials' className='rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'>
Materiały
</TabsTrigger>
<TabsTrigger value='measurement' className='rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'>
Pomiary
</TabsTrigger>
<TabsTrigger value='checklist' className='rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'>
Lista kontrolna
</TabsTrigger>
</TabsList>
</div>

<TabsContent value='overview' className='space-y-6'>
<div className='grid gap-6 md:grid-cols-2'>
{/* Left Column of Overview */}
<div className='space-y-6'>
{/* Next Step / Status Summary */}
<div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
<h3 className='mb-3 text-sm font-semibold text-foreground'>Status realizacji</h3>
<div className='space-y-4'>
<div className='flex items-center justify-between rounded-xl bg-muted/30 p-3'>
<div className='flex items-center gap-3'>
<div className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
<CalendarDays className='size-5' />
</div>
<div>
<p className='text-xs font-medium text-muted-foreground'>Planowany montaż</p>
<p className='text-sm font-semibold text-foreground'>{formatTimestamp(montage.scheduledInstallationAt)}</p>
</div>
</div>
</div>
<div className='space-y-2'>
<div className='flex items-center justify-between text-xs'>
<span className='text-muted-foreground'>Postęp listy kontrolnej</span>
<span className='font-medium text-foreground'>{Math.round(totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0)}%</span>
</div>
<div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
<div 
className='h-full bg-primary transition-all duration-500 ease-in-out' 
style={{ width: `${totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 0}%` }} 
/>
</div>
<p className='text-xs text-muted-foreground'>
Otwarte zadania: <span className='font-medium text-foreground'>{openTasks}</span>
</p>
</div>
</div>
</div>

{/* Contact Mini Card */}
<div className='rounded-2xl border border-border/60 bg-muted/10 p-4'>
<div className='mb-3 flex items-center justify-between'>
<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>Kontakt</p>
<Button type='button' size='sm' variant='ghost' className='h-6 px-2 text-[10px]' onClick={() => setActiveTab('contact')}>
Szczegóły
</Button>
</div>
<div className='space-y-2'>
<div className='flex items-center gap-2 text-sm'>
<User className='size-4 text-muted-foreground' />
<span className='truncate font-medium'>{montage.clientName}</span>
</div>
{montage.contactPhone && (
<div className='flex items-center gap-2 text-sm'>
<Phone className='size-4 text-muted-foreground' />
<a href={`tel:${montage.contactPhone}`} className='hover:underline'>{montage.contactPhone}</a>
</div>
)}
{installationAddress && (
<div className='flex items-start gap-2 text-sm'>
<div className='mt-0.5'><div className='size-4 rounded-full border-2 border-muted-foreground/40' /></div>
<span className='text-muted-foreground'>{installationAddress}, {installationCity}</span>
</div>
)}
</div>
</div>
</div>
</div>
</TabsContent>
<TabsContent value='contact' className='space-y-3'>
<div className='space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4'>
<div className='flex flex-wrap items-center justify-between gap-3'>
<div className='space-y-1'>
<Label className='text-xs uppercase tracking-wide text-muted-foreground'>Dane klienta i adresy</Label>
<p className='text-xs text-muted-foreground'>
Aktualizuj informacje kontaktowe, adresowe oraz planowany termin montażu.
</p>
</div>
<div className='flex items-center gap-2'>
{isContactSaving ? (
<span className='text-xs text-muted-foreground flex items-center gap-1'>
<Loader2 className='w-3 h-3 animate-spin' />
Zapisywanie...
</span>
) : (
<span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isContactSaving}>
<Check className='w-3 h-3' />
Zapisano
</span>
)}
</div>
</div>
{contactError ? <span className='text-xs text-destructive'>{contactError}</span> : null}
<div className='grid gap-3 md:grid-cols-2'>
<div className='space-y-1.5'>
<Label htmlFor='contact-client-name'>Imię i nazwisko / firma</Label>
<Input
id='contact-client-name'
value={contactDraft.clientName}
onChange={handleContactFieldChange('clientName')}
disabled={contactPending}
required
/>
</div>
<div className='space-y-1.5'>
<Label htmlFor='contact-phone'>Telefon</Label>
<Input
id='contact-phone'
value={contactDraft.contactPhone}
onChange={handleContactFieldChange('contactPhone')}
disabled={contactPending}
placeholder='np. +48 600 000 000'
/>
</div>
<div className='space-y-1.5'>
<Label htmlFor='contact-email'>E-mail</Label>
<Input
id='contact-email'
type='email'
value={contactDraft.contactEmail}
onChange={handleContactFieldChange('contactEmail')}
disabled={contactPending}
placeholder='np. klient@firma.pl'
/>
</div>
<div className='space-y-1.5'>
<Label htmlFor='contact-installation-date'>Termin montażu</Label>
<Input
id='contact-installation-date'
type='date'
value={contactDraft.scheduledInstallationDate}
onChange={handleContactFieldChange('scheduledInstallationDate')}
disabled={contactPending}
/>
</div>
</div>
<div className='grid gap-3 md:grid-cols-2'>
<div className='space-y-2 rounded-xl border border-border/60 bg-background/60 p-3'>
<div className='space-y-1.5'>
<Label htmlFor='contact-billing-address'>Adres faktury</Label>
<Textarea
id='contact-billing-address'
value={contactDraft.billingAddress}
onChange={handleContactFieldChange('billingAddress')}
disabled={contactPending}
rows={3}
/>
</div>
<div className='space-y-1.5'>
<Label htmlFor='contact-billing-city'>Miasto</Label>
<Input
id='contact-billing-city'
value={contactDraft.billingCity}
onChange={handleContactFieldChange('billingCity')}
disabled={contactPending}
placeholder='np. Warszawa'
/>
</div>
</div>
<div className='space-y-2 rounded-xl border border-border/60 bg-background/60 p-3'>
<div className='space-y-1.5'>
<Label htmlFor='contact-installation-address'>Adres montażu</Label>
<Textarea
id='contact-installation-address'
value={contactDraft.installationAddress}
onChange={handleContactFieldChange('installationAddress')}
disabled={contactPending}
rows={3}
/>
</div>
<div className='space-y-1.5'>
<Label htmlFor='contact-installation-city'>Miasto</Label>
<Input
id='contact-installation-city'
value={contactDraft.installationCity}
onChange={handleContactFieldChange('installationCity')}
disabled={contactPending}
placeholder='np. Kraków'
/>
</div>
{draftAddressesMatch && contactDraft.installationAddress ? (
<p className='text-[11px] text-muted-foreground'>Adres może pokrywać się z danymi faktury.</p>
) : null}
</div>
</div>
</div>
</TabsContent>
<TabsContent value='materials' className='space-y-3'>
<div className='space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4'>
<div className='flex flex-wrap items-center justify-between gap-3'>
<div className='space-y-1'>
<Label className='text-xs uppercase tracking-wide text-muted-foreground'>Materiały i ilości</Label>
<p className='text-xs text-muted-foreground'>
Zapisz co zostało zamówione, aby ekipa była gotowa do montażu.
</p>
</div>
<div className='flex items-center gap-2'>
{isMaterialsSaving ? (
<span className='text-xs text-muted-foreground flex items-center gap-1'>
<Loader2 className='w-3 h-3 animate-spin' />
Zapisywanie...
</span>
) : (
<span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isMaterialsSaving}>
<Check className='w-3 h-3' />
Zapisano
</span>
)}
</div>
</div>
<div className='space-y-3'>
<Textarea
value={materialsDraft}
onChange={handleMaterialsChange}
placeholder='np. Rolety dzień-noc — 4 szt., Markiza tarasowa — 1 szt.'
rows={4}
disabled={materialsPending}
/>
<div className='flex flex-wrap items-center justify-between gap-3'>
{materialsError ? (
<span className='text-xs text-destructive'>{materialsError}</span>
) : (
<span className='text-xs text-muted-foreground'>Informacja widoczna dla całego zespołu.</span>
)}
</div>
</div>
</div>
</TabsContent>
<TabsContent value='measurement' className='space-y-3'>
<div className='rounded-2xl border border-border/60 bg-muted/10 p-4'>
<MontageMeasurementTab montage={montage} />
</div>
</TabsContent>
<TabsContent value='checklist' className='space-y-3'>
<div className='space-y-3.5 rounded-2xl border border-border/60 bg-muted/10 p-4'>
<div className='flex flex-wrap items-center justify-between gap-2.5'>
<h3 className='text-sm font-semibold text-foreground'>Lista kontrolna montażu</h3>
<div className='text-xs text-muted-foreground'>{checklistProgressLabel} etapów zamkniętych</div>
</div>
{checklistError ? <span className='text-xs text-destructive'>{checklistError}</span> : null}
{montage.checklistItems.length === 0 ? (
<p className='text-sm text-muted-foreground'>Brak pozycji na liście kontrolnej. Dodaj je w ustawieniach panelu.</p>
) : (
<ul className='space-y-2.5'>
{montage.checklistItems.map((item) => (
<li key={item.id} className='space-y-2.5 rounded-xl border border-border/60 bg-background p-3.5 shadow-sm'>
<div className='flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between'>
<label className='flex items-start gap-2 text-sm font-medium text-foreground'>
<Checkbox
checked={item.completed}
onCheckedChange={(value) => handleChecklistToggle(item.id, Boolean(value))}
disabled={checklistPending || checklistPendingId === item.id}
/>
<div className='space-y-1'>
<p>{item.label}</p>
{item.allowAttachment ? (
<span className='text-xs text-muted-foreground'>Załącznik potwierdzający etap jest dostępny.</span>
) : null}
</div>
</label>
<div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
<span>Aktualizacja: {formatTimestamp(item.updatedAt)}</span>
{item.completed ? <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700'>Zakończono</span> : null}
</div>
</div>
{item.allowAttachment ? (
<div className='space-y-2.5 rounded-xl border border-dashed border-border/70 bg-muted/10 p-3.5'>
{item.attachment ? (
<a
href={item.attachment.url}
target='_blank'
rel='noopener noreferrer'
className='group flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition hover:border-primary/60'
>
<FileIcon className='size-4 text-muted-foreground transition group-hover:text-primary' />
<span className='truncate text-foreground group-hover:text-primary'>
{attachmentDisplayName(item.attachment)}
</span>
</a>
) : (
<p className='text-xs text-muted-foreground'>Brak załącznika dla tego etapu.</p>
)}
<form onSubmit={submitChecklistAttachment(item.id)} className='flex flex-col gap-2 md:flex-row md:items-center md:gap-2.5'>
<input type='hidden' name='montageId' defaultValue={montage.id} />
<input type='hidden' name='itemId' defaultValue={item.id} />
<Input
name='file'
type='file'
accept='image/*,application/pdf'
required
className='h-9 text-xs file:mr-2 file:h-full file:border-0 file:bg-transparent file:text-xs file:font-medium'
/>
<Button type='submit' size='sm' variant='secondary' disabled={checklistPending && checklistPendingId === item.id}>
{checklistPending && checklistPendingId === item.id ? 'Wysyłanie...' : 'Dodaj'}
</Button>
</form>
</div>
) : null}
</li>
))}
</ul>
)}
</div>
</TabsContent>
</Tabs>

{/* Timeline */}
<div className='space-y-4'>
<h3 className='text-sm font-semibold text-foreground'>Oś czasu</h3>
<div className='relative space-y-6 border-l-2 border-border/60 pl-6'>
{/* Add Note Form */}
<div className='relative'>
<div className='absolute -left-[31px] top-1 flex size-6 items-center justify-center rounded-full bg-background ring-4 ring-background'>
<MessageSquareIcon className='size-3.5 text-muted-foreground' />
</div>
<form onSubmit={submitNote} className='space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm'>
<Textarea
value={noteContent}
onChange={(e) => setNoteContent(e.target.value)}
placeholder='Dodaj notatkę do osi czasu...'
rows={2}
className='resize-none bg-background'
/>
<div className='flex justify-end'>
<Button type='submit' size='sm' disabled={notePending || !noteContent.trim()}>
{notePending ? 'Dodawanie...' : 'Dodaj notatkę'}
</Button>
</div>
</form>
</div>

{/* Add Task Form */}
<div className='relative'>
<div className='absolute -left-[31px] top-1 flex size-6 items-center justify-center rounded-full bg-background ring-4 ring-background'>
<CheckCircle2Icon className='size-3.5 text-muted-foreground' />
</div>
<form onSubmit={submitTask} className='space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm'>
<Input
value={taskContent}
onChange={(e) => setTaskContent(e.target.value)}
placeholder='Dodaj zadanie do wykonania...'
className='bg-background'
/>
<div className='flex justify-end'>
<Button type='submit' size='sm' disabled={taskPending || !taskContent.trim()}>
{taskPending ? 'Dodawanie...' : 'Dodaj zadanie'}
</Button>
</div>
</form>
</div>

{/* Events */}
{timelineEvents.map((event) => (
<div key={event.id} className='relative'>
<div className={cn('absolute -left-[31px] top-1 flex size-6 items-center justify-center rounded-full ring-4 ring-background', {
'bg-blue-100 text-blue-600': event.type === 'note',
'bg-amber-100 text-amber-600': event.type === 'task',
'bg-emerald-100 text-emerald-600': event.type === 'task-completed',
})}>
{event.type === 'note' && <MessageSquareIcon className='size-3.5' />}
{event.type === 'task' && <ClockIcon className='size-3.5' />}
{event.type === 'task-completed' && <CheckCircle2Icon className='size-3.5' />}
</div>
<div className='rounded-xl border border-border/60 bg-card p-4 shadow-sm'>
<div className='mb-1 flex items-center justify-between'>
<span className='text-xs font-medium text-muted-foreground'>
{formatTimestamp(event.date)} {event.author ? '•' : ''}
</span>
{event.type === 'task' || event.type === 'task-completed' ? (
<Checkbox
checked={event.type === 'task-completed'}
onCheckedChange={(val) => handleTaskToggle(event.id, Boolean(val))}
disabled={taskPending}
/>
) : null}
</div>
<p className={cn('text-sm text-foreground', {
'line-through text-muted-foreground': event.type === 'task-completed',
})}>
{event.content}
</p>
</div>
</div>
))}
</div>
</div>
</div>

{/* Right Column: Sidebar (Desktop only, or moved below on mobile) */}
<div className='hidden w-80 shrink-0 space-y-6 lg:block'>
{/* Quick Actions / Status */}
<div className='rounded-2xl border border-border/60 bg-card p-5 shadow-sm'>
<h3 className='mb-4 text-sm font-semibold text-foreground'>Status montażu</h3>
<Select value={montage.status} onValueChange={handleStatusChange} disabled={statusPending}>
<SelectTrigger className={cn('w-full transition-colors', {
'border-emerald-500/50 text-emerald-700 bg-emerald-50/50': montage.status === 'completed',
'border-blue-500/50 text-blue-700 bg-blue-50/50': montage.status === 'in_progress',
})}>
<SelectValue />
</SelectTrigger>
<SelectContent>
{statusOptions.map((opt) => (
<SelectItem key={opt.value} value={opt.value}>
{opt.label}
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>
</div>
);
}
