"use client";
import { useEffect, useState, useCallback } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Task = {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
};
type Note = { id: string; content: string };

export function OrderPrivateActions({ orderId }: { orderId: string }) {
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/montazysta/prywatne?orderId=${orderId}`);
      const j = await r.json().catch(() => ({}));
      const Schema = z.object({
        prefs: z.object({ pinnedOrderId: z.string().uuid().nullable() }),
        tasks: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            done: z.boolean(),
          }),
        ),
        notes: z.array(z.object({ id: z.string(), content: z.string() })),
      });
      const parsed = Schema.safeParse(j);
      if (parsed.success) {
        setPinned(parsed.data.prefs.pinnedOrderId === orderId);
        setTasks(parsed.data.tasks);
        setNotes(parsed.data.notes);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await fetch("/api/montazysta/prefs", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pinnedOrderId: pinned ? null : orderId }),
            });
            setPinned(!pinned);
          }}
        >
          {pinned ? "Odepnij" : "Przypnij"}
        </Button>
      </div>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const title = String(fd.get("title") || "").trim();
          const description = String(fd.get("description") || "").trim();
          if (!title) return;
          await fetch("/api/montazysta/zadania", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description: description || null,
              relatedOrderId: orderId,
            }),
          });
          (e.currentTarget as HTMLFormElement).reset();
          load();
        }}
      >
        <Input name="title" placeholder="Zadanie do tego zlecenia…" />
        <Textarea name="description" placeholder="Opis (opcjonalnie)" />
        <Button type="submit" size="sm">
          Dodaj zadanie
        </Button>
      </form>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const content = String(fd.get("content") || "").trim();
          if (!content) return;
          await fetch("/api/montazysta/notatki", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, relatedOrderId: orderId }),
          });
          (e.currentTarget as HTMLFormElement).reset();
          load();
        }}
      >
        <Textarea name="content" placeholder="Prywatna notatka do zlecenia…" />
        <Button type="submit" size="sm">
          Dodaj notatkę
        </Button>
      </form>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="text-sm font-medium mb-1">Zadania</div>
          {loading ? (
            <div className="text-xs opacity-70">Wczytywanie…</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {tasks.length === 0 ? (
                <li className="opacity-70">Brak zadań.</li>
              ) : (
                tasks.map((t) => (
                  <li
                    key={t.id}
                    className="rounded border p-2"
                    style={{ borderColor: "var(--pp-border)" }}
                  >
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked={t.done}
                        onChange={async (e) => {
                          await fetch("/api/montazysta/zadania", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: t.id,
                              done: e.currentTarget.checked,
                            }),
                          });
                        }}
                      />
                      <span>{t.title}</span>
                    </label>
                    {t.description ? (
                      <div className="text-xs opacity-80 mt-0.5">
                        {t.description}
                      </div>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Notatki</div>
          {loading ? (
            <div className="text-xs opacity-70">Wczytywanie…</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {notes.length === 0 ? (
                <li className="opacity-70">Brak notatek.</li>
              ) : (
                notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded border p-2"
                    style={{ borderColor: "var(--pp-border)" }}
                  >
                    <div>{n.content}</div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
