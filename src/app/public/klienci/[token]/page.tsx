"use client";
import React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toaster";

type Meta = { allowedFields: string[] };

export default function PublicClientFormPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const router = useRouter();

  const [meta, setMeta] = React.useState<Meta | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/public/klienci/${encodeURIComponent(token)}`);
        if (!r.ok) throw new Error("not ok");
        const j = (await r.json()) as Meta;
        if (mounted) setMeta(j);
      } catch {
        if (mounted) setError("Link wygasł lub jest nieprawidłowy.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!meta) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const k of meta.allowedFields) {
      const v = (fd.get(k) as string | null) ?? null;
      if (v != null && v !== "") payload[k] = v;
    }
    if (!payload.name || typeof payload.name !== "string") {
      toast({ variant: "destructive", title: "Uzupełnij imię i nazwisko" });
      setSubmitting(false);
      return;
    }
    try {
      const r = await fetch(`/api/public/klienci/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("submit failed");
      const j = (await r.json()) as { portalUrl?: string | null };
      toast({ variant: "success", title: "Dziękujemy!", description: "Dane zostały przekazane." });
      if (j?.portalUrl) {
        router.push(j.portalUrl);
      } else {
        router.push("/public/dziekujemy");
      }
    } catch {
      toast({ variant: "destructive", title: "Nie udało się wysłać" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-none p-0 md:max-w-2xl md:p-6">Ładowanie…</div>;
  if (error) return <div className="mx-auto max-w-none p-0 md:max-w-2xl md:p-6">{error}</div>;
  if (!meta) return null;

  const show = (k: string) => meta.allowedFields.includes(k);

  return (
    <div className="mx-auto max-w-none p-0 md:max-w-2xl md:p-6">
      {/* Brand header */}
      <div className="px-4 md:px-0 pt-4 md:pt-0">
        <div className="flex items-center justify-center">
          <Image src="/logo.svg" alt="Logo" width={128} height={64} className="h-12 md:h-16 w-auto" />
        </div>
      </div>
      <section className="rounded-2xl border p-4 md:p-6" style={{ borderColor: "var(--pp-border)" }}>
        <h1 className="text-xl md:text-2xl font-semibold">Dane kontaktowe</h1>
        <p className="mt-1 text-sm opacity-80">Uzupełnij proszę podstawowe informacje. Tylko wymagane pola.</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          {show("name") && (
            <div>
              <label className="block text-sm mb-1">Imię i nazwisko *</label>
              <input name="name" required className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("phone") && (
            <div>
              <label className="block text-sm mb-1">Telefon</label>
              <input name="phone" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("email") && (
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input type="email" name="email" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("companyName") && (
            <div>
              <label className="block text-sm mb-1">Nazwa firmy</label>
              <input name="companyName" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("taxId") && (
            <div>
              <label className="block text-sm mb-1">NIP</label>
              <input name="taxId" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("invoicePostalCode") && (
            <div>
              <label className="block text-sm mb-1">Kod pocztowy</label>
              <input name="invoicePostalCode" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("invoiceCity") && (
            <div>
              <label className="block text-sm mb-1">Miasto (faktura)</label>
              <input name="invoiceCity" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("invoiceAddress") && (
            <div>
              <label className="block text-sm mb-1">Adres (faktura)</label>
              <input name="invoiceAddress" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}
          {show("source") && (
            <div>
              <label className="block text-sm mb-1">Skąd o nas wiesz?</label>
              <input name="source" placeholder="Polecenie / WWW / Google / FB…" className="w-full h-10 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
            </div>
          )}

          <div className="pt-2">
            <button disabled={submitting} type="submit" className="inline-flex h-10 items-center rounded-md border px-4 text-sm disabled:opacity-50 hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: "var(--pp-border)" }}>
              Wyślij
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
