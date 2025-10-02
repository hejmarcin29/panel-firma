"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { defaultPipelineStages } from "@/lib/project-settings";

type Props = {
  orderId: string;
  type: "delivery" | "installation";
  stage: string | null;
};

export function OrderPipeline({ orderId, type, stage }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(stage ?? "");
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<{ value: string; label: string }[]>(
    defaultPipelineStages[type].map((e) => ({ value: e.key, label: e.label })),
  );
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/ustawienia/projekt", { cache: "no-store" });
        const j = (await r.json()) as {
          pipelineStages?: {
            delivery: { key: string; label: string }[];
            installation: { key: string; label: string }[];
          };
        };
        const arr = (j?.pipelineStages?.[type] ?? []).map((e) => ({ value: e.key, label: e.label }));
        if (!cancelled) setOpts(arr);
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [type]);

  // Keep internal state in sync when external stage prop changes (after refresh)
  useEffect(() => {
    setValue(stage ?? "");
  }, [stage]);

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
    <DropdownMenu
      trigger={
        loading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Zapisywanie…
          </>
        ) : (
          <>
            <span>{currentLabel}</span>
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
          </>
        )
      }
      triggerClassName="h-7 rounded-full bg-black/5 px-2 text-xs dark:bg-white/10 border-black/10 dark:border-white/10"
      align="start"
    >
      {opts.map((o) => (
        <DropdownItem
          key={o.value}
          onSelect={() => {
            if (loading) return;
            setValue(o.value);
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
  );
}
