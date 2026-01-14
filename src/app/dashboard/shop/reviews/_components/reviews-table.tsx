'use client';

import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle, Star } from "lucide-react";
import { toggleReviewStatus, deleteReview } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Review {
    id: string;
    product: {
        name: string;
    } | null;
    authorName: string | null;
    rating: number;
    content: string | null;
    status: 'pending' | 'published' | 'rejected' | string;
    source: string;
    createdAt: Date;
    isVerified: boolean;
}

interface ReviewsTableProps {
    reviews: Review[];
}

export function ReviewsTable({ reviews }: ReviewsTableProps) {
    
    async function handleToggle(id: string, status: string) {
        try {
            await toggleReviewStatus(id, status);
            toast.success('Status zmieniony');
        } catch {
            toast.error('Błąd zmiany statusu');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Czy na pewno usunąć tę opinię?')) return;
        try {
            await deleteReview(id);
            toast.success('Opinia usunięta');
        } catch {
            toast.error('Błąd usuwania');
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produkt</TableHead>
                        <TableHead>Klient</TableHead>
                        <TableHead>Ocena</TableHead>
                        <TableHead>Treść</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviews.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Brak opinii w systemie. Dodaj pierwszą ręcznie!
                            </TableCell>
                        </TableRow>
                    )}
                    {reviews.map((review) => (
                        <TableRow key={review.id}>
                            <TableCell className="whitespace-nowrap">
                                {format(new Date(review.createdAt), 'dd MMM yyyy', { locale: pl })}
                            </TableCell>
                            <TableCell className="font-medium">
                                {review.product?.name || 'Produkt nieznany'}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{review.authorName}</span>
                                    {review.isVerified && (
                                        <Badge variant="outline" className="w-fit text-[10px] h-4 border-green-200 text-green-700 bg-green-50">
                                            Zweryfikowany
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center text-amber-500">
                                    <span className="font-bold mr-1">{review.rating}</span>
                                    <Star className="h-3 w-3 fill-current" />
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                                <p className="truncate text-sm text-muted-foreground" title={review.content || ''}>
                                    {review.content}
                                </p>
                            </TableCell>
                            <TableCell>
                                <Badge variant={review.status === 'published' ? 'default' : 'secondary'}>
                                    {review.status === 'published' ? 'Opublikowana' : 'Oczekująca'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleToggle(review.id, review.status)}
                                        title={review.status === 'published' ? "Ukryj" : "Opublikuj"}
                                    >
                                        {review.status === 'published' ? (
                                            <XCircle className="h-4 w-4 text-orange-500" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleDelete(review.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
