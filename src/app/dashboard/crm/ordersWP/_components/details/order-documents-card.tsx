import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import type { OrderDocument } from '../../data';
import { formatDate } from './utils';

interface OrderDocumentsCardProps {
  documents: OrderDocument[];
}

export function OrderDocumentsCard({ documents }: OrderDocumentsCardProps) {
  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="px-6 py-4 bg-muted/10 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">Dokumenty finansowe</CardTitle>
        <span className="text-xs text-muted-foreground bg-background border px-2 py-0.5 rounded-full">
            {documents.length}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {documents.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Brak wystawionych dokumentów.</p>
           </div>
        ) : (
           <div className="divide-y divide-border/50">
               {documents.map((doc) => (
                   <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors group">
                       <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                <FileText className="h-5 w-5" />
                           </div>
                           <div className="flex flex-col gap-0.5">
                               <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm capitalize">
                                        {doc.type === 'invoice' ? 'Faktura VAT' : doc.type === 'proforma' ? 'Proforma' : doc.type}
                                    </span>
                                    {doc.status === 'paid' && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-50 text-green-700 hover:bg-green-100 gap-1 border-green-200">
                                            <CheckCircle2 className="h-3 w-3" /> Opłacona
                                        </Badge>
                                    )}
                                    {doc.status !== 'paid' && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-orange-700 bg-orange-50 border-orange-200 gap-1">
                                            <AlertCircle className="h-3 w-3" /> {doc.status}
                                        </Badge>
                                    )}
                               </div>
                               <span className="text-xs text-muted-foreground">
                                   {doc.number ?? 'Brak numeru'} • {doc.issueDate ? formatDate(doc.issueDate) : '—'}
                               </span>
                           </div>
                       </div>
                       
                       {doc.pdfUrl ? (
                           <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                               <Link href={doc.pdfUrl} target="_blank" title="Pobierz PDF">
                                    <Download className="h-4 w-4" />
                               </Link>
                           </Button>
                       ) : (
                           <span className="text-[10px] text-muted-foreground italic px-2">Brak pliku</span>
                       )}
                   </div>
               ))}
           </div>
        )}
      </CardContent>
    </Card>
  );
}
