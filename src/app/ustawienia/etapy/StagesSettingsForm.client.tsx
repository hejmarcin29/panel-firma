"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

type Entry = { id: string; key: string; label: string };

export function StagesSettingsForm(props: {
  initialDelivery: { key: string; label: string }[];
  initialInstallation: { key: string; label: string }[];
}) {
  const [delivery, setDelivery] = useState<Entry[]>(
    props.initialDelivery.map((e) => ({ id: crypto.randomUUID(), ...e })),
  );
  const [installation, setInstallation] = useState<Entry[]>(
    props.initialInstallation.map((e) => ({ id: crypto.randomUUID(), ...e })),
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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

  function materialize(list: Entry[]): Entry[] {
    const out: Entry[] = [];
    const used = new Set<string>();
    for (const item of list) {
      const label = item.label.trim();
      if (!label) continue; // pomiń puste
      let key = (item.key || slugify(label)).trim();
      if (!key) continue;
  const base = key;
      let i = 2;
      while (used.has(key)) {
        key = `${base}_${i}`;
        i++;
      }
      used.add(key);
      out.push({ id: item.id, key, label });
    }
    return out;
  }

  async function save() {
    setSaving(true);
    try {
      // Zachowaj istniejące klucze; nowe generuj ze slugify(label); zapewnij unikalność per sekcja
      const cleanDelivery = materialize(delivery);
      const cleanInstallation = materialize(installation);
      const body = {
        pipelineStages: {
          delivery: cleanDelivery,
          installation: cleanInstallation,
        },
      };
      const r = await fetch("/api/ustawienia/projekt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Nie udało się zapisać");
      toast({ title: "Zapisano", variant: "success" });
    } catch (e) {
      toast({
        title: "Błąd",
        description:
          e instanceof Error ? e.message : "Nie udało się zapisać ustawień",
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
          <Label htmlFor={`stage-${item.id}`}>Etykieta</Label>
          <Input
            id={`stage-${item.id}`}
            name={`stage-${item.id}`}
            type="text"
            value={item.label}
            onChange={(e) => onChange({ ...item, label: e.target.value })}
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
          {delivery.map((it, idx) => (
            <Row
              key={it.id}
              item={it}
              onChange={(v) =>
                setDelivery((prev) => prev.map((p, i) => (i === idx ? v : p)))
              }
              onRemove={() =>
                setDelivery((prev) => prev.filter((_, i) => i !== idx))
              }
            />
          ))}
        </div>
        <Button
          type="button"
          onClick={() =>
            setDelivery((prev) => [...prev, { id: crypto.randomUUID(), key: "", label: "" }])
          }
        >
          + Dodaj etap (Dostawa)
        </Button>
      </section>

      <section className="space-y-3">
        <div className="font-medium">Montaż</div>
        <div className="space-y-3">
          {installation.map((it, idx) => (
            <Row
              key={it.id}
              item={it}
              onChange={(v) =>
                setInstallation((prev) =>
                  prev.map((p, i) => (i === idx ? v : p)),
                )
              }
              onRemove={() =>
                setInstallation((prev) => prev.filter((_, i) => i !== idx))
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
          + Dodaj etap (Montaż)
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
