"use client";
import React from "react";
import { useToast } from "@/components/ui/toaster";
import * as Dialog from "@radix-ui/react-dialog";

export function ClientPortalLinkActions(props: { clientId: string }) {
  const { clientId } = props;
  const { toast } = useToast();
  const [pending, setPending] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState<null | "create" | "rotate">(null);
  const [days, setDays] = React.useState<30 | 90>(90);

  const handleCopy = async () => {
    setPending("copy");
    try {
      const r = await fetch(`/api/public/klient/portal/${encodeURIComponent(clientId)}?days=${days}`, { method: "POST" });
      if (r.status === 403) {
        toast({ variant: "destructive", title: "Brak uprawnień (admin)" });
        return;
      }
      if (!r.ok) throw new Error("not ok");
      const j = (await r.json()) as { url: string };
      await navigator.clipboard.writeText(j.url);
      toast({ variant: "success", title: "Skopiowano link portalu" });
    } catch {
      toast({ variant: "destructive", title: "Nie udało się utworzyć linku" });
    } finally {
      setPending(null);
    }
  };

  const handleRotate = async () => {
    setPending("rotate");
    try {
      const r = await fetch(`/api/public/klient/portal/${encodeURIComponent(clientId)}?rotate=1&days=${days}`, { method: "POST" });
      if (r.status === 403) {
        toast({ variant: "destructive", title: "Brak uprawnień (admin)" });
        return;
      }
      if (!r.ok) throw new Error("not ok");
      const j = (await r.json()) as { url: string };
      await navigator.clipboard.writeText(j.url);
      toast({ variant: "success", title: "Zrotowano i skopiowano nowy link" });
    } catch {
      toast({ variant: "destructive", title: "Nie udało się zrotować linku" });
    } finally {
      setPending(null);
    }
  };

  const handleRevoke = async () => {
    setPending("revoke");
    try {
      const r = await fetch(`/api/public/klient/portal/${encodeURIComponent(clientId)}`, { method: "DELETE" });
      if (r.status === 403) {
        toast({ variant: "destructive", title: "Brak uprawnień (admin)" });
        return;
      }
      if (!r.ok) throw new Error("not ok");
      toast({ variant: "success", title: "Link portalu unieważniony" });
    } catch {
      toast({ variant: "destructive", title: "Nie udało się unieważnić linku" });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog.Root open={open !== null} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            disabled={pending !== null}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)] disabled:opacity-60"
            style={{ borderColor: "var(--pp-border)" }}
            onClick={() => setOpen("create")}
          >
            Link portalu (kopiuj)
          </button>
        </Dialog.Trigger>
        {open && (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/30" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-[var(--pp-surface)] p-4 shadow-lg" style={{ borderColor: "var(--pp-border)" }}>
              <Dialog.Title className="text-base font-semibold">Czas ważności linku</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm opacity-80">Wybierz TTL portalu klienta.</Dialog.Description>
              <div className="mt-3 flex gap-2">
                <button type="button" className={`inline-flex h-9 items-center rounded-md border px-3 text-sm ${days === 30 ? "bg-[var(--pp-primary-subtle-bg)]" : "hover:bg-[var(--pp-primary-subtle-bg)]"}`} style={{ borderColor: "var(--pp-border)" }} onClick={() => setDays(30)}>30 dni</button>
                <button type="button" className={`inline-flex h-9 items-center rounded-md border px-3 text-sm ${days === 90 ? "bg-[var(--pp-primary-subtle-bg)]" : "hover:bg-[var(--pp-primary-subtle-bg)]"}`} style={{ borderColor: "var(--pp-border)" }} onClick={() => setDays(90)}>90 dni</button>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button type="button" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: "var(--pp-border)" }}>Anuluj</button>
                </Dialog.Close>
                <button type="button" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: "var(--pp-border)" }} onClick={async () => { await handleCopy(); setOpen(null); }}>Utwórz i skopiuj</button>
                <button type="button" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: "var(--pp-border)" }} onClick={async () => { await handleRotate(); setOpen(null); }}>Rotuj i skopiuj</button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
      <button
        type="button"
        disabled={pending !== null}
        className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)] disabled:opacity-60"
        style={{ borderColor: "var(--pp-border)" }}
        onClick={handleRevoke}
      >
        Unieważnij
      </button>
    </div>
  );
}
