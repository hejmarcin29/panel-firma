"use client";
import React from 'react';
import { UploadButton as UTUploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

export function UploadButton({ onClientUploadComplete }: { onClientUploadComplete?: (files: { url: string; name: string }[]) => void }) {
  return (
    <div className="inline-flex">
      <UTUploadButton<OurFileRouter, 'orderAttachments'>
        endpoint="orderAttachments"
        onClientUploadComplete={(res) => {
          const files = (res ?? []).map(f => ({ url: f.url, name: f.name }));
          onClientUploadComplete?.(files);
        }}
        onUploadError={(e: Error) => {
          // eslint-disable-next-line no-alert
          alert(`Błąd przesyłania: ${e.message}`);
        }}
      />
    </div>
  );
}

export default UploadButton;
