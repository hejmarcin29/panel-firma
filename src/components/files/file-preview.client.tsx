"use client";

import { useMemo } from "react";
import Image from "next/image";

export function FilePreview({
  url,
  contentType,
}: {
  url: string;
  contentType?: string;
}) {
  const type = useMemo(
    () => contentType || guessTypeFromUrl(url),
    [contentType, url],
  );

  if (type?.startsWith("image/")) {
    return (
      <div className="border rounded p-2">
        <Image
          src={url}
          alt="Podgląd"
          width={1200}
          height={800}
          className="h-auto max-h-[60vh] w-auto object-contain mx-auto"
          sizes="(max-width: 1200px) 100vw, 1200px"
          unoptimized
        />
      </div>
    );
  }

  if (type === "application/pdf" || url.toLowerCase().endsWith(".pdf")) {
    return (
      <div className="border rounded overflow-hidden">
        <iframe
          src={`${url}#toolbar=1`}
          className="w-full h-[70vh]"
          title="Podgląd PDF"
        />
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      Brak wbudowanego podglądu dla tego typu. Użyj „Pobierz”.
    </div>
  );
}

export function DownloadButton({
  url,
  filename,
}: {
  url: string;
  filename?: string;
}) {
  return (
    <a
      href={url}
      download={filename}
      className="px-3 py-1 bg-gray-900 text-white rounded inline-block"
    >
      Pobierz
    </a>
  );
}

function guessTypeFromUrl(url: string): string | undefined {
  const q = url.split("?")[0];
  const ext = q.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;
  const imgExts = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "bmp"]);
  if (imgExts.has(ext)) {
    return `image/${ext === "jpg" ? "jpeg" : ext}`;
  }
  if (ext === "pdf") return "application/pdf";
  return undefined;
}
