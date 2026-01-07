import { notFound } from "next/navigation";
import { getProductDetails, getSuppliersList } from "../actions";
import { ProductPrices } from "../_components/product-prices";
import { ProductSyncToggle } from "../_components/product-sync-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

const formatPrice = (price?: string | null) => {
    if (!price) return "-";
    const val = parseFloat(price);
    if (isNaN(val)) return "-";
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(val);
};

export default async function ProductDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const [product, suppliers] = await Promise.all([
        getProductDetails(id),
        getSuppliersList()
    ]);

    if (!product) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/erp/products">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        {product.imageUrl && (
                            <div className="h-16 w-16 relative overflow-hidden rounded-md border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="h-full w-full object-cover" 
                                />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                        <Badge variant={product.type === 'service' ? 'secondary' : 'outline'}>
                            {product.type === 'service' ? 'Usługa' : 'Towar'}
                        </Badge>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'Aktywny' : 'Archiwum'}
                        </Badge>
                        <ProductSyncToggle 
                            productId={product.id} 
                            initialIsSyncEnabled={product.isSyncEnabled ?? false} 
                            source={product.source ?? 'local'} 
                        />
                    </div>
                    <p className="text-muted-foreground mt-1">
                        SKU: <span className="font-mono text-foreground">{product.sku}</span>
                        {product.category && ` • Kategoria: ${product.category.name}`}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

                <Card>
                    <CardHeader>
                        <CardTitle>Szczegóły Produktu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Cena sprzedaży:</span>
                                <div className="flex flex-col">
                                     {product.salePrice ? (
                                        <>
                                            <span className="font-bold text-red-600 text-lg">{formatPrice(product.salePrice)}</span>
                                            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.regularPrice || product.price)}</span>
                                        </>
                                     ) : (
                                        <span className="font-medium text-lg">{formatPrice(product.price)}</span>
                                     )}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Czas realizacji:</span>
                                <div className="font-medium text-blue-600">{product.leadTime || "Nie określono"}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Jednostka:</span>
                                <div className="font-medium">{product.unit}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Wymiary (D x S x W):</span>
                                <div className="font-medium">
                                    {product.length || '-'} x {product.width || '-'} x {product.height || '-'} cm
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Waga:</span>
                                <div className="font-medium">{product.weight ? `${product.weight} kg` : '-'}</div>
                            </div>
                        </div>
                        
                        {product.description && (
                            <>
                                <Separator />
                                <div>
                                    <span className="text-muted-foreground text-sm">Opis:</span>
                                    <p className="mt-1 text-sm">{product.description}</p>
                                </div>
                            </>
                        )}

                        {product.attributes && product.attributes.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <span className="text-muted-foreground text-sm block mb-2">Atrybuty:</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {product.attributes.map((attr) => (
                                            <div key={attr.id} className="text-sm border rounded px-2 py-1 bg-muted/30">
                                                <span className="text-muted-foreground text-xs block">{attr.attribute.name}</span>
                                                <span className="font-medium">
                                                    {attr.option ? attr.option.value : attr.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Zakupy i Dostawcy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProductPrices 
                            productId={product.id} 
                            prices={product.purchasePrices} 
                            suppliers={suppliers}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
