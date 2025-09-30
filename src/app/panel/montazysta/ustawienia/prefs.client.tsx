"use client";
import { useEffect, useState } from "react";

export default function InstallerPrefs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<{ id: string; summary: string }[]>(
    [],
  );
  const [calendarId, setCalendarId] = useState<string>("");
  const [timeZone, setTimeZone] = useState<string>("Europe/Warsaw");
  const [defaultReminderMinutes, setDefaultReminderMinutes] =
    useState<number>(60);
  const [autoSync, setAutoSync] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/google/calendars");
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || "Błąd pobierania kalendarzy");
        const items: unknown = Array.isArray(j.items) ? j.items : [];
        const list = (items as Array<{ id?: unknown; summary?: unknown }>).map(
          (it) => ({
            id: String(it.id ?? ""),
            summary: String(it.summary ?? it.id ?? ""),
          }),
        );
        setCalendars(list);
        // initialize selection once if empty
        setCalendarId((prev) => prev || (list[0]?.id ?? ""));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Błąd");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const r = await fetch("/api/google/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: calendarId || null,
          timeZone,
          defaultReminderMinutes,
          autoSync,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Błąd zapisu");
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd zapisu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 text-sm">
          <span>Kalendarz docelowy</span>
          <select
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            className="h-9 w-full rounded-md border px-2"
            style={{ borderColor: "var(--pp-border)" }}
          >
            <option value="">(wybierz)</option>
            {calendars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.summary}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Strefa czasu</span>
          <input
            type="text"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="h-9 w-full rounded-md border px-2"
            style={{ borderColor: "var(--pp-border)" }}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Przypomnienie (min)</span>
          <input
            type="number"
            min={0}
            max={1440}
            value={defaultReminderMinutes}
            onChange={(e) =>
              setDefaultReminderMinutes(parseInt(e.target.value || "0", 10))
            }
            className="h-9 w-full rounded-md border px-2"
            style={{ borderColor: "var(--pp-border)" }}
          />
        </label>
        <label className="space-y-1 text-sm inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
          />
          <span>Automatyczna synchronizacja</span>
        </label>
      </div>
      <div>
        <button
          disabled={loading}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm"
          style={{ borderColor: "var(--pp-border)" }}
        >
          {loading ? "Zapisywanie…" : "Zapisz ustawienia"}
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </form>
  );
}
