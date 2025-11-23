"use client";

import { FileIcon, ExternalLink } from "lucide-react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import type { Montage } from "../../types";

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export function MontageGalleryTab({ montage }: { montage: Montage }) {
  const allAttachments = [
    ...montage.attachments,
    ...montage.notes.flatMap(n => n.attachments),
    ...montage.checklistItems.map(i => i.attachment).filter(Boolean)
  ].filter((v, i, a) => a.findIndex(t => (t?.id === v?.id)) === i); // Deduplicate

  if (allAttachments.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileIcon className="mb-4 h-12 w-12 opacity-20" />
              <p>Brak załączników w tym montażu</p>
          </div>
      )
  }

  return (
    <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3 md:grid-cols-4">
      {allAttachments.map((attachment) => {
        if (!attachment) return null;
        const isImg = isImage(attachment.url);
        
        return (
          <Card key={attachment.id} className="overflow-hidden group relative aspect-square">
            {isImg ? (
              <div className="relative h-full w-full">
                 <Image
                    src={attachment.url}
                    alt={attachment.title || "Załącznik"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white hover:underline flex items-center gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Otwórz
                    </a>
                 </div>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4 text-center">
                <FileIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {attachment.title || "Dokument"}
                </p>
                 <a 
                    href={attachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0"
                >
                    <span className="sr-only">Otwórz</span>
                </a>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
