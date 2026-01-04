"use client";

import { FileIcon, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Montage, MontageAttachment } from "../../types";

interface DocumentSlotProps {
    title: string;
    description: string;
    existingAttachment?: MontageAttachment;
}

function DocumentSlot({ title, description, existingAttachment }: DocumentSlotProps) {
    return (
        <Card className={existingAttachment ? "border-green-500/50 bg-green-500/5" : ""}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {title}
                    {existingAttachment && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
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
                    <div className="flex items-center justify-center p-4 border border-dashed rounded-md text-muted-foreground text-sm bg-muted/50">
                        Brak dokumentu
                    </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                    {existingAttachment ? description : "Dodaj ten dokument w zakładce Płatności."}
                </p>
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
                description="Wymagana do akceptacji oferty (opcjonalnie)."
                existingAttachment={proforma}
            />
            <DocumentSlot 
                title="Faktura Zaliczkowa" 
                description="Wymagana do statusu 'Zaliczka Opłacona'."
                existingAttachment={advance}
            />
            <DocumentSlot 
                title="Faktura Końcowa" 
                description="Wymagana do zakończenia montażu."
                existingAttachment={final}
            />
        </div>
    );
}
