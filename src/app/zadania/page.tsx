"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { AlertDialog } from "@/components/ui/alert-dialog";

type Task = {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
  dueAt: number | null;
  relatedOrderId: string | null;
  userId: string;
};

type SessionInfo = {
  user?: { id?: string | null; role?: string | null } | null;
};
type UserLite = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function TasksPage() {
  const { toast } = useToast();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"open" | "done" | "all">("open");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Quick add state
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(""); // YYYY-MM-DD
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const role = session?.user?.role || null;
  // const me = session?.user?.id || null
  const isAdmin = role === "admin";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await fetch("/api/auth/session")
          .then((r) => r.json())
          .catch(() => null);
        if (!mounted) return;
        setSession(s);
        if (s?.user?.role === "admin") {
          const r = await fetch("/api/uzytkownicy?role=installer");
          const j = await r.json().catch(() => ({ users: [] }));
          if (!mounted) return;
          setUsers(
            (j.users || []).filter((u: UserLite) => u.role === "installer"),
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    const s = status === "all" ? undefined : status;
    if (s) params.set("status", s);
    if (isAdmin && selectedUserId) params.set("userId", selectedUserId);
    const r = await fetch(
      `/api/zadania${params.size ? `?${params.toString()}` : ""}`,
    );
    const j = await r.json().catch(() => ({ tasks: [] }));
    setTasks(Array.isArray(j.tasks) ? j.tasks : []);
  }, [status, isAdmin, selectedUserId]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks();
    }
  }, [session?.user?.id, fetchTasks]);

  const canAdd = useMemo(() => {
    if (!title.trim()) return false;
    if (isAdmin && selectedUserId === "") return false;
    return true;
  }, [title, isAdmin, selectedUserId]);

  async function addTask() {
    if (!canAdd) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: desc.trim() || null,
      };
      if (due) {
        // Normalize yyyy-mm-dd to local midnight epoch
        const at = new Date(due + "T00:00:00");
        body.dueAt = at.getTime();
      }
      if (isAdmin && selectedUserId) body.userId = selectedUserId;
      const r = await fetch("/api/zadania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Nie udało się dodać zadania");
      toast({ title: "Dodano zadanie", variant: "success" });
      setTitle("");
      setDue("");
      setDesc("");
      await fetchTasks();
    } catch (e: unknown) {
      toast({
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDone(id: string, done: boolean) {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done } : t)));
    try {
      const r = await fetch(`/api/zadania/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setTasks(prev);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu",
        variant: "destructive",
      });
    }
  }

  async function removeTask(id: string) {
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== id));
    try {
      const r = await fetch(`/api/zadania/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch {
      setTasks(prev);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć zadania",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Zadania</h1>
        <p className="text-sm opacity-70">
          Twoja lista To‑Do{" "}
          {isAdmin
            ? " (jako admin możesz też przypisać zadania montażystom)"
            : ""}
          .
        </p>
      </div>

      {/* Filtry */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          onClick={() => setStatus("open")}
          className={[
            "h-8 rounded-md border px-3",
            status === "open"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "hover:bg-black/5 dark:hover:bg-white/10",
            "border-black/15 dark:border-white/15",
          ].join(" ")}
        >
          Otwarte
        </button>
        <button
          onClick={() => setStatus("done")}
          className={[
            "h-8 rounded-md border px-3",
            status === "done"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "hover:bg-black/5 dark:hover:bg-white/10",
            "border-black/15 dark:border-white/15",
          ].join(" ")}
        >
          Zakończone
        </button>
        <button
          onClick={() => setStatus("all")}
          className={[
            "h-8 rounded-md border px-3",
            status === "all"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "hover:bg-black/5 dark:hover:bg-white/10",
            "border-black/15 dark:border-white/15",
          ].join(" ")}
        >
          Wszystkie
        </button>
        {isAdmin ? (
          <div className="ml-auto flex items-center gap-2">
            <label className="opacity-70">Montażysta:</label>
            <select
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(e.currentTarget.value || null)}
              className="h-8 rounded-md border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
            >
              <option value="">— ja —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {/* Quick Add */}
      <div
        className="rounded-md border p-3 dark:border-white/15"
        style={{ borderColor: "var(--pp-border)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Co masz do zrobienia?"
            className="md:col-span-2"
          />
          <DatePicker value={due} onChange={setDue} />
          <Input
            value={desc}
            onChange={(e) => setDesc(e.currentTarget.value)}
            placeholder="Opis (opcjonalnie)"
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          {isAdmin ? (
            <div className="text-xs opacity-70">
              Przypisz do:{" "}
              <span className="font-medium">
                {selectedUserId
                  ? users.find((u) => u.id === selectedUserId)?.name ||
                    users.find((u) => u.id === selectedUserId)?.email ||
                    "wybrany"
                  : "mnie"}
              </span>
            </div>
          ) : (
            <div />
          )}
          <Button size="sm" disabled={!canAdd || submitting} onClick={addTask}>
            {submitting ? "Dodawanie…" : "Dodaj"}
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div
        className="rounded-md border divide-y dark:border-white/15 dark:divide-white/10"
        style={{ borderColor: "var(--pp-border)" }}
      >
        {loading ? (
          <div className="p-3 text-sm opacity-70">Wczytywanie…</div>
        ) : tasks.length === 0 ? (
          <div className="p-3 text-sm opacity-70">Brak zadań.</div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-3 anim-enter">
              <input
                type="checkbox"
                className="mt-1"
                checked={t.done}
                onChange={(e) => toggleDone(t.id, e.currentTarget.checked)}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={[
                    "text-sm",
                    t.done ? "line-through opacity-60" : "",
                  ].join(" ")}
                >
                  {t.title}
                </div>
                {(t.description || t.dueAt) && (
                  <div className="text-xs opacity-70 mt-0.5">
                    {t.description ? <span>{t.description}</span> : null}
                    {t.description && t.dueAt ? <span> • </span> : null}
                    {t.dueAt ? (
                      <span>Termin: {formatDate(t.dueAt)}</span>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="h-8 rounded-md border px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  onClick={() => setConfirmDeleteId(t.id)}
                >
                  Usuń
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <AlertDialog
      open={!!confirmDeleteId}
      onOpenChange={(v) => {
        if (!v) setConfirmDeleteId(null);
      }}
      title="Usunąć zadanie?"
      description={
        confirmDeleteId ? (
          <span>Tej operacji nie można cofnąć.</span>
        ) : null
      }
      confirmText="Usuń"
      confirmVariant="destructive"
      onConfirm={async () => {
        const id = confirmDeleteId;
        if (!id) return;
        await removeTask(id);
        setConfirmDeleteId(null);
      }}
    />
    </div>
  );
}
