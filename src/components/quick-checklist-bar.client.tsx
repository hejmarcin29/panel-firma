"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toaster";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

type Item = { key: string; label: string; done: boolean };

type Props = {
  orderId: string;
  type: "delivery" | "installation";
  items: Item[];
};

const labels: Record<"delivery" | "installation", Record<string, string>> = {
  delivery: {
    proforma: "Proforma",
    advance_invoice: "FV zaliczkowa",
    final_invoice: "FV końcowa",
    post_delivery_invoice: "FV po dostawie",
    quote: "Wycena",
    done: "Koniec",
  },
  installation: {
    measurement: "Pomiar",
    quote: "Wycena",
    contract: "Umowa",
    advance_payment: "Zaliczka",
    installation: "Montaż",
    handover_protocol: "Protokół",
    final_invoice: "FV końcowa",
    done: "Koniec",
  },
};

const orderForType: Record<"delivery" | "installation", string[]> = {
  delivery: [
    "proforma",
    "advance_invoice",
    "final_invoice",
    "post_delivery_invoice",
    "quote",
    "done",
  ],
  installation: [
    "measurement",
    "quote",
    "contract",
    "advance_payment",
    "installation",
    "handover_protocol",
    "final_invoice",
    "done",
  ],
};

export function QuickChecklistBar({ orderId, type, items }: Props) {
  const map = useMemo(
    () => new Map(items.map((i) => [i.key, i.done])),
    [items],
  );
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Sync local shadow state with props
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const k of orderForType[type]) next[k] = map.get(k) || false;
    setLocal(next);
  }, [items, type, map]);

  // Radix Popover sam obsługuje pozycjonowanie, zamykanie po kliknięciu w tło i ESC.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="relative inline-flex items-center gap-1 cursor-pointer select-none"
          aria-label="Postęp checklisty"
        >
          {orderForType[type].map((k) => {
            const checked = (k in local ? local[k] : map.get(k)) || false;
            return (
              <span
                key={k}
                title={labels[type][k]}
                aria-label={labels[type][k]}
                className={[
                  "inline-flex h-5 w-5 items-center justify-center rounded-sm border text-[10px] select-none",
                  checked
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-black/20 dark:border-white/20 text-black/60 dark:text-white/70",
                ].join(" ")}
              >
                {checked ? "✓" : ""}
              </span>
            );
          })}
        </div>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className="w-72 p-2">
              <div className="max-h-80 overflow-auto pr-1">
                {orderForType[type].map((k) => {
                  const checked = (k in local ? local[k] : map.get(k)) || false;
                  return (
                    <label
                      key={k}
                      className="flex items-center justify-between gap-2 px-1 py-1 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          disabled={busyKey === k}
                          onChange={async (e) => {
                            const next = e.currentTarget.checked;
                            setBusyKey(k);
                            setLocal((prev) => ({ ...prev, [k]: next }));
                            try {
                              const r = await fetch(
                                `/api/zlecenia/${orderId}/checklist`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ key: k, done: next }),
                                },
                              );
                              if (!r.ok) {
                                setLocal((prev) => ({ ...prev, [k]: !next }));
                                const j = await r.json().catch(() => null);
                                throw new Error(
                                  j?.error || "Nie udało się zapisać",
                                );
                              }
                            } catch (err) {
                              toast({
                                title: "Błąd",
                                description:
                                  err instanceof Error
                                    ? err.message
                                    : "Operacja nie powiodła się",
                                variant: "destructive",
                              });
                            } finally {
                              setBusyKey(null);
                              // Odśwież widok subtelnie (opcjonalnie)
                              try {
                                router.refresh();
                              } catch {}
                            }
                          }}
                        />
                        <span>{labels[type][k]}</span>
                      </div>
                      <span
                        className={
                          checked
                            ? "text-emerald-600"
                            : "text-black/50 dark:text-white/50"
                        }
                      >
                        {checked ? "Zrobione" : "Nie"}
                      </span>
                    </label>
                  );
                })}
              </div>
      </PopoverContent>
    </Popover>
  );
}

export function ChecklistPopoverButton({ orderId, type, items }: Props) {
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const map = useMemo(
    () => new Map(items.map((i) => [i.key, i.done])),
    [items],
  );

  async function toggle(key: string, done: boolean) {
    setBusyKey(key);
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, done }),
      });
      if (!res.ok) throw new Error("Błąd");
      // optymistycznie aktualizujemy lokalną mapę
      map.set(key, done);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        Checklist
        <QuickChecklistBar
          orderId={orderId}
          type={type}
          items={orderForType[type].map((k) => ({
            key: k,
            label: k,
            done: map.get(k) || false,
          }))}
        />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Checklist"
          className="absolute right-0 z-40 mt-2 w-72 rounded-md border bg-[var(--pp-panel)] p-2 shadow-lg"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div className="max-h-80 overflow-auto pr-1">
            {orderForType[type].map((k) => {
              const checked = map.get(k) || false;
              return (
                <label
                  key={k}
                  className="flex items-center gap-2 px-1 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    disabled={busyKey === k}
                    onChange={(e) => toggle(k, e.target.checked)}
                  />
                  <span>{labels[type][k]}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Zamknij
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
