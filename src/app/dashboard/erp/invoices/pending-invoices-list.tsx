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
import { FileText, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PendingInvoiceItem {
    id: string;
    label: string;
    completed: boolean;
    attachment: {
        url: string;
        title: string | null;
    } | null;
    montage: {
        id: string;
        clientName: string;
        displayId: string | null;
        status: string;
    } | null;
}

interface PendingInvoicesListProps {
  data: PendingInvoiceItem[];
}

export function PendingInvoicesList({ data }: PendingInvoicesListProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planowane Faktury (z Montaży)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Montaż</TableHead>
              <TableHead>Etap / Dokument</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Załącznik</TableHead>
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
                <TableCell>{item.label}</TableCell>
                <TableCell>
                  <Badge variant={item.completed ? 'default' : 'outline'} className={cn(item.completed ? "bg-green-600 hover:bg-green-700" : "text-muted-foreground")}>
                    {item.completed ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Wystawiona</span>
                    ) : (
                        <span className="flex items-center gap-1"><Circle className="h-3 w-3" /> Oczekująca</span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.attachment ? (
                    <a 
                        href={item.attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        <FileText className="h-4 w-4" />
                        {item.attachment.title || 'Plik'}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                    {item.montage && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/crm/montaze/${item.montage.id}?tab=workflow`}>
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
