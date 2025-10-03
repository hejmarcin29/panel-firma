"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toaster";
import { defaultPipelineStages } from "@/lib/project-settings";

type Props = {
  type: "delivery" | "installation";
  stage: string | null;
  orderId?: string; // jeśli podane – lista staje się edytowalna
};

export function OrderPipelineList({ type, stage, orderId }: Props) {
  const [stages, setStages] = React.useState<{ key: string; label: string }[]>(
    [...defaultPipelineStages[type]],
  );
  const [value, setValue] = React.useState(stage ?? "");
  const [saving, setSaving] = React.useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
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
        const arr = (j?.pipelineStages?.[type] ?? []).map((e) => ({ key: e.key, label: e.label }));
        if (!cancelled && arr.length > 0) setStages(arr);
      } catch {
        // fall back to defaults
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [type]);

  React.useEffect(() => {
    setValue(stage ?? "");
  }, [stage]);

  async function saveStage(newStage: string) {
    if (!orderId || newStage === value) return;
    setSaving(newStage);
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error("Błąd");
      setValue(newStage);
      toast({ title: "Zapisano etap", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Nie udało się zapisać etapu", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="rounded-md border border-black/10 p-2 dark:border-white/10">
      <div className="mb-1 text-xs opacity-70">Etapy</div>
      <ol className="space-y-1 text-sm">
        {stages.map((s) => {
          const isCurrent = s.key === value;
          const canEdit = !!orderId;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className={
                  "h-2.5 w-2.5 rounded-full " +
                  (isCurrent ? "bg-black dark:bg-white" : "bg-black/30 dark:bg-white/30")
                }
              />
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => (saving ? null : saveStage(s.key))}
                  className={
                    "text-left hover:underline focus:underline focus:outline-none " +
                    (isCurrent ? "font-medium" : "opacity-90")
                  }
                  disabled={!!saving}
                >
                  {s.label}
                </button>
              ) : (
                <span className={isCurrent ? "font-medium" : "opacity-80"}>{s.label}</span>
              )}
              {isCurrent ? (
                <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">
                  <span className="inline md:hidden">AKT.</span>
                  <span className="hidden md:inline">aktualny</span>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
