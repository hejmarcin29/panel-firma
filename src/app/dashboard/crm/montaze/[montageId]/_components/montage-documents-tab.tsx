'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileIcon, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { deleteDocument } from '../document-actions';
import { 
    UploadMontageProformaDialog, 
    UploadMontageFinalInvoiceDialog, 
    UploadMontageAdvanceInvoiceDialog, 
    UploadMontageCorrectionDialog 
} from './document-dialogs';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

// Types adapted from valid document types
type DocumentType = 'proforma' | 'advance_invoice' | 'final_invoice' | 'correction_invoice';

const TYPE_LABELS: Record<string, string> = {
    'proforma': 'Proforma',
    'advance_invoice': 'Faktura Zaliczkowa',
    'final_invoice': 'Faktura Końcowa',
    'correction_invoice': 'Korekta',
};

interface MontageDocumentsTabProps {
    montageId: string;
    documents: any[]; // We use loose typing or infer it in parent
}

export function MontageDocumentsTab({ montageId, documents = [] }: MontageDocumentsTabProps) {

    const handleDelete = async (docId: string) => {
        if (!confirm('Czy na pewno usunąć dokument?')) return;
        try {
            await deleteDocument(docId, montageId);
            toast.success('Dokument usunięty');
        } catch (e) {
            console.error(e);
            toast.error('Błąd usuwania');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                   <CardTitle>Dokumenty Księgowe (Rejestr)</CardTitle>
                   <CardDescription>Oficjalne faktury i proformy z wFirmy.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                    <UploadMontageProformaDialog montageId={montageId} />
                    <UploadMontageAdvanceInvoiceDialog montageId={montageId} />
                    <UploadMontageFinalInvoiceDialog montageId={montageId} />
                    <UploadMontageCorrectionDialog montageId={montageId} />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Typ</TableHead>
                            <TableHead>Numer (wFirma)</TableHead>
                            <TableHead>Data utworzenia</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Brak wgranych dokumentów. Użyj przycisków powyżej, aby dodać fakturę z wFirmy.
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileIcon className="h-4 w-4 text-blue-500" />
                                            {TYPE_LABELS[doc.type] || doc.type}
                                        </div>
                                    </TableCell>
                                    <TableCell>{doc.number}</TableCell>
                                    <TableCell>{doc.createdAt ? format(new Date(doc.createdAt), 'PPP', { locale: pl }) : '-'}</TableCell>
                                    <TableCell>{doc.status || 'Wystawiony'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {doc.pdfUrl && (
                                                <Button size="icon" variant="ghost" asChild title="Podgląd PDF">
                                                    <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(doc.id)} title="Usuń z rejestru">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
