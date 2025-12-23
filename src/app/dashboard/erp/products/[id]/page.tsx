import { notFound } from "next/navigation";
import { getProductDetails, getSuppliersList } from "../actions";
import { ProductPrices } from "../_components/product-prices";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

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
                        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                        <Badge variant={product.type === 'service' ? 'secondary' : 'outline'}>
                            {product.type === 'service' ? 'Usługa' : 'Towar'}
                        </Badge>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'Aktywny' : 'Archiwum'}
                        </Badge>
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
                                        {product.attributes.map((attr: any) => (
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
