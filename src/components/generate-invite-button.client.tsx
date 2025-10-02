"use client";
import React from "react";
import { useToast } from "@/components/ui/toaster";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";

export function GenerateInviteButton() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [days, setDays] = React.useState<30 | 90>(90);

  const create = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/public/klienci/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInHours: days * 24 }),
      });
      if (!r.ok) {
        if (r.status === 403) {
          toast({ variant: "destructive", title: "Brak uprawnień (admin)" });
          return;
        }
        let msg: string | null = null;
        try {
          const j = (await r.json()) as { error?: string };
          msg = typeof j?.error === "string" ? j.error : null;
        } catch {}
        throw new Error(msg ?? `HTTP ${r.status}`);
      }
  const j = (await r.json()) as { url: string };
  await navigator.clipboard.writeText(j.url);
      toast({ variant: "success", title: "Skopiowano link" });
    } catch {
      toast({ variant: "destructive", title: "Nie udało się utworzyć linku" });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  // Hide if not admin
  const role = session?.user && typeof session.user === "object" ? (session.user as { role?: string | null }).role : null;
  if (role !== "admin") return null;

  return (
    <div className="inline-flex items-center gap-2">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm disabled:opacity-50 hover:bg-[var(--pp-primary-subtle-bg)]"
            style={{ borderColor: "var(--pp-border)" }}
            disabled={busy}
            data-no-row-nav
          >
            Generuj link: nowy klient
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-[var(--pp-surface)] p-4 shadow-lg" style={{ borderColor: "var(--pp-border)" }}>
            <Dialog.Title className="text-base font-semibold">Czas ważności linku</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm opacity-80">Wybierz, na ile dni ma być ważny link do formularza.</Dialog.Description>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className={`inline-flex h-9 items-center rounded-md border px-3 text-sm ${days === 30 ? "bg-[var(--pp-primary-subtle-bg)]" : "hover:bg-[var(--pp-primary-subtle-bg)]"}`}
                style={{ borderColor: "var(--pp-border)" }}
                onClick={() => setDays(30)}
              >
                30 dni
              </button>
              <button
                type="button"
                className={`inline-flex h-9 items-center rounded-md border px-3 text-sm ${days === 90 ? "bg-[var(--pp-primary-subtle-bg)]" : "hover:bg-[var(--pp-primary-subtle-bg)]"}`}
                style={{ borderColor: "var(--pp-border)" }}
                onClick={() => setDays(90)}
              >
                90 dni
              </button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: "var(--pp-border)" }}>
                  Anuluj
                </button>
              </Dialog.Close>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
                style={{ borderColor: "var(--pp-border)" }}
                onClick={create}
                disabled={busy}
              >
                Utwórz i skopiuj
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {/* Intencjonalnie ukrywamy wizualny link. Link jest kopiowany do schowka. */}
    </div>
  );
}
