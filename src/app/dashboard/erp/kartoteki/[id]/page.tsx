import { getProduct } from '../actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Barcode, DollarSign, Layers, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductDetailsPage({ params }: PageProps) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
        notFound();
    }

    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    interface ProductAttribute {
        name: string;
        options: string | string[];
    }

    let attributes: ProductAttribute[] = [];
    try {
        if (typeof product.attributes === 'string') {
            attributes = JSON.parse(product.attributes);
        } else if (Array.isArray(product.attributes)) {
            attributes = product.attributes as unknown as ProductAttribute[];
        }
    } catch (e) {
        console.error('Error parsing attributes:', e);
    }

    // const categories = product.categories ? JSON.parse(product.categories as string) : [];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/erp/kartoteki">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                        <Badge variant={product.source === 'local' ? 'default' : 'secondary'}>
                            {product.source === 'local' ? 'Lokalny' : 'WooCommerce'}
                        </Badge>
                        <Badge variant={product.stockQuantity && product.stockQuantity > 0 ? 'outline' : 'destructive'}>
                            {product.stockQuantity && product.stockQuantity > 0 ? 'Dostępny' : 'Brak stanu'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                        <Barcode className="h-3 w-3" /> SKU: {product.sku || 'Brak'}
                        <span className="text-zinc-300">|</span>
                        ID: {product.id}
                    </p>
                </div>
                <Button>Edytuj</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image & Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informacje podstawowe</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-6">
                                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden border relative">
                                    {product.imageUrl ? (
                                        <Image 
                                            src={product.imageUrl} 
                                            alt={product.name} 
                                            fill 
                                            className="object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                    )}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h3 className="font-medium mb-1">Opis</h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {product.description || 'Brak opisu wewnętrznego.'}
                                        </p>
                                    </div>
                                    {product.source === 'woocommerce' && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-sm rounded-md border border-blue-100 dark:border-blue-900">
                                            Ten produkt jest synchronizowany ze sklepem. Zmiany w opisie marketingowym (HTML) nie są tu wyświetlane.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attributes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5" /> Atrybuty i Cechy
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {attributes.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {attributes.map((attr, index) => (
                                        <div key={index} className="p-3 border rounded-md bg-muted/20">
                                            <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                                                {attr.name}
                                            </div>
                                            <div className="font-medium">
                                                {Array.isArray(attr.options) ? attr.options.join(', ') : attr.options}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Brak zdefiniowanych atrybutów.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - ERP Data */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" /> Dane Finansowe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Cena Zakupu (Netto)</span>
                                <span className="font-bold text-lg">
                                    {product.purchasePrice ? formatCurrency(product.purchasePrice / 100) : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Stawka VAT</span>
                                <span className="font-medium">{product.vatRate}%</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Cena Sprzedaży (Brutto)</span>
                                <span className="font-medium">
                                    {product.price ? `${product.price} PLN` : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-muted-foreground">Marża (szacunkowa)</span>
                                <Badge variant="outline">Oblicz...</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" /> Magazyn
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Stan magazynowy</span>
                                <span className="font-bold text-2xl">
                                    {product.stockQuantity || 0} <span className="text-sm font-normal text-muted-foreground">{product.unit || 'szt'}</span>
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={product.stockStatus === 'instock' ? 'default' : 'destructive'}>
                                    {product.stockStatus === 'instock' ? 'Dostępny' : 'Brak'}
                                </Badge>
                            </div>
                            <Button className="w-full" variant="outline">
                                Korekta Stanu
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
