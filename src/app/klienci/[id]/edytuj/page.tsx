"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { pl } from "@/i18n/pl";

const schema = z.object({
  name: z.string().min(1, 'Imię i nazwisko jest wymagane'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Podaj poprawny email').optional().or(z.literal('')),
  invoiceCity: z.string().optional().or(z.literal('')),
  invoicePostalCode: z.string().optional().or(z.literal('')),
  invoiceAddress: z.string().optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
  isCompany: z.boolean().default(false).optional(),
  companyName: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function EdytujKlientaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  defaultValues: { name: '', phone: '', email: '', invoiceCity: '', invoicePostalCode: '', invoiceAddress: '', taxId: '', companyName: '', isCompany: false }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/klienci/${id}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Błąd');
        reset({
          name: j.client.name || '',
          phone: j.client.phone || '',
          email: j.client.email || '',
          invoiceCity: j.client.invoiceCity || '',
          invoicePostalCode: j.client.invoicePostalCode || '',
          invoiceAddress: j.client.invoiceAddress || '',
          taxId: j.client.taxId || '',
          companyName: j.client.companyName || '',
          isCompany: Boolean(j.client.taxId || j.client.companyName),
        });
      } catch {
        setError('Błąd ładowania');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, reset]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <BackButton fallbackHref={`/klienci/${id}`} />
  <h1 className="text-2xl font-semibold">{pl.clients.edit} klienta</h1>
      </div>
      {loading ? (
        <p>Wczytywanie…</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(async (data) => {
          try {
            const payload: Record<string, unknown> = {
              name: data.name,
              phone: data.phone || '',
              email: data.email || '',
              invoiceCity: data.invoiceCity || '',
              invoicePostalCode: data.invoicePostalCode || '',
              invoiceAddress: data.invoiceAddress || '',
            }
            if (data.isCompany) {
              payload.taxId = data.taxId || '';
              payload.companyName = data.companyName || '';
            } else {
              // jeżeli odznaczono 'Na firmę', wyczyść dane firmy
              payload.taxId = '';
              payload.companyName = '';
            }
            const r = await fetch(`/api/klienci/${id}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Błąd zapisu');
            toast({ title: pl.clients.updateSuccess, variant: 'success' });
            router.push(`/klienci/${id}`);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Nie udało się zapisać';
            toast({ title: pl.common.error, description: msg, variant: 'destructive' });
          }
        })}>
          <div>
            <Label>{pl.clients.name}</Label>
            <Input {...register('name')} aria-invalid={!!errors.name} />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>{pl.clients.invoiceCity}</Label>
              <Input {...register('invoiceCity')} />
            </div>
            <div>
              <Label>{pl.clients.invoicePostalCode ?? 'Kod pocztowy (faktura)'}</Label>
              <Input {...register('invoicePostalCode')} />
            </div>
            <div>
              <Label>{pl.clients.invoiceAddress}</Label>
              <Input {...register('invoiceAddress')} />
            </div>
          </div>
          {/* Firma */}
          <div className="flex items-center gap-2">
            <input id="isCompany" type="checkbox" className="h-4 w-4" {...register('isCompany')} />
            <Label htmlFor="isCompany">Na firmę</Label>
          </div>
          {watch('isCompany') ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nazwa firmy</Label>
                <Input {...register('companyName')} />
              </div>
              <div>
                <Label>NIP</Label>
                <Input {...register('taxId')} />
              </div>
            </div>
          ) : null}
          {/* Pole Typ usługi usunięte */}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>{pl.common.save}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
