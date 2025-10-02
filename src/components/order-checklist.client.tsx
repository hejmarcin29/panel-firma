"use client";
import { useEffect, useMemo, useState } from "react";
import { defaultChecklistLabels } from "@/lib/project-settings";

type Props = {
  orderId: string;
  type: "delivery" | "installation";
  items: { key: string; done: boolean }[];
};
async function fetchLabels() {
  try {
    const r = await fetch("/api/ustawienia/projekt", { cache: "no-store" });
    if (r.ok) return (await r.json()) as {
      checklistLabels?: Record<"delivery" | "installation", Record<string, string>>;
    };
  } catch {}
  return null;
}

export function OrderChecklist({ orderId, type, items }: Props) {
  const map = new Map(items.map((i) => [i.key, i.done]));
  const [busy, setBusy] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>(
    defaultChecklistLabels[type],
  );
  const keys = useMemo(() => Object.keys(labels), [labels]);
  useEffect(() => {
    (async () => {
      const j = await fetchLabels();
      const next = j?.checklistLabels?.[type];
      if (next) setLabels(next);
    })();
  }, [type]);

  async function toggle(key: string, done: boolean) {
    setBusy(key);
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, done }),
      });
      if (!res.ok) throw new Error("Błąd");
      location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const checked = map.get(key) || false;
        return (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={checked}
              disabled={busy === key}
              onChange={(e) => toggle(key, e.target.checked)}
            />
            <span>{labels[key] || key}</span>
          </label>
        );
      })}
    </div>
  );
}
