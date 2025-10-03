"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

export function ScheduleInstallationForm({ orderId }: { orderId: string }) {
  const [plannedAt, setPlannedAt] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const body: Record<string, unknown> = {
            scheduledDate: plannedAt
              ? new Date(plannedAt + "T00:00:00").getTime()
              : null,
            note: note || null,
          };
          await fetch(`/api/zlecenia/${orderId}/montaz`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          setPlannedAt("");
          setDuration("");
          setNote("");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="text-xs opacity-70">Data montażu</label>
          <div className="mt-1">
            <DatePicker value={plannedAt} onChange={setPlannedAt} />
          </div>
        </div>
        <div>
          <label className="text-xs opacity-70">Czas (minuty)</label>
          <Input
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.currentTarget.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs opacity-70">Notatka</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            placeholder="opcjonalnie"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Zapisywanie…" : "Zaplanuj montaż"}
      </Button>
    </form>
  );
}
