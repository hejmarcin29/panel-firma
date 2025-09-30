"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { DatePicker } from "@/components/ui/date-picker";
import { FilePreview } from "@/components/files/file-preview.client";
import ImageLightbox from "@/components/lightbox.client";

type Attachment = {
  id: string;
  orderId: string;
  category: "invoices" | "installs" | "contracts" | "protocols" | "other";
  title: string | null;
  version: number;
  mime: string | null;
  size: number | null;
  key: string;
  publicUrl: string;
  createdAt: string | number | Date;
};

const schema = z.object({
  note: z.string().max(2000).optional(),
  preMeasurementSqm: z.string().optional(),
  installerId: z.union([z.string().uuid(), z.literal("")]).optional(),
  // Date-only (YYYY-MM-DD)
  scheduledDate: z.string().optional(),
});

type Values = z.infer<typeof schema>;

type Installer = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export function OrderEditor({
  orderId,
  defaults,
}: {
  orderId: string;
  defaults: {
    note?: string | null;
    preMeasurementSqm?: number | null;
    installerId?: string | null;
    scheduledDate?: number | null;
  };
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [values, setValues] = useState<Values>({
    note: defaults.note ?? "",
    preMeasurementSqm: defaults.preMeasurementSqm
      ? String(defaults.preMeasurementSqm)
      : "",
    installerId: defaults.installerId ?? "",
    // default as date-only string in local TZ
    scheduledDate: defaults.scheduledDate
      ? (() => {
          const dt = new Date(defaults.scheduledDate!);
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, "0");
          const d = String(dt.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        })()
      : "",
  });
  const [saving, setSaving] = useState(false);
  // attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [category, setCategory] = useState<Attachment["category"]>("other");
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>(
    () => ({ open: false, index: 0 }),
  );

  const imageItems = useMemo(
    () =>
      attachments
        .filter((a) => (a.mime || "").startsWith("image/"))
        .map((a) => ({
          src: `/api/pliki/r2/proxy?key=${encodeURIComponent(a.key)}`,
        })),
    [attachments],
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/uzytkownicy?role=installer");
        const j = await r.json().catch(() => ({ users: [] }));
        setInstallers(
          (j.users || []).filter((x: Installer) => x.role === "installer"),
        );
      } catch {
        /* noop */
      }
    })();
  }, []);

  useEffect(() => {
    // fetch attachments list
    (async () => {
      try {
        setAttLoading(true);
        const r = await fetch(`/api/zlecenia/${orderId}/zalaczniki`);
        const j = await r.json().catch(() => ({ items: [] }));
        if (r.ok) setAttachments(j.items || []);
      } catch {
        /* noop */
      } finally {
        setAttLoading(false);
      }
    })();
  }, [orderId]);

  async function save() {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast({
        title: "Błąd",
        description: "Popraw dane formularza",
        variant: "destructive",
      });
      return;
    }
    const body: Record<string, unknown> = {};
    if (parsed.data.note && parsed.data.note.trim() !== "")
      body.note = parsed.data.note.trim();
    if (
      parsed.data.preMeasurementSqm &&
      parsed.data.preMeasurementSqm.trim() !== ""
    )
      body.preMeasurementSqm = parseInt(parsed.data.preMeasurementSqm, 10);
    if (parsed.data.installerId !== undefined)
      body.installerId =
        parsed.data.installerId === "" ? null : parsed.data.installerId;
    if (parsed.data.scheduledDate && parsed.data.scheduledDate.trim() !== "") {
      // Normalize to local midnight for the selected date
      const [y, m, d] = parsed.data.scheduledDate
        .split("-")
        .map((x) => parseInt(x, 10));
      const ts = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime();
      body.scheduledDate = ts;
    } else if ((defaults?.scheduledDate ?? null) !== null) {
      // Explicitly clear if previously set and now empty
      body.scheduledDate = null;
    }
    if (Object.keys(body).length === 0) {
      toast({ title: "Brak zmian" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`/api/zlecenia/${orderId}/montaz`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Błąd zapisu");
      toast({ title: "Zapisano", variant: "success" });
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div>
        <Label>Notatka (wewnętrzna)</Label>
        <Textarea
          rows={4}
          value={values.note}
          onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
        />
      </div>
      <div>
        <Label>m2 przed pomiarem</Label>
        <Input
          inputMode="numeric"
          value={values.preMeasurementSqm}
          onChange={(e) =>
            setValues((v) => ({ ...v, preMeasurementSqm: e.target.value }))
          }
          className="w-40"
        />
      </div>
      <div>
        <Label>Przypisz montażystę</Label>
        <select
          value={values.installerId || ""}
          onChange={(e) =>
            setValues((v) => ({ ...v, installerId: e.target.value }))
          }
          className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
        >
          <option value="">-- bez przypisania --</option>
          {installers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Planowana data</Label>
        <div className="mt-1">
          <DatePicker
            value={values.scheduledDate || ""}
            onChange={(next) =>
              setValues((v) => ({ ...v, scheduledDate: next }))
            }
          />
        </div>
      </div>
      <div>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
        >
          Zapisz
        </button>
      </div>
      <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
        <div className="mb-2 font-medium">Załączniki</div>
        <div className="mb-2 flex items-center gap-2">
          <label className="text-sm">Kategoria:</label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as Attachment["category"])
            }
            className="h-8 rounded-md border border-black/15 bg-transparent px-2 text-sm dark:border-white/15"
          >
            <option value="invoices">Faktury</option>
            <option value="installs">Montaże</option>
            <option value="contracts">Umowy</option>
            <option value="protocols">Protokoły</option>
            <option value="other">Inne</option>
          </select>
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const files = Array.from(e.dataTransfer.files || []);
            if (files.length) void handleFiles(files);
          }}
          className={`mb-3 rounded-md border border-dashed p-4 text-center text-sm ${dragOver ? "border-blue-500 bg-blue-500/5" : "border-black/15 dark:border-white/15"}`}
        >
          Przeciągnij i upuść pliki tutaj lub{" "}
          <label className="underline cursor-pointer">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.currentTarget.files || []);
                if (files.length) void handleFiles(files);
                e.currentTarget.value = "";
              }}
            />{" "}
            wybierz z dysku
          </label>
          {uploading && (
            <div className="mt-2 text-xs opacity-70">Wysyłanie…</div>
          )}
        </div>

        <div className="grid gap-2">
          {attLoading ? (
            <div className="text-sm opacity-70">Ładowanie…</div>
          ) : attachments.length === 0 ? (
            <div className="text-sm opacity-70">Brak załączników</div>
          ) : (
            <ul className="grid gap-2">
              {attachments.map((a, idx) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-black/10 p-2 text-sm dark:border-white/10"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded bg-black/5 dark:bg-white/10">
                      {a.mime?.startsWith("image/") ? (
                        <Image
                          src={`/api/pliki/r2/proxy?key=${encodeURIComponent(a.key)}`}
                          alt="Podgląd"
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                          unoptimized
                        />
                      ) : (
                        <FilePreview
                          url={`/api/pliki/r2/proxy?key=${encodeURIComponent(a.key)}`}
                          contentType={a.mime || undefined}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {a.key.split("/").slice(-1)[0]}
                      </div>
                      <div className="text-xs opacity-70">
                        {a.category} · {a.mime || "plik"} · {formatSize(a.size)}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 space-x-2">
                    {a.mime?.startsWith("image/") && (
                      <button
                        type="button"
                        className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                        onClick={() => setLightbox({ open: true, index: idx })}
                      >
                        Podgląd
                      </button>
                    )}
                    <a
                      href={a.publicUrl}
                      target="_blank"
                      className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                    >
                      Pobierz
                    </a>
                    <button
                      type="button"
                      className="rounded-md border border-red-500/50 px-2 py-1 text-xs text-red-600 hover:bg-red-500/10 dark:text-red-400"
                      onClick={() => deleteAttachment(a.id)}
                    >
                      Usuń
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {lightbox.open && imageItems.length > 0 && (
          <ImageLightbox
            images={imageItems}
            open={lightbox.open}
            onClose={() => setLightbox({ open: false, index: 0 })}
          />
        )}
      </div>
    </div>
  );

  async function handleFiles(files: File[]) {
    setUploading(true);
    try {
      for (const file of files) {
        // presign
        const pres = await fetch(
          `/api/zlecenia/${orderId}/zalaczniki/presign`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mime: file.type || "application/octet-stream",
              size: file.size,
              category,
            }),
          },
        );
        const pj = await pres.json().catch(() => ({}));
        if (!pres.ok) throw new Error(pj?.error || "Błąd presign");
        // upload to R2
        const up = await fetch(pj.url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!up.ok) throw new Error("Błąd wysyłania do R2");
        // finalize metadata
        const fin = await fetch(`/api/zlecenia/${orderId}/zalaczniki`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: pj.key,
            publicUrl: pj.publicUrl,
            category,
            mime: file.type || null,
            size: file.size,
          }),
        });
        const fj = await fin.json().catch(() => ({}));
        if (!fin.ok) throw new Error(fj?.error || "Błąd zapisu metadanych");
      }
      // refresh list
      const r = await fetch(`/api/zlecenia/${orderId}/zalaczniki`);
      const j = await r.json().catch(() => ({ items: [] }));
      if (r.ok) setAttachments(j.items || []);
      toast({ title: "Dodano pliki", variant: "success" });
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się wysłać plików";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attId: string) {
    if (!confirm("Na pewno usunąć plik?")) return;
    try {
      const r = await fetch(`/api/zlecenia/${orderId}/zalaczniki/${attId}`, {
        method: "DELETE",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Błąd usuwania");
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Nie udało się usunąć";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    }
  }
}

function formatSize(n: number | null | undefined) {
  if (!n || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
