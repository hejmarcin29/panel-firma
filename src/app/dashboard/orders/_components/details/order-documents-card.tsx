import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrderDocument } from '../../data';
import { formatDate } from './utils';

interface OrderDocumentsCardProps {
  documents: OrderDocument[];
}

export function OrderDocumentsCard({ documents }: OrderDocumentsCardProps) {
  if (documents.length === 0) {
    return (
        <Card>
            <CardHeader className="px-4 py-3">
                <CardTitle className="text-base">Dokumenty</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
                <p className="text-xs text-muted-foreground">Brak wystawionych dokumentów.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base">Dokumenty</CardTitle>
        <CardDescription className="text-xs">Faktury i proformy.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {/* Mobile */}
        <div className="space-y-3 md:hidden">
            {documents.map((document) => (
                <div key={document.id} className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium capitalize text-foreground">{document.type}</p>
                        <Badge variant="outline" className="px-2 py-0 text-[10px]">
                            {document.status}
                        </Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                        <div className="space-y-1">
                            <dt className="text-muted-foreground">Numer</dt>
                            <dd className="font-semibold text-foreground">{document.number ?? '—'}</dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-muted-foreground">Data</dt>
                            <dd className="font-semibold text-foreground">
                                {document.issueDate ? formatDate(document.issueDate) : '—'}
                            </dd>
                        </div>
                    </dl>
                    <div className="mt-3">
                        {document.pdfUrl ? (
                            <Button asChild size="sm" variant="outline" className="h-8 w-full px-3 text-xs">
                                <Link href={document.pdfUrl} target="_blank" rel="noreferrer">
                                    Pobierz PDF
                                </Link>
                            </Button>
                        ) : (
                            <span className="text-[10px] text-muted-foreground">Brak pliku</span>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="py-2 text-[11px]">Typ</TableHead>
                        <TableHead className="py-2 text-[11px]">Numer</TableHead>
                        <TableHead className="py-2 text-[11px]">Status</TableHead>
                        <TableHead className="py-2 text-[11px]">Data</TableHead>
                        <TableHead className="py-2 text-right text-[11px]">Akcje</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((document) => (
                        <TableRow key={document.id}>
                            <TableCell className="py-2 text-xs font-medium capitalize">{document.type}</TableCell>
                            <TableCell className="py-2 text-xs">{document.number ?? '—'}</TableCell>
                            <TableCell className="py-2 text-xs">
                                <Badge variant="outline" className="px-2 py-0 text-[10px]">
                                    {document.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-xs">
                                {document.issueDate ? formatDate(document.issueDate) : '—'}
                            </TableCell>
                            <TableCell className="py-2 text-right text-xs">
                                {document.pdfUrl ? (
                                    <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                                        <Link href={document.pdfUrl} target="_blank" rel="noreferrer">
                                            Pobierz PDF
                                        </Link>
                                    </Button>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground">Brak pliku</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
