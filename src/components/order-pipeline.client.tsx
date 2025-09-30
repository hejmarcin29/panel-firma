"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/toaster";

type Props = {
  orderId: string;
  type: "delivery" | "installation";
  stage: string | null;
};

const stages = {
  delivery: [
    { value: "offer_sent", label: "Wysłana oferta" },
    { value: "awaiting_payment", label: "Czeka na wpłatę" },
    { value: "delivery", label: "Dostawa" },
    { value: "final_invoice_issued", label: "Wystawiona faktura końcowa" },
    { value: "done", label: "Koniec" },
  ],
  installation: [
    { value: "awaiting_measurement", label: "Czeka na pomiar" },
    { value: "awaiting_quote", label: "Czeka na wycenę" },
    { value: "before_contract", label: "Przed umową" },
    { value: "before_advance", label: "Przed zaliczką" },
    { value: "before_installation", label: "Przed montażem" },
    { value: "before_final_invoice", label: "Przed fakturą końcową" },
    { value: "done", label: "Koniec" },
  ],
} as const;

export function OrderPipeline({ orderId, type, stage }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(stage ?? "");
  const [loading, setLoading] = useState(false);
  const opts = stages[type];
  const { toast } = useToast();

  const currentLabel = useMemo(
    () => opts.find((o) => o.value === value)?.label ?? "— wybierz —",
    [opts, value],
  );

  async function save(newStage: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Błąd");
      toast({ title: "Zapisano etap", variant: "success" });
      router.refresh();
    } catch (e) {
      // TODO toaster
      console.error(e);
      toast({ title: "Nie udało się zapisać etapu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs opacity-70">Etap (biznesowy)</label>
      <DropdownMenu
        trigger={
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm dark:border-white/15 bg-white dark:bg-neutral-900">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisywanie…
                </>
              ) : (
                <>
                  <span>{currentLabel}</span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
                </>
              )}
            </span>
          </span>
        }
        align="start"
      >
        {opts.map((o) => (
          <DropdownItem
            key={o.value}
            onSelect={() => {
              if (loading) return;
              setValue(o.value);
              // autosave on selection
              void save(o.value);
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${value === o.value ? "bg-black dark:bg-white" : "bg-black/30 dark:bg-white/30"}`}
              />
              <span>{o.label}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </div>
  );
}
