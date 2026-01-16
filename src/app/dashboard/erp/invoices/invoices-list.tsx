'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FileText, Calendar, CreditCard, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { deleteDocument } from '../../document-actions';

interface Invoice {
  id: string;
  number: string | null;
  type: string;
  status: string;
  issueDate: Date | null;
  grossAmount: number | null;
  pdfUrl: string | null;
}

interface InvoicesListProps {
  data: Invoice[];
  isAdmin: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function InvoicesList({ data, isAdmin }: InvoicesListProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Brak faktur.
        </CardContent>
      </Card>
    );
  }

  const handleDeleteDocument = async (docId: string) => {
    try {
        await deleteDocument(docId, '/dashboard/erp/invoices');
        toast.success('Dokument usunięty');
    } catch (error) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const msg = (error as any)?.message || 'Błąd usuwania';
       toast.error(msg);
    }
};

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Ostatnie dokumenty</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numer</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data wystawienia</TableHead>
                <TableHead className="text-right">Kwota Brutto</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number || '-'}</TableCell>
                  <TableCell>
                    {invoice.type === 'proforma' ? 'Proforma' : 
                     invoice.type === 'final_invoice' ? 'Faktura Końcowa' : 
                     invoice.type === 'advance_invoice' ? 'Faktura Zaliczkowa' : invoice.type}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'issued' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="text-right">
                    {invoice.grossAmount ? (invoice.grossAmount / 100).toFixed(2) + ' PLN' : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        {invoice.pdfUrl && (
                        <Button variant="ghost" size="sm" asChild>
                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                            </a>
                        </Button>
                        )}

                        {isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Czy na pewno usunąć dokument?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Usuwasz dokument: <b>{invoice.number}</b>.<br/>
                                            Ta operacja jest nieodwracalna. Będzie wymagane ponowne wgranie dokumentu.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteDocument(invoice.id)} className="bg-red-600 hover:bg-red-700">
                                            Usuń
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {data.map((invoice) => (
          <motion.div key={invoice.id} variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span>{invoice.number || 'Brak numeru'}</span>
                  <Badge variant={invoice.status === 'issued' ? 'default' : 'secondary'}>
                    {invoice.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {invoice.type === 'proforma' ? 'Proforma' : 
                     invoice.type === 'final_invoice' ? 'Faktura Końcowa' : 
                     invoice.type === 'advance_invoice' ? 'Faktura Zaliczkowa' : invoice.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">
                      {invoice.grossAmount ? (invoice.grossAmount / 100).toFixed(2) + ' PLN' : '-'}
                    </span>
                  </div>
                  {invoice.pdfUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
