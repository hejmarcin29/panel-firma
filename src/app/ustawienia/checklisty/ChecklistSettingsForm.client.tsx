"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

type Entry = { id: string; key: string; label: string };

function toEntries(obj: Record<string, string>): Entry[] {
  return Object.entries(obj).map(([key, label]) => ({ id: crypto.randomUUID(), key, label }));
}

function slugify(input: string): string {
  const map: Record<string, string> = {
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ź: "z",
    ż: "z",
  };
  return input
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (m) => map[m] || m)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function toRecord(list: Entry[]): Record<string, string> {
  const out: Record<string, string> = {};
  const used = new Set<string>();
  for (const { key, label } of list) {
    const lab = (label || "").trim();
    if (!lab) continue;
    let k = (key || slugify(lab)).trim();
    if (!k) continue;
    const base = k;
    let i = 2;
    while (used.has(k)) {
      k = `${base}_${i}`;
      i++;
    }
    used.add(k);
    out[k] = lab;
  }
  return out;
}

export function ChecklistSettingsForm(props: {
  initialDelivery: Record<string, string>;
  initialInstallation: Record<string, string>;
}) {
  const [delivery, setDelivery] = useState<Entry[]>(toEntries(props.initialDelivery));
  const [installation, setInstallation] = useState<Entry[]>(
    toEntries(props.initialInstallation),
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  // Track last focused input id to help preserve caret on rerenders
  const [focusedId, setFocusedId] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    try {
      const body = {
        checklistLabels: {
          delivery: toRecord(delivery),
          installation: toRecord(installation),
        },
      };
      const r = await fetch("/api/ustawienia/projekt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        let msg = "Nie udało się zapisać";
        try {
          const j = await r.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      toast({ title: "Zapisano", variant: "success" });
    } catch (e) {
      toast({
        title: "Błąd",
        description: e instanceof Error ? e.message : "Niepowodzenie",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function Row({ item, onChange, onRemove }: { item: Entry; onChange: (v: Entry) => void; onRemove: () => void }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
        <div>
          <Label htmlFor={`label-${item.id}`}>Etykieta</Label>
          <Input
            id={`label-${item.id}`}
            name={`label-${item.id}`}
            type="text"
            value={item.label}
            onFocus={() => setFocusedId(item.id)}
            onChange={(e) => {
              const pos = (e.target as HTMLInputElement).selectionStart ?? null;
              const next = { ...item, label: e.target.value };
              onChange(next);
              // Restore caret position after state update
              requestAnimationFrame(() => {
                if (focusedId !== item.id) return;
                const el = document.getElementById(`label-${item.id}`) as HTMLInputElement | null;
                if (el) {
                  el.focus();
                  if (pos !== null) {
                    try { el.setSelectionRange(pos, pos); } catch {}
                  }
                }
              });
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div>
          <Button type="button" variant="outline" onClick={onRemove}>
            Usuń
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="font-medium">Dostawa</div>
        <div className="space-y-3">
          {delivery.map((it) => (
            <Row
              key={it.id}
              item={it}
              onChange={(v) =>
                setDelivery((prev) => prev.map((p) => (p.id === v.id ? v : p)))
              }
              onRemove={() =>
                setDelivery((prev) => prev.filter((p) => p.id !== it.id))
              }
            />
          ))}
        </div>
        <Button
          type="button"
          onClick={() => setDelivery((prev) => [...prev, { id: crypto.randomUUID(), key: "", label: "" }])}
        >
          + Dodaj pozycję (Dostawa)
        </Button>
      </section>

      <section className="space-y-3">
        <div className="font-medium">Montaż</div>
        <div className="space-y-3">
          {installation.map((it) => (
            <Row
              key={it.id}
              item={it}
              onChange={(v) =>
                setInstallation((prev) => prev.map((p) => (p.id === v.id ? v : p)))
              }
              onRemove={() =>
                setInstallation((prev) => prev.filter((p) => p.id !== it.id))
              }
            />
          ))}
        </div>
        <Button
          type="button"
          onClick={() =>
            setInstallation((prev) => [...prev, { id: crypto.randomUUID(), key: "", label: "" }])
          }
        >
          + Dodaj pozycję (Montaż)
        </Button>
      </section>

      <div className="pt-2">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Zapisywanie…" : "Zapisz"}
        </Button>
      </div>
    </div>
  );
}
