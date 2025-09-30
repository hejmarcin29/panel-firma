"use client";
import { useState } from "react";

type Props = { orderId: string; keyName: string; initial: boolean };

export function ChecklistCell({ orderId, keyName, initial }: Props) {
  const [checked, setChecked] = useState<boolean>(initial);
  const [busy, setBusy] = useState<boolean>(false);

  async function toggle(next: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/zlecenia/${orderId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyName, done: next }),
      });
      if (!res.ok) throw new Error("Błąd");
      setChecked(next);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        disabled={busy}
        onChange={(e) => toggle(e.target.checked)}
      />
    </div>
  );
}
