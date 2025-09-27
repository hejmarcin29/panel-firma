"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export function PdfViewer({ url, scale = 1.2 }: { url: string; scale?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configure worker via CDN path (compatible with Next.js without custom loaders)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;
    let cancelled = false;
    (async () => {
      try {
        const pdf = await (pdfjsLib as any).getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Nie udało się wczytać PDF');
      }
    })();
    return () => { cancelled = true };
  }, [url, scale]);

  if (error) return <div className="p-2 text-sm text-red-600">{error}</div>;
  return <canvas ref={canvasRef} className="max-w-full h-auto" />;
}

export default PdfViewer;
