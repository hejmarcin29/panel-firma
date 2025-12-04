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
import { WooCommerceProduct, WooCommerceCategory, WooCommerceAttributeTerm } from './actions';
import { ProductControlBar } from '@/components/shop/product-control-bar';
import { FilterModal } from '@/components/shop/filter-modal';

interface ProductsListClientProps {
    initialProducts: WooCommerceProduct[];
    initialTotal: number;
    initialTotalPages: number;
    currentPage: number;
    categories: WooCommerceCategory[];
    brandTerms: WooCommerceAttributeTerm[];
}

export function ProductsListClient({ 
    initialProducts, 
    initialTotal, 
    initialTotalPages,
    currentPage,
    categories,
    brandTerms
}: ProductsListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > initialTotalPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/dashboard/products?${params.toString()}`);
    };

    // Prepare aggregations for FilterModal
    const aggregations = {
        categories: categories.map(c => ({ name: c.name, slug: c.id.toString(), count: c.count })),
        brands: brandTerms.map(b => ({ name: b.name, slug: b.id.toString(), count: b.count })),
        // Other attributes would go here if fetched
    };

    return (
        <div className="space-y-4">
            <ProductControlBar 
                totalProducts={initialTotal} 
                onOpenFilters={() => setIsFilterOpen(true)} 
            />

            <FilterModal 
                isOpen={isFilterOpen} 
                onClose={() => setIsFilterOpen(false)} 
                availableOptions={aggregations}
                totalProducts={initialTotal}
            />

            <div className="flex items-center justify-between px-2">
                 <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                    {showDebug ? 'Ukryj Debug' : 'Debug'}
                </Button>
            </div>

            {showDebug && (
                <Card>
                    <CardHeader>
                        <CardTitle>Debug Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs overflow-auto max-h-40">
                            {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-20">Obraz</TableHead>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Cena</TableHead>
                            <TableHead>Stan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Brak produktów spełniających kryteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        {product.images && product.images[0] ? (
                                            <div className="relative h-12 w-12 rounded overflow-hidden">
                                                <Image 
                                                    src={product.images[0].src} 
                                                    alt={product.images[0].alt || product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                                Brak
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{product.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {product.categories.map(c => c.name).join(', ')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{product.sku || '-'}</TableCell>
                                    <TableCell>
                                        <div dangerouslySetInnerHTML={{ __html: product.price_html }} />
                                    </TableCell>
                                    <TableCell>
                                        {product.manage_stock ? (
                                            <span>{product.stock_quantity} szt.</span>
                                        ) : (
                                            <span className={product.stock_status === 'instock' ? 'text-green-600' : 'text-red-600'}>
                                                {product.stock_status === 'instock' ? 'Dostępny' : 'Brak'}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'publish' ? 'default' : 'secondary'}>
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={product.permalink} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
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
                <div className="flex items-center justify-center space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
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
                        disabled={currentPage >= initialTotalPages}
                    >
                        Następna
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
