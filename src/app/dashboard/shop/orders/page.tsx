import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { UploadProformaDialog } from './_components/UploadProformaDialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export default async function ShopOrdersPage() {
    const shopOrders = await db.query.orders.findMany({
        where: eq(orders.source, 'shop'),
        orderBy: [desc(orders.createdAt)],
        with: {
            customer: true,
        }
    });

    return (
        <div className="space-y-6">
             <div>
                <h3 className="text-lg font-medium">Zamówienia Sklepowe</h3>
                <p className="text-sm text-muted-foreground">
                    Lista zamówień pochodzących ze sklepu online.
                </p>
            </div>

            <div className="rounded-md border">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b bg-muted/50">
                            <th className="h-12 px-4 text-left align-middle font-medium">ID / Data</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Klient</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Kwota</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Metoda</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th className="h-12 px-4 text-right align-middle font-medium">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shopOrders.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium">{order.id.slice(0, 8)}...</div>
                                    <div className="text-xs text-muted-foreground">
                                        {order.createdAt.toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {order.customer?.name} <br/>
                                    <span className="text-xs text-muted-foreground">{order.customer?.email}</span>
                                </td>
                                <td className="p-4">
                                    {((order.totalGross) / 100).toFixed(2)} PLN
                                </td>
                                <td className="p-4 capitalize">
                                    {order.paymentMethod === 'tpay' ? 'Tpay' : 'Proforma'}
                                </td>
                                <td className="p-4">
                                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                        order.status === 'order.paid' ? 'bg-emerald-100 text-emerald-800' :
                                        order.status === 'order.pending_proforma' ? 'bg-amber-100 text-amber-800' :
                                        'bg-slate-100 text-slate-800'
                                    }`}>
                                        {order.status}
                                    </div>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2 items-center">
                                    {order.status === 'order.pending_proforma' && (
                                        <UploadProformaDialog orderId={order.id} />
                                    )}
                                    <Link href={`/dashboard/shop/orders/${order.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
