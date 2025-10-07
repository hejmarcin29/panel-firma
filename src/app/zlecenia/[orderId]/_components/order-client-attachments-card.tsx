"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { DownloadCloud, ImagePlus, Loader2, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadClientAttachmentsAction } from "@/app/klienci/[clientId]/actions";
import {
  INITIAL_UPLOAD_CLIENT_ATTACHMENTS_STATE,
  type UploadClientAttachmentsState,
} from "@/app/klienci/[clientId]/form-state";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatBytes(size: number) {
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / Math.pow(1024, power);
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="rounded-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          Przesyłanie…
        </>
      ) : (
        <>
          <ImagePlus className="mr-2 size-4" aria-hidden />
          Dodaj pliki
        </>
      )}
    </Button>
  );
}

type AttachmentItem = {
  key: string;
  fileName: string;
  size: number;
  lastModified: string | null;
};

type OrderClientAttachmentsCardProps = {
  clientId: string;
  clientFullName: string | null;
  orderId: string;
  attachments: AttachmentItem[];
};

export function OrderClientAttachmentsCard({
  clientId,
  clientFullName,
  orderId,
  attachments,
}: OrderClientAttachmentsCardProps) {
  const action = uploadClientAttachmentsAction.bind(null, {
    clientId,
    clientFullName: clientFullName ?? undefined,
    pathsToRevalidate: [`/zlecenia/${orderId}`],
  });

  const [state, formAction] = useActionState<UploadClientAttachmentsState, FormData>(
    action,
    INITIAL_UPLOAD_CLIENT_ATTACHMENTS_STATE,
  );

  const latestUploads = attachments.slice(0, 8);

  return (
    <Card className="rounded-3xl border border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Załączniki klienta</CardTitle>
        <CardDescription>
          Dodaj dokumenty i zdjęcia – zapiszą się w folderze klienta i będą dostępne z poziomu repozytorium plików.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-attachments" className="text-xs uppercase tracking-wide text-muted-foreground">
              Dodaj zdjęcia / załączniki
            </Label>
            <Input
              id="client-attachments"
              name="files"
              type="file"
              multiple
              className="rounded-xl border-dashed"
            />
            <p className="text-xs text-muted-foreground">
              Obsługiwane formaty: obrazy, PDF, dokumenty. Limit 25 MB na plik – nazwy zostaną znormalizowane automatycznie.
            </p>
          </div>

          {state.status === "error" ? (
            <p className="rounded-xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message ?? "Nie udało się przesłać plików."}
            </p>
          ) : null}

          {state.status === "success" ? (
            <p className="rounded-xl border border-emerald-300/40 bg-emerald-100/40 px-3 py-2 text-sm text-emerald-700">
              {state.message ?? "Załączniki zostały dodane."}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <SubmitButton />
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/pliki">
                <Paperclip className="mr-2 size-4" aria-hidden />
                Repozytorium plików
              </Link>
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-foreground">Ostatnie pliki klienta</p>
            <Badge variant="secondary" className="rounded-full bg-muted/40 text-muted-foreground">
              {attachments.length} łącznie
            </Badge>
          </div>
          {latestUploads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak załączników przypisanych do klienta. Dodaj pierwsze pliki, aby pojawiły się w repozytorium.
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {latestUploads.map((attachment) => {
                const lastModified = parseDate(attachment.lastModified);
                return (
                  <li
                    key={attachment.key}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium text-foreground" title={attachment.fileName}>
                        {attachment.fileName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatBytes(attachment.size)}</span>
                        <span>•</span>
                        <span>{lastModified ? dateFormatter.format(lastModified) : "brak daty"}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-primary hover:bg-primary/10"
                      asChild
                    >
                      <Link
                        href={`/api/files/download?key=${encodeURIComponent(attachment.key)}`}
                        prefetch={false}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <DownloadCloud className="mr-1 size-4" aria-hidden />
                        Pobierz
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
