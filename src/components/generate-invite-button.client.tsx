"use client";
import React from "react";
import { useToast } from "@/components/ui/toaster";

export function GenerateInviteButton() {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [url, setUrl] = React.useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/public/klienci/invite", { method: "POST" });
      if (!r.ok) throw new Error("not ok");
      const j = (await r.json()) as { url: string };
      setUrl(j.url);
      await navigator.clipboard.writeText(j.url);
      toast({ variant: "success", title: "Skopiowano link" });
    } catch {
      toast({ variant: "destructive", title: "Nie udało się utworzyć linku" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-md border px-3 text-sm disabled:opacity-50 hover:bg-[var(--pp-primary-subtle-bg)]"
        style={{ borderColor: "var(--pp-border)" }}
        onClick={create}
        disabled={busy}
        data-no-row-nav
      >
        Generuj link: nowy klient
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline opacity-80"
          data-no-row-nav
        >
          Otwórz
        </a>
      )}
    </div>
  );
}
