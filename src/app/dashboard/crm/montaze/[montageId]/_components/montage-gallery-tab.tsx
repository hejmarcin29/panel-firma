"use client";

import { FileIcon, ExternalLink, Upload, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMontageAttachment, deleteMontageAttachment } from "../../actions";
import type { Montage } from "../../types";
import { MontageCategories, MontageSubCategories } from "@/lib/r2/constants";
import { MontageDocumentSlots } from "./montage-document-slots";

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export function MontageGalleryTab({ montage, userRoles = [] }: { montage: Montage, userRoles?: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(MontageCategories.GALLERY);

  const isInstaller = userRoles.includes('installer') && !userRoles.includes('admin');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    startTransition(async () => {
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append("montageId", montage.id);
                formData.append("file", file);
                formData.append("title", file.name);
                formData.append("category", selectedCategory);
                
                await addMontageAttachment(formData);
            }
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Wystąpił błąd podczas przesyłania plików.");
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
        {!isInstaller && <MontageDocumentSlots montage={montage} />}

        <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-semibold">Pozostałe Załączniki</h3>
            <div className="flex items-center gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Kategoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={MontageCategories.GALLERY}>Ogólne</SelectItem>
                        <SelectItem value={MontageSubCategories.MEASUREMENT_BEFORE}>Pomiar / Przed</SelectItem>
                        <SelectItem value={MontageSubCategories.IN_PROGRESS}>W trakcie</SelectItem>
                        <SelectItem value={MontageSubCategories.REALIZATION}>Realizacja</SelectItem>
                        <SelectItem value={MontageSubCategories.COMPLAINTS}>Reklamacje</SelectItem>
                        {!isInstaller && <SelectItem value={MontageCategories.DOCUMENTS}>Dokumenty</SelectItem>}
                    </SelectContent>
                </Select>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept={isInstaller ? "image/*" : undefined}
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

        {!isInstaller && (
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dokumenty</h4>
                {documents.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">Brak dokumentów</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {documents.map((attachment) => {
                            if (!attachment) return null;
                            return (
                                <Card key={attachment.id} className="overflow-hidden group relative aspect-3/4">
                                    <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4 text-center hover:bg-muted/80 transition-colors">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm('Czy na pewno chcesz usunąć ten plik?')) {
                                                    startTransition(async () => {
                                                        await deleteMontageAttachment(attachment.id);
                                                        router.refresh();
                                                    });
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
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
        )}

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
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
                                                startTransition(async () => {
                                                    await deleteMontageAttachment(attachment.id);
                                                    router.refresh();
                                                });
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
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
