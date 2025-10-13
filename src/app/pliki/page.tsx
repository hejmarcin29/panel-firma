import type { Metadata } from "next";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth";
import { listClientFolders } from "@/lib/r2";
import { FilesBrowser } from "./_components/files-browser";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
	dateStyle: "medium",
	timeStyle: "short",
});

export const metadata: Metadata = {
	title: "Pliki klientów",
	description: "Przeglądaj strukturę plików w R2 i pobieraj załączniki klientów.",
};

export default async function PlikiPage() {
  await requireRole(['ADMIN']);
  let folders: Awaited<ReturnType<typeof listClientFolders>> = [];
  let loadError: Error | null = null;

  try {
    folders = await listClientFolders();
  } catch (error) {
    loadError = error instanceof Error ? error : new Error("Nie udało się połączyć z R2.");
  }

  const latestUpload = folders
    .map((folder) => folder.latestUploadAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const serializedFolders = folders.map((folder) => ({
    clientId: folder.clientId,
    label: folder.label,
    prefix: folder.prefix,
    totalSize: folder.totalSize,
    latestUploadAt: folder.latestUploadAt?.toISOString() ?? null,
    objects: folder.objects.map((object) => ({
      key: object.key,
      fileName: object.fileName,
      size: object.size,
      lastModified: object.lastModified?.toISOString() ?? null,
    })),
  }));

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
            Pliki
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
            Zorganizowane repozytorium załączników klientów
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
            Przechowuj dokumenty i multimedia w Cloudflare R2, uporządkowane według klientów. Z tego widoku szybko
            pobierzesz plik, sprawdzisz ostatnie aktualizacje i zweryfikujesz kompletność materiałów.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {latestUpload ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
              <RefreshCw className="size-4" aria-hidden />
              Odświeżone {dateFormatter.format(latestUpload)}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              Brak przesłanych plików
            </div>
          )}
        </div>
      </section>

      {loadError ? (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <span className="flex size-12 items-center justify-center rounded-3xl bg-destructive/20 text-destructive">
              <AlertTriangle className="size-6" aria-hidden />
            </span>
            <div className="space-y-3 text-sm text-muted-foreground">
              <h2 className="text-xl font-semibold text-destructive">Problem z połączeniem do R2</h2>
              <p>{loadError.message}</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Zweryfikuj zmienne środowiskowe <code className="font-mono">R2_ACCESS_KEY_ID</code>, <code className="font-mono">R2_SECRET_ACCESS_KEY</code>, <code className="font-mono">R2_BUCKET</code>
                  oraz <code className="font-mono">R2_ENDPOINT</code> / <code className="font-mono">R2_ACCOUNT_ID</code>.
                </li>
                <li>Upewnij się, że zapora lub proxy HTTPS nie blokuje domeny *.r2.cloudflarestorage.com.</li>
                <li>Po poprawkach odśwież stronę, aby pobrać listę plików ponownie.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <FilesBrowser folders={serializedFolders} />
      )}
    </div>
  );
}