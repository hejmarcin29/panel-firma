"use client";
import React from "react";
import { useToast } from "@/components/ui/toaster";

export function GenerateOrderPreviewLinkButton(props: { orderId: string }) {
  const { orderId } = props;
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)] disabled:opacity-60"
      style={{ borderColor: "var(--pp-border)" }}
      onClick={async () => {
        setPending(true);
        try {
          const r = await fetch(`/api/public/zlecenia/preview/${encodeURIComponent(orderId)}`, { method: "POST" });
          if (r.status === 403) {
            toast({ variant: "destructive", title: "Brak uprawnień (admin)" });
            return;
          }
          if (!r.ok) throw new Error("not ok");
          const j = (await r.json()) as { url: string };
          await navigator.clipboard.writeText(j.url);
          toast({ variant: "success", title: "Skopiowano link podglądu" });
        } catch {
          toast({ variant: "destructive", title: "Nie udało się utworzyć linku" });
        } finally {
          setPending(false);
        }
      }}
    >
      Link podglądu (kopiuj)
    </button>
  );
}
