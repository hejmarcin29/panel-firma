"use client";

import { useState } from "react";

export default function R2UploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");

  async function handleUpload() {
    setError("");
    setUrl("");
    if (!file) return;
    setBusy(true);
    try {
      const res = await fetch("/api/pliki/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type || "application/octet-stream",
          size: file.size,
          filename: file.name,
          prefix: "uploads/",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Błąd presign");

      const put = await fetch(json.url, {
        method: "PUT",
        // R2/S3 expects raw body
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) throw new Error(`Błąd uploadu: ${put.status}`);

      setUrl(json.publicUrl as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-2 p-3 border rounded">
      <div className="font-medium">Test uploadu do R2</div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={!file || busy}
          className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
        >
          {busy ? "Wysyłanie…" : "Wyślij"}
        </button>
        {progress > 0 && <span>{progress}%</span>}
      </div>
      {url && (
        <div className="text-sm">
          Gotowe:{" "}
          <a
            className="text-blue-600 underline"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {url}
          </a>
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
