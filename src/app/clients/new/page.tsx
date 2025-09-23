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
});

export default function NewClientPage() {
  const router = useRouter();
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
        <BackButton fallbackHref="/clients" />
        <h1 className="text-2xl font-semibold">Nowy klient</h1>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(async (data) => {
        // Autofill: jeśli sameAsInvoice, przepisz dane faktury
        const payload = {
          name: data.name,
          phone: data.phone || '',
          email: data.email || '',
          invoiceCity: data.invoiceCity || '',
          invoiceAddress: data.invoiceAddress || '',
          deliveryCity: (data.sameAsInvoice ? data.invoiceCity : data.deliveryCity) || '',
          deliveryAddress: (data.sameAsInvoice ? data.invoiceAddress : data.deliveryAddress) || '',
        };
        const r = await fetch('/api/clients', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Błąd zapisu');
        const { id } = await r.json();
        const note = (data.note || '').trim();
        if (note) {
          await fetch(`/api/clients/${id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: note }) });
        }
        router.push(`/clients/${id}`);
      })}>
        <div>
          <Label>Imię i nazwisko</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Telefon</Label>
            <Input {...register('phone')} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Miasto (faktura)</Label>
            <Input {...register('invoiceCity')} onChange={(e) => { setValue('invoiceCity', e.target.value); if (sameAsInvoice) setValue('deliveryCity', e.target.value); }} />
          </div>
          <div>
            <Label>Adres (faktura)</Label>
            <Input {...register('invoiceAddress')} onChange={(e) => { setValue('invoiceAddress', e.target.value); if (sameAsInvoice) setValue('deliveryAddress', e.target.value); }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="same" type="checkbox" {...register('sameAsInvoice')} onChange={(e) => { setValue('sameAsInvoice', e.target.checked); if (e.target.checked) { setValue('deliveryCity', invoiceCity); setValue('deliveryAddress', invoiceAddress); } }} />
          <label htmlFor="same" className="text-sm">Adres dostawy taki jak do faktury</label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Miasto (dostawa)</Label>
            <Input {...register('deliveryCity')} />
          </div>
          <div>
            <Label>Adres (dostawa)</Label>
            <Input {...register('deliveryAddress')} />
          </div>
        </div>

        <div>
          <Label>Notatki (Primepodloga)</Label>
          <Textarea rows={4} placeholder="(opcjonalnie)" {...register('note')} />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>Zapisz</Button>
        </div>
      </form>
    </div>
  );
}
