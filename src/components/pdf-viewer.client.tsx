"use client";
import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

type PdfJsModule = typeof pdfjsLib & {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: string | { url: string }) => { promise: Promise<unknown> };
  version?: string;
};

export function PdfViewer({
  url,
  scale = 1.2,
}: {
  url: string;
  scale?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configure worker via CDN path (compatible with Next.js without custom loaders)
    const pdf = pdfjsLib as PdfJsModule;
    const ver = pdf.version || "4.6.82";
    pdf.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${ver}/pdf.worker.min.js`;
    let cancelled = false;
    (async () => {
      try {
        const doc = (await (pdf as PdfJsModule).getDocument(url)
          .promise) as unknown as {
          getPage: (
            n: number,
          ) => Promise<{
            getViewport: (opts: { scale: number }) => {
              height: number;
              width: number;
            };
          }>;
        };
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const pageWithRender = page as unknown as {
          render: (params: {
            canvasContext: CanvasRenderingContext2D;
            viewport: { height: number; width: number };
          }) => { promise: Promise<void> };
        };
        await pageWithRender.render({ canvasContext: ctx, viewport }).promise;
      } catch (e: unknown) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Nie udało się wczytać PDF",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, scale]);

  if (error) return <div className="p-2 text-sm text-red-600">{error}</div>;
  return <canvas ref={canvasRef} className="max-w-full h-auto" />;
}

export default PdfViewer;
