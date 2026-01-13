import { db } from '@/lib/db';
import { ProductRow } from './_components/ProductRow';

export default async function ShopOfferPage() {
    const products = await db.query.erpProducts.findMany({
        orderBy: (products, { asc }) => [asc(products.name)],
        columns: {
            id: true,
            name: true,
            sku: true,
            isShopVisible: true,
            isPurchasable: true,
            isSampleAvailable: true,
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Zarządzanie Ofertą Sklepu</h3>
                <p className="text-sm text-muted-foreground">
                    Szybkie włączanie i wyłączanie produktów w modułach sprzedażowych.
                </p>
            </div>

            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nazwa Produktu</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SKU</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Widoczność</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Sprzedaż</th>
                                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Próbki</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {products.map((product) => (
                                <ProductRow key={product.id} product={product} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
