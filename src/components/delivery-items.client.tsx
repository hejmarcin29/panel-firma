"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

type Item = {
  id: string;
  name: string;
  sqmCenti: number | null;
  packs: number | null;
  createdAt: number;
};

function fmtSqm(c: number | null) {
  if (c == null) return "";
  const v = (c / 100).toFixed(2);
  return v.replace(/\.00$/, "");
}

export function DeliveryItems({
  orderId,
  slotId,
}: {
  orderId: string;
  slotId: string;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSqm, setNewSqm] = useState("");
  const [newPacks, setNewPacks] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/zlecenia/${orderId}/dostawy/${slotId}/pozycje`,
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Błąd");
      setItems(j.items || []);
    } catch {
      setError("Nie udało się pobrać pozycji");
    } finally {
      setLoading(false);
    }
  }, [orderId, slotId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const totalSqm = useMemo(
    () => (items || []).reduce((acc, it) => acc + (it.sqmCenti ?? 0), 0),
    [items],
  );

  async function addItem() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(
        `/api/zlecenia/${orderId}/dostawy/${slotId}/pozycje`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newName.trim(),
            sqm: newSqm.trim(),
            packs: newPacks.trim(),
          }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Błąd");
      setNewName("");
      setNewSqm("");
      setNewPacks("");
      reload();
    } finally {
      setAdding(false);
    }
  }

  async function patchItem(
    id: string,
    data: { name?: string; sqm?: string; packs?: string },
  ) {
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/zlecenia/${orderId}/dostawy/${slotId}/pozycje/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Błąd");
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/zlecenia/${orderId}/dostawy/${slotId}/pozycje/${id}`,
        { method: "DELETE" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Błąd");
      reload();
    } finally {
      setBusyId(null);
    }
  }

  if (loading)
    return <div className="text-xs opacity-60">Ładowanie pozycji…</div>;
  if (error) return <div className="text-xs text-red-600">{error}</div>;
  if (!items) return null;

  return (
    <div className="space-y-2 min-w-0">
      <div className="text-sm font-medium">Pozycje dostawy</div>
      {items.length === 0 ? (
        <div className="text-xs opacity-60">Brak pozycji</div>
      ) : (
        <div className="rounded border border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
          {items.map((it) => (
            <div
              key={it.id}
              className="p-2 grid items-center gap-2 grid-cols-[minmax(120px,1fr)_60px_52px_64px] md:grid-cols-[minmax(0,1fr)_100px_80px_90px]"
            >
              <input
                className="h-8 w-full min-w-0 rounded border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
                defaultValue={it.name}
                onBlur={(e) => {
                  const v = e.currentTarget.value;
                  if (v !== it.name) patchItem(it.id, { name: v });
                }}
                disabled={busyId === it.id}
              />
              <input
                className="h-8 w-full rounded border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
                defaultValue={fmtSqm(it.sqmCenti)}
                inputMode="decimal"
                onBlur={(e) => {
                  const v = e.currentTarget.value.replace(/[^0-9.,]/g, "");
                  if (v !== fmtSqm(it.sqmCenti)) patchItem(it.id, { sqm: v });
                }}
                disabled={busyId === it.id}
              />
              <input
                className="h-8 w-full rounded border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
                defaultValue={it.packs == null ? "" : String(it.packs)}
                inputMode="numeric"
                onBlur={(e) => {
                  const v = e.currentTarget.value.replace(/\D/g, "");
                  if (v !== (it.packs == null ? "" : String(it.packs)))
                    patchItem(it.id, { packs: v });
                }}
                disabled={busyId === it.id}
              />
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setConfirmDeleteId(it.id)}
                  disabled={busyId === it.id}
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        className="grid items-center gap-2 grid-cols-[minmax(120px,1fr)_60px_52px] md:grid-cols-[minmax(0,1fr)_100px_80px_90px]"
      >
        <input
          className="h-8 w-full min-w-0 rounded border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
          placeholder="Nazwa"
          value={newName}
          onChange={(e) => setNewName(e.currentTarget.value)}
          disabled={adding}
        />
        <input
          className="h-8 w-full rounded border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
          placeholder="m²"
          inputMode="decimal"
          value={newSqm}
          onChange={(e) =>
            setNewSqm(e.currentTarget.value.replace(/[^0-9.,]/g, ""))
          }
          disabled={adding}
        />
        <input
          className="h-8 w-full rounded border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
          placeholder="op."
          inputMode="numeric"
          value={newPacks}
          onChange={(e) =>
            setNewPacks(e.currentTarget.value.replace(/\D/g, ""))
          }
          disabled={adding}
        />
        <div className="flex items-center justify-end col-start-3 mt-1 md:col-start-auto md:mt-0">
          <button
            onClick={addItem}
            disabled={adding || !newName.trim()}
            className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Dodaj
          </button>
        </div>
      </div>
      <div className="text-xs opacity-60">Suma: {fmtSqm(totalSqm)} m²</div>
      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(v) => {
          if (!v) setConfirmDeleteId(null);
        }}
        title="Usunąć pozycję?"
        description={
          confirmDeleteId
            ? (
                <span>
                  Tej operacji nie można cofnąć.
                </span>
              )
            : null
        }
        confirmText="Usuń"
        confirmVariant="destructive"
        onConfirm={async () => {
          const id = confirmDeleteId;
          if (!id) return;
          await deleteItem(id);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
