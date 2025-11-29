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
    ...montage.checklistItems.map(i => i.attachment).filter(Boolean),
    ...montage.tasks.flatMap(t => t.attachments || []),
  ].filter((v, i, a) => a.findIndex(t => (t?.id === v?.id)) === i); // Deduplicate

  const images = allAttachments.filter(a => a && isImage(a.url));
  const documents = allAttachments.filter(a => a && !isImage(a.url));

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Załączniki</h3>
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
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

        <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dokumenty</h4>
            {documents.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Brak dokumentów</div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {documents.map((attachment) => {
                        if (!attachment) return null;
                        return (
                            <Card key={attachment.id} className="overflow-hidden group relative aspect-[0.75]">
                                <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4 text-center hover:bg-muted/80 transition-colors">
                                    <FileIcon className="mb-3 h-10 w-10 text-muted-foreground" />
                                    <p className="line-clamp-2 text-xs font-medium">
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
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>

        <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Zdjęcia</h4>
            {images.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Brak zdjęć</div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {images.map((attachment) => {
                        if (!attachment) return null;
                        return (
                            <Card key={attachment.id} className="overflow-hidden group relative aspect-square">
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
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
}
