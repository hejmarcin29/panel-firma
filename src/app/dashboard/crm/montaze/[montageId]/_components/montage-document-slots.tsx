"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileIcon, Upload, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addMontageAttachment } from "../../actions";
import type { Montage } from "../../types";
import { MontageCategories } from "@/lib/r2/constants";

interface DocumentSlotProps {
    title: string;
    type: string;
    description: string;
    montageId: string;
    existingAttachment?: any;
    required?: boolean;
}

function DocumentSlot({ title, type, description, montageId, existingAttachment, required }: DocumentSlotProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append("montageId", montageId);
                formData.append("file", file);
                formData.append("title", title);
                formData.append("category", MontageCategories.DOCUMENTS);
                formData.append("type", type);

                await addMontageAttachment(formData);
                router.refresh();
            } catch (error) {
                console.error(error);
                alert("Błąd przesyłania pliku");
            }
        });
    };

    return (
        <Card className={existingAttachment ? "border-green-500/50 bg-green-500/5" : required ? "border-orange-500/50" : ""}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {title}
                    {existingAttachment ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : required ? (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    ) : null}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {existingAttachment ? (
                    <div className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                        <FileIcon className="h-4 w-4 text-blue-500" />
                        <a href={existingAttachment.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline flex-1">
                            {existingAttachment.title || existingAttachment.url.split('/').pop()}
                        </a>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={isPending}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Button variant="outline" className="w-full border-dashed" disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                            {isPending ? "Wgraj dokument" : "Wgraj dokument"}
                        </Button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
            </CardContent>
        </Card>
    );
}

export function MontageDocumentSlots({ montage }: { montage: Montage }) {
    const attachments = montage.attachments || [];
    
    const proforma = attachments.find(a => a.type === 'proforma');
    const advance = attachments.find(a => a.type === 'invoice_advance');
    const final = attachments.find(a => a.type === 'invoice_final');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <DocumentSlot 
                title="Faktura Proforma" 
                type="proforma" 
                description="Wymagana do akceptacji oferty (opcjonalnie)."
                montageId={montage.id}
                existingAttachment={proforma}
            />
            <DocumentSlot 
                title="Faktura Zaliczkowa" 
                type="invoice_advance" 
                description="Wymagana do statusu 'Zaliczka Opłacona'."
                montageId={montage.id}
                existingAttachment={advance}
                required
            />
            <DocumentSlot 
                title="Faktura Końcowa" 
                type="invoice_final" 
                description="Wymagana do zakończenia montażu."
                montageId={montage.id}
                existingAttachment={final}
                required
            />
        </div>
    );
}
