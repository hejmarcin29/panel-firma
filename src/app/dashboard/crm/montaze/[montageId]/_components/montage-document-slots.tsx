"use client";

import { FileIcon, CheckCircle, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type InferSelectModel } from 'drizzle-orm';
import { documents as documentsSchema } from '@/lib/db/schema';
import type { Montage, MontageAttachment, MontageDocument } from "../../types";
import { toast } from "sonner";
import { deleteDocument } from "@/app/dashboard/crm/montaze/[montageId]/document-actions";
import { deleteMontageAttachment } from "../../actions";
import { 
    UploadMontageProformaDialog, 
    UploadMontageFinalInvoiceDialog, 
    UploadMontageAdvanceInvoiceDialog, 
    UploadMontageCorrectionDialog 
} from './document-dialogs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

type Document = MontageDocument;

interface DocumentSlotProps {
    title: string;
    description: string;
    existingDocument?: { id: string, number: string | null, pdfUrl: string | null, type: string }; // New registry doc
    existingAttachment?: MontageAttachment; // Fallback old doc
    uploadAction?: React.ReactNode;
    missingLabel?: string;
    montageId: string;
    userRoles: string[];
}

function DocumentSlot({ title, description, existingDocument, existingAttachment, uploadAction, missingLabel, montageId, userRoles }: DocumentSlotProps) {
    const isCompleted = !!existingDocument;
    // We treat existingAttachment as "completed" for visual purposes, but we prefer existingDocument.
    const hasAnyDocs = existingDocument || existingAttachment;
    const isAdmin = userRoles.includes('admin');

    const handleDelete = async (id: string, isLegacy: boolean) => {
        try {
            if (isLegacy) {
                 await deleteMontageAttachment(id);
            } else {
                await deleteDocument(id, montageId);
            }
            toast.success('Dokument usunięty');
        } catch (error) {
           const msg = error instanceof Error ? error.message : 'Błąd usuwania';
           toast.error(msg);
        }
    };

    return (
        <Card className={isCompleted ? "border-green-500/50 bg-green-500/5 transition-colors" : hasAnyDocs ? "border-amber-500/50 bg-amber-500/5 transition-colors" : ""}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {title}
                    {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (hasAnyDocs && <CheckCircle className="h-4 w-4 text-amber-500" />)}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {existingDocument ? (
                    <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2 text-sm p-2 bg-background rounded border border-green-200 group relative pr-8">
                             <FileText className="h-4 w-4 text-green-600 shrink-0" />
                             <div className="flex flex-col overflow-hidden">
                                 <span className="font-semibold text-xs text-green-700">Zaksięgowano</span>
                                 {existingDocument.pdfUrl ? (
                                    <a href={existingDocument.pdfUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-xs">
                                        {existingDocument.number || "Dokument bez numeru"}
                                    </a>
                                 ) : (
                                    <span className="text-xs">{existingDocument.number || "Brak numeru"} (Brak PDF)</span>
                                 )}
                             </div>

                             {isAdmin && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Czy na pewno usunąć dokument?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Usuwasz dokument: <b>{existingDocument.number}</b>.<br/>
                                                    Ta operacja jest nieodwracalna. Będzie wymagane ponowne wgranie dokumentu.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(existingDocument.id, false)} className="bg-red-600 hover:bg-red-700">
                                                    Usuń
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                             )}
                         </div>
                    </div>
                ) : existingAttachment ? (
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm p-2 bg-background rounded border border-amber-200 group relative pr-8">
                            <FileIcon className="h-4 w-4 text-amber-500 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-semibold text-xs text-amber-700">Wgrano (Stary system)</span>
                                <a href={existingAttachment.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-xs">
                                    {existingAttachment.title || "Plik"}
                                </a>
                            </div>

                            {isAdmin && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Czy na pewno usunąć załącznik?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Usuwasz stary załącznik: <b>{existingAttachment.title}</b>.<br/>
                                                    Ta operacja jest nieodwracalna.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(existingAttachment.id, true)} className="bg-red-600 hover:bg-red-700">
                                                    Usuń
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                             )}
                        </div>
                        {/* We allow upgrading to new system */}
                        <div className="mt-1">
                             {uploadAction}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center p-4 border border-dashed rounded-md text-muted-foreground text-sm bg-muted/50">
                            Brak dokumentu
                        </div>
                        {uploadAction}
                    </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                    {isCompleted ? "Dokument poprawnie zarejestrowany." : (missingLabel || description)}
                </p>
            </CardContent>
        </Card>
    );
}


export function MontageDocumentSlots({ montage, userRoles }: { montage: Montage & { documents?: Document[] }, userRoles?: string[] }) {
    const roles = userRoles || [];
    const attachments = montage.attachments || [];
    const documents = montage.documents || [];
    
    // Attachments (Old)
    const attContract = attachments.find(a => a.type === 'contract' || a.title?.toLowerCase().includes('umowa'));
    const attProforma = attachments.find(a => a.type === 'proforma');
    const attAdvance = attachments.find(a => a.type === 'invoice_advance');
    const attProtocol = attachments.find(a => a.type === 'protocol' || a.title?.toLowerCase().includes('protokół'));
    const attFinal = attachments.find(a => a.type === 'invoice_final');

    // Documents (New Registry)
    const docProforma = documents.find(d => d.type === 'proforma');
    const docAdvance = documents.find(d => d.type === 'advance_invoice'); // Note: Type mapping might differ
    const docFinal = documents.find(d => d.type === 'final_invoice'); 
    const docCorrection = documents.find(d => d.type === 'correction_invoice');

    return (
        <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DocumentSlot 
                    title="Umowa" 
                    description="Podpisana umowa z klientem."
                    missingLabel="Umowa generowana jest po akceptacji oferty."
                    existingAttachment={attContract}
                    montageId={montage.id}
                    userRoles={roles}
                />
                <DocumentSlot 
                    title="Faktura Proforma" 
                    description="Wymagana do akceptacji oferty."
                    existingDocument={docProforma}
                    existingAttachment={attProforma}
                    uploadAction={<div className="w-full"><UploadMontageProformaDialog montageId={montage.id} /></div>}
                    montageId={montage.id}
                    userRoles={roles}
                />
                <DocumentSlot 
                    title="Faktura Zaliczkowa" 
                    description="Wymagana do statusu 'Zaliczka Opłacona'."
                    existingDocument={docAdvance}
                    existingAttachment={attAdvance}
                    uploadAction={<div className="w-full"><UploadMontageAdvanceInvoiceDialog montageId={montage.id} /></div>}
                    montageId={montage.id}
                    userRoles={roles}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentSlot 
                    title="Protokół Odbioru" 
                    description="Potwierdzenie wykonania prac."
                    missingLabel="Wygeneruj protokół w zakładce Oferty lub wgraj w galerii."
                    existingAttachment={attProtocol}
                    montageId={montage.id}
                    userRoles={roles}
                />
                <DocumentSlot 
                    title="Faktura Końcowa" 
                    description="Wymagana do zakończenia montażu."
                    existingDocument={docFinal}
                    existingAttachment={attFinal}
                    uploadAction={<div className="w-full"><UploadMontageFinalInvoiceDialog montageId={montage.id} /></div>}
                    montageId={montage.id}
                    userRoles={roles}
                />
            </div>
             {/* Extra slot for corrections if any exist */}
            {docCorrection && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <DocumentSlot 
                        title="Korekta" 
                        description="Korekta faktury."
                        existingDocument={docCorrection}
                        montageId={montage.id}
                        userRoles={roles}
                    />
                 </div>
            )}
            
            <div className="flex justify-end">
                <UploadMontageCorrectionDialog montageId={montage.id} />
            </div>
        </div>
    );
}
