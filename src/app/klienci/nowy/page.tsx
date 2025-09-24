"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/back-button";
import { useToast } from "@/components/ui/toaster";
import { pl } from "@/i18n/pl";

const schema = z.object({
  name: z.string().min(1, 'Imię i nazwisko jest wymagane'),
  phone: z.string().optional(),
  email: z.string().email('Podaj poprawny email').optional().or(z.literal('')),
  invoiceCity: z.string().optional(),
  invoiceAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryAddress: z.string().optional(),
  sameAsInvoice: z.boolean().default(false),
  note: z.string().optional(),
  // Usunięto wybór serviceType z formularza – decyzja: domyślnie 'with_installation' pozostaje w backendzie (lub zostanie zrefaktoryzowane później)
});

export default function NowyKlientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', phone: '', email: '', invoiceCity: '', invoiceAddress: '', deliveryCity: '', deliveryAddress: '', sameAsInvoice: false, note: ''
    }
  });
  const sameAsInvoice = watch('sameAsInvoice');
  const invoiceCity = watch('invoiceCity');
  const invoiceAddress = watch('invoiceAddress');

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <BackButton fallbackHref="/klienci" />
        <h1 className="text-2xl font-semibold">{pl.clients.new}</h1>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(async (data) => {
        try {
          const payload = {
            name: data.name,
            phone: data.phone || '',
            email: data.email || '',
            invoiceCity: data.invoiceCity || '',
            invoiceAddress: data.invoiceAddress || '',
            deliveryCity: (data.sameAsInvoice ? data.invoiceCity : data.deliveryCity) || '',
            deliveryAddress: (data.sameAsInvoice ? data.invoiceAddress : data.deliveryAddress) || '',
            // serviceType pomijamy – backend nada domyślność / zostanie uproszczone
          };
          const r = await fetch('/api/klienci', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Błąd zapisu');
          const { id } = await r.json();
          const note = (data.note || '').trim();
          if (note) {
            const rn = await fetch(`/api/klienci/${id}/notatki`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: note }) });
            if (!rn.ok) {
              toast({ title: pl.clients.notePartialFail, variant: 'destructive' });
            }
          }
          toast({ title: pl.clients.createSuccess, variant: 'success' });
          router.push(`/klienci/${id}`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Nie udało się zapisać';
          toast({ title: pl.common.error, description: msg, variant: 'destructive' });
        }
      })}>
        <div>
          <Label>{pl.clients.name}</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{pl.clients.phone}</Label>
            <Input {...register('phone')} />
          </div>
          <div>
            <Label>{pl.clients.email}</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{pl.clients.invoiceCity}</Label>
            <Input {...register('invoiceCity')} onChange={(e) => { setValue('invoiceCity', e.target.value); if (sameAsInvoice) setValue('deliveryCity', e.target.value); }} />
          </div>
          <div>
            <Label>{pl.clients.invoiceAddress}</Label>
            <Input {...register('invoiceAddress')} onChange={(e) => { setValue('invoiceAddress', e.target.value); if (sameAsInvoice) setValue('deliveryAddress', e.target.value); }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="same" type="checkbox" {...register('sameAsInvoice')} onChange={(e) => { setValue('sameAsInvoice', e.target.checked); if (e.target.checked) { setValue('deliveryCity', invoiceCity); setValue('deliveryAddress', invoiceAddress); } }} />
          <label htmlFor="same" className="text-sm">{pl.clients.sameAsInvoice}</label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{pl.clients.deliveryCity}</Label>
            <Input {...register('deliveryCity')} />
          </div>
          <div>
            <Label>{pl.clients.deliveryAddress}</Label>
            <Input {...register('deliveryAddress')} />
          </div>
        </div>

        {/* Pole wyboru typu usługi usunięte – placeholder do ewentualnego powrotu */}

        <div>
          <Label>{pl.clients.notesTitle}</Label>
          <Textarea rows={4} placeholder="(opcjonalnie)" {...register('note')} />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>{pl.common.save}</Button>
        </div>
      </form>
    </div>
  );
}
