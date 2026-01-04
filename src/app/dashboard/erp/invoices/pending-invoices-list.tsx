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
import { FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface InvoiceAttachment {
    id: string;
    type: string;
    url: string;
    title: string | null;
    createdAt: Date | null;
    montage: {
        id: string;
        clientName: string;
        displayId: string | null;
        status: string;
    } | null;
}

interface PendingInvoicesListProps {
  data: InvoiceAttachment[];
}

export function PendingInvoicesList({ data }: PendingInvoicesListProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ostatnio wgrane faktury (z Montaży)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Montaż</TableHead>
              <TableHead>Typ Dokumentu</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plik</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{item.montage?.clientName}</span>
                        <span className="text-xs text-muted-foreground">{item.montage?.displayId || 'Brak ID'}</span>
                    </div>
                </TableCell>
                <TableCell>
                    {item.type === 'proforma' ? 'Proforma' : 
                     item.type === 'invoice_advance' ? 'Faktura Zaliczkowa' : 
                     item.type === 'invoice_final' ? 'Faktura Końcowa' : item.type}
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Wgrano</span>
                  </Badge>
                </TableCell>
                <TableCell>
                    <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        <FileText className="h-4 w-4" />
                        {item.title || 'Plik'}
                    </a>
                </TableCell>
                <TableCell className="text-right">
                    {item.montage && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/crm/montaze/${item.montage.id}?tab=gallery`}>
                                Przejdź <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
