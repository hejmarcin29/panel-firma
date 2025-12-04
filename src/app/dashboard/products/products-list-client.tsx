'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { WooCommerceProduct } from './actions';

interface ProductsListClientProps {
    initialProducts: WooCommerceProduct[];
    initialTotal: number;
    initialTotalPages: number;
    currentPage: number;
}

export function ProductsListClient({ 
    initialProducts, 
    initialTotal, 
    initialTotalPages,
    currentPage 
}: ProductsListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > initialTotalPages) return;
        setIsLoading(true);
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`/dashboard/products?${params.toString()}`);
        setIsLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Produkty ({initialTotal})</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista produktów</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Obraz</TableHead>
                                    <TableHead>Nazwa</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Atrybuty</TableHead>
                                    <TableHead>Cena</TableHead>
                                    <TableHead>Stan magazynowy</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            Brak produktów. Sprawdź konfigurację WooCommerce.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    initialProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                {product.images && product.images[0] ? (
                                                    <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                                                        <Image
                                                            src={product.images[0].src}
                                                            alt={product.images[0].alt || product.name}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                        Brak
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell>{product.sku || '-'}</TableCell>
                                            <TableCell>
                                                {product.attributes && product.attributes.length > 0 ? (
                                                    <div className="flex flex-col gap-1 max-w-[200px]">
                                                        {product.attributes.map((attr) => (
                                                            <div key={attr.id} className="text-xs">
                                                                <span className="font-semibold">{attr.name}: </span>
                                                                <span className="text-muted-foreground break-all">{attr.options.join(', ')}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div dangerouslySetInnerHTML={{ __html: product.price_html }} />
                                            </TableCell>
                                            <TableCell>
                                                {product.manage_stock ? (
                                                    <span>{product.stock_quantity} szt.</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Niezarządzany</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={product.status === 'publish' ? 'default' : 'secondary'}>
                                                    {product.status === 'publish' ? 'Opublikowany' : product.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a href={product.permalink} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                        <span className="sr-only">Zobacz w sklepie</span>
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {initialTotalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Poprzednia
                            </Button>
                            <div className="text-sm font-medium">
                                Strona {currentPage} z {initialTotalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= initialTotalPages || isLoading}
                            >
                                Następna
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
