"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  DownloadCloud,
  File,
  Folder,
  Image as ImageIcon,
  Search,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CreateFolderDialog } from "./create-folder-dialog";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

const monthFormatter = new Intl.DateTimeFormat("pl-PL", {
  month: "long",
  year: "numeric",
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

const PREVIEWABLE_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".heic",
  ".heif",
  ".avif",
];

function isPreviewableImage(fileName: string) {
  const lower = fileName.toLowerCase();
  return PREVIEWABLE_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

type SerializedObject = {
  key: string;
  fileName: string;
  size: number;
  lastModified: string | null;
};

type SerializedFolder = {
  clientId: string;
  label: string;
  prefix: string;
  totalSize: number;
  latestUploadAt: string | null;
  objects: SerializedObject[];
};

type FilesBrowserProps = {
  folders: SerializedFolder[];
};

type MonthOption = {
  value: string;
  label: string;
};

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function FilesBrowser({ folders }: FilesBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const monthOptions = useMemo<MonthOption[]>(() => {
    const map = new Map<string, MonthOption>();
    for (const folder of folders) {
      for (const object of folder.objects) {
        const date = parseDate(object.lastModified);
        if (!date) continue;
        const key = getMonthKey(date);
        if (!map.has(key)) {
          map.set(key, { value: key, label: monthFormatter.format(date) });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.value > b.value ? -1 : 1));
  }, [folders]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const monthFilter = selectedMonth === "all" ? null : selectedMonth;

  const filteredFolders = useMemo(() => {
    return folders
      .map((folder) => {
        const filteredObjects = monthFilter
          ? folder.objects.filter((object) => {
              const date = parseDate(object.lastModified);
              return date ? getMonthKey(date) === monthFilter : false;
            })
          : folder.objects;

        const matchesSearch =
          normalizedSearch.length === 0 ||
          folder.clientId.toLowerCase().includes(normalizedSearch) ||
          folder.label.toLowerCase().includes(normalizedSearch) ||
          filteredObjects.some((object) =>
            object.fileName.toLowerCase().includes(normalizedSearch),
          );

        if (!matchesSearch) {
          return null;
        }

        if (monthFilter && filteredObjects.length === 0) {
          return null;
        }

        return {
          ...folder,
          filteredObjects: filteredObjects.sort((a, b) => {
            const aDate = parseDate(a.lastModified)?.getTime() ?? 0;
            const bDate = parseDate(b.lastModified)?.getTime() ?? 0;
            return bDate - aDate;
          }),
        };
      })
      .filter((value): value is SerializedFolder & { filteredObjects: SerializedObject[] } => Boolean(value));
  }, [folders, monthFilter, normalizedSearch]);

  const overallStats = useMemo(() => {
    const files = folders.reduce((total, folder) => total + folder.objects.length, 0);
    const size = folders.reduce((total, folder) => total + folder.totalSize, 0);
    const latest = folders
      .map((folder) => parseDate(folder.latestUploadAt))
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    return {
      folders: folders.length,
      files,
      size,
      latest,
    };
  }, [folders]);

  const filteredStats = useMemo(() => {
    const files = filteredFolders.reduce(
      (total, folder) => total + folder.filteredObjects.length,
      0,
    );
    const size = filteredFolders.reduce(
      (total, folder) =>
        total + folder.filteredObjects.reduce((acc, object) => acc + object.size, 0),
      0,
    );
    const latest = filteredFolders
      .flatMap((folder) => folder.filteredObjects)
      .map((object) => parseDate(object.lastModified))
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? overallStats.latest;

    return {
      folders: filteredFolders.length,
      files,
      size,
      latest,
    };
  }, [filteredFolders, overallStats.latest]);

  const hasFilters = normalizedSearch.length > 0 || Boolean(monthFilter);

  if (folders.length === 0) {
    return (
      <Card className="rounded-3xl border border-dashed border-border/70 bg-muted/30">
        <CardContent className="p-0">
          <Empty className="border-none bg-transparent">
            <EmptyMedia variant="icon">
              <Folder className="size-6 text-primary" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak plików w R2</EmptyTitle>
              <EmptyDescription>
                Wgraj pierwszy plik do bucketa Cloudflare R2 zgodnie ze schematem
                <span className="font-semibold"> clientId_nazwa-klienta/plik</span>, a katalog pojawi się na liście.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="text-left">
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Zweryfikuj konfigurację środowiskową – klucze API, bucket i endpoint R2.</li>
                <li>Dodaj plik testowy z widoku klienta, aby potwierdzić uprawnienia zapisu.</li>
                <li>Zachowaj strukturę folderów: jeden katalog na klienta, pliki w podfolderze.</li>
              </ul>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <Card className="rounded-3xl border border-border/70 bg-background/60 shadow-sm shadow-primary/5">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-foreground">
              Filtruj repozytorium plików
            </CardTitle>
            <CardDescription>
              Wyszukaj klienta po numerze, imieniu i nazwisku lub zawęź listę do wybranego miesiąca.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="search" className="text-xs uppercase tracking-wide text-muted-foreground">
                Szukaj klienta
              </Label>
              <div className="relative flex items-center">
                <Search className="absolute left-3 size-4 text-muted-foreground" aria-hidden />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="np. #123, Jan Kowalski"
                  className="pl-10 w-64"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="month" className="text-xs uppercase tracking-wide text-muted-foreground">
                Miesiąc
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month" className="w-48 justify-between">
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie miesiące</SelectItem>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMonth("all");
                }}
              >
                Resetuj filtry
              </Button>
            ) : null}
            <CreateFolderDialog />
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {hasFilters ? (
            <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
              {filteredStats.folders} klientów w wynikach
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-full bg-muted/40 text-muted-foreground">
              Brak aktywnych filtrów
            </Badge>
          )}
          {monthFilter ? (
            <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
              <CalendarRange className="mr-1 size-3" aria-hidden />
              {monthOptions.find((option) => option.value === monthFilter)?.label ?? monthFilter}
            </Badge>
          ) : null}
          {normalizedSearch ? (
            <Badge variant="outline" className="rounded-full border-border/60 text-muted-foreground">
              Zapytanie: „{searchQuery}”
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border border-border/70 bg-background/80 shadow-sm shadow-primary/10">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Klienci z plikami
              </CardTitle>
              <CardDescription>Wyniki filtrów vs całość</CardDescription>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UsersRound className="size-5" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {filteredStats.folders}
              <span className="text-base font-normal text-muted-foreground"> / {overallStats.folders}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-background/80 shadow-sm shadow-primary/10">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Łączna liczba plików</CardTitle>
              <CardDescription>Po zastosowaniu filtrów</CardDescription>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <File className="size-5" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {filteredStats.files}
              <span className="text-base font-normal text-muted-foreground"> / {overallStats.files}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 bg-background/80 shadow-sm shadow-primary/10">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Łączny rozmiar</CardTitle>
              <CardDescription>Aktualne wyniki filtrowania</CardDescription>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Folder className="size-5" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {formatBytes(filteredStats.size)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}/ {formatBytes(overallStats.size)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {filteredFolders.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-border/70 bg-muted/30">
          <CardContent className="p-0">
            <Empty className="border-none bg-transparent">
              <EmptyMedia variant="icon">
                <Folder className="size-6 text-primary" aria-hidden />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Brak plików dla podanych kryteriów</EmptyTitle>
                <EmptyDescription>
                  Dostosuj wyszukiwane hasło lub wybierz inny miesiąc, aby zobaczyć dostępne załączniki.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="text-left">
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Sprawdź pisownię nazwiska klienta lub numer klienta.</li>
                  <li>Zmień zakres czasowy na „Wszystkie miesiące”, aby wrócić do pełnej listy.</li>
                  <li>Dodaj nowe pliki w widoku klienta, aby zasilić repozytorium.</li>
                </ul>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredFolders.map((folder) => {
            const documentCount = folder.filteredObjects.length;
            const totalSize = folder.filteredObjects.reduce(
              (sum, object) => sum + object.size,
              0,
            );
            const latestUpload = folder.filteredObjects[0]?.lastModified
              ? parseDate(folder.filteredObjects[0]?.lastModified)
              : parseDate(folder.latestUploadAt);

            return (
              <Card
                key={folder.prefix}
                className="flex h-full flex-col gap-4 rounded-3xl border border-border/70 bg-background/80 shadow-sm shadow-primary/10"
              >
                <CardHeader className="gap-2 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                          {folder.clientId}
                        </Badge>
                        {latestUpload ? (
                          <span className="text-xs text-muted-foreground">
                            Aktualizacja {dateFormatter.format(latestUpload)}
                          </span>
                        ) : null}
                      </div>
                      <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                        {folder.label}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {documentCount} plików · {formatBytes(totalSize)}
                      </CardDescription>
                    </div>
                    <span className="flex size-11 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <Folder className="size-5" aria-hidden />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plik</TableHead>
                        <TableHead>Rozmiar</TableHead>
                        <TableHead>Zmodyfikowano</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {folder.filteredObjects.slice(0, 8).map((object) => {
                        const lastModified = parseDate(object.lastModified);
                        const previewUrl = `/api/files/download?key=${encodeURIComponent(object.key)}`;
                        const previewable = isPreviewableImage(object.fileName);
                        return (
                          <TableRow key={object.key}>
                            <TableCell className="max-w-[240px]" title={object.fileName}>
                              <div className="flex items-center gap-3">
                                {previewable ? (
                                  <HoverCard openDelay={120} closeDelay={120}>
                                    <HoverCardTrigger asChild>
                                      <button
                                        type="button"
                                        className="relative h-12 w-12 overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-sm transition hover:border-primary/60 hover:shadow-primary/10"
                                        aria-label={`Podgląd pliku ${object.fileName}`}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={previewUrl}
                                          alt={`Podgląd pliku ${object.fileName}`}
                                          loading="lazy"
                                          className="h-full w-full object-cover"
                                        />
                                      </button>
                                    </HoverCardTrigger>
                                    <HoverCardContent side="top" align="start" className="w-80 space-y-2 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-xl">
                                      <p className="text-xs font-medium text-muted-foreground">
                                        Szybki podgląd
                                      </p>
                                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={previewUrl}
                                          alt={`Podgląd pliku ${object.fileName}`}
                                          className="max-h-72 w-full object-contain"
                                        />
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                ) : (
                                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 text-muted-foreground">
                                    <ImageIcon className="size-5" aria-hidden />
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">{object.fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {previewable ? "Kliknij podgląd, aby otworzyć większy widok." : "Brak podglądu – pobierz plik, by go zobaczyć."}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatBytes(object.size)}</TableCell>
                            <TableCell>
                              {lastModified ? dateFormatter.format(lastModified) : "brak danych"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="rounded-full border-border/60"
                              >
                                <Link
                                  href={`/api/files/download?key=${encodeURIComponent(object.key)}`}
                                  prefetch={false}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <DownloadCloud className="mr-2 size-4" aria-hidden />
                                  Pobierz
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {documentCount === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                            Folder jest pusty. Dodaj pliki z widoku klienta lub skorzystaj z przycisku „Dodaj zdjęcia /
                            załączniki”.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                  {documentCount > 8 ? (
                    <p className="text-xs text-muted-foreground">
                      Wyświetlono 8 z {documentCount} plików. Dodaj paginację, aby obsłużyć pełną listę.
                    </p>
                  ) : null}
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                    Ścieżka w R2: <span className="font-mono text-foreground">{folder.prefix}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
