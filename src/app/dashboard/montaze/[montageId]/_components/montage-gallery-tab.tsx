"use client";

import { FileIcon, ExternalLink, Upload, Plus } from "lucide-react";
import Image from "next/image";
import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addMontageAttachment } from "../../actions";
import type { Montage } from "../../types";

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export function MontageGalleryTab({ montage }: { montage: Montage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("montageId", montage.id);
    formData.append("file", file);
    // Optional: prompt for title or use filename
    formData.append("title", file.name);

    startTransition(async () => {
        try {
            await addMontageAttachment(formData);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Wystąpił błąd podczas przesyłania pliku.");
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    });
  };

  const allAttachments = [
    ...montage.attachments,
    ...montage.notes.flatMap(n => n.attachments),
    ...montage.checklistItems.map(i => i.attachment).filter(Boolean)
  ].filter((v, i, a) => a.findIndex(t => (t?.id === v?.id)) === i); // Deduplicate

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Galeria zdjęć i plików</h3>
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                />
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={pending}
                >
                    {pending ? <Upload className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Dodaj plik
                </Button>
            </div>
        </div>

        {allAttachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <FileIcon className="mb-4 h-12 w-12 opacity-20" />
                <p>Brak załączników w tym montażu</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
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
        )}
    </div>
  );
}
