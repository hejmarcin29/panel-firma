'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Package, FileText, Truck, CheckCircle, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { markAsPaid, updateShippingInfo } from '../actions';
import { UploadProformaDialog } from './UploadProformaDialog';
import { toast } from 'sonner';

// Define strict type based on what we fetch
type ShopOrder = {
    id: string;
    sourceOrderId: string | null;
    createdAt: Date;
    status: string;
    type: string;
    totalGross: number; // in grosz
    paymentMethod: string | null;
    customer: {
        name: string;
        email: string | null;
    } | null;
    shippingCarrier: string | null;
    shippingTrackingNumber: string | null;
};

export function ShopOrdersList({ orders }: { orders: ShopOrder[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter logic
    const filteredOrders = orders.filter(order => {
        const search = searchTerm.toLowerCase();
        return (
            order.sourceOrderId?.toLowerCase().includes(search) ||
            order.customer?.name.toLowerCase().includes(search) ||
            order.customer?.email?.toLowerCase().includes(search) ||
            order.id.toLowerCase().includes(search)
        );
    });

    const sampleOrders = filteredOrders.filter(o => o.type === 'sample');
    const floorOrders = filteredOrders.filter(o => o.type === 'production' || o.type === 'floor'); // 'floor' just in case

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Szukaj zamówienia..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="all">Wszystkie ({filteredOrders.length})</TabsTrigger>
                    <TabsTrigger value="samples">Próbki ({sampleOrders.length})</TabsTrigger>
                    <TabsTrigger value="floors">Podłogi ({floorOrders.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <OrdersTable orders={filteredOrders} />
                </TabsContent>
                <TabsContent value="samples" className="mt-4">
                    <OrdersTable orders={sampleOrders} variant="samples" />
                </TabsContent>
                <TabsContent value="floors" className="mt-4">
                    <OrdersTable orders={floorOrders} variant="floors" />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function OrdersTable({ orders, variant = 'default' }: { orders: ShopOrder[], variant?: 'default' | 'samples' | 'floors' }) {
    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20">
                <div className="rounded-full bg-muted p-3 mb-4">
                    <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">Brak zamówień</h3>
                <p className="text-sm text-muted-foreground">Nie znaleziono zamówień spełniających kryteria.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[140px]">Nr Zamówienia</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Klient</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Kwota</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {orders.map((order) => (
                            <OrderRow key={order.id} order={order} variant={variant} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function OrderRow({ order, variant }: { order: ShopOrder, variant: string }) {
    const isSample = order.type === 'sample';
    const isPaid = order.status === 'order.paid' || order.status === 'order.fulfillment_confirmed';

    return (
        <tr className="border-b transition-colors hover:bg-muted/50">
            <td className="p-4 align-middle font-medium">
                <div className="flex flex-col">
                    <span className="text-base">{order.sourceOrderId || order.id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground uppercase">{order.paymentMethod}</span>
                </div>
            </td>
            <td className="p-4 align-middle">
                <div className="flex flex-col">
                    <span>{order.customer?.name}</span>
                    <span className="text-xs text-muted-foreground">{order.customer?.email}</span>
                </div>
            </td>
            <td className="p-4 align-middle">
                <StatusBadge status={order.status} />
                {order.shippingTrackingNumber && (
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {order.shippingCarrier}: {order.shippingTrackingNumber}
                    </div>
                )}
            </td>
            <td className="p-4 align-middle text-muted-foreground">
                {format(order.createdAt, 'dd MMM yyyy', { locale: pl })}
                <div className="text-xs">{format(order.createdAt, 'HH:mm', { locale: pl })}</div>
            </td>
            <td className="p-4 align-middle text-right font-medium">
                {(order.totalGross / 100).toFixed(2)} PLN
            </td>
            <td className="p-4 align-middle text-right">
                <div className="flex justify-end gap-2">
                    {/* Actions based on Workflow */}
                    
                    {/* SAMPLE WORKFLOW */}
                    {isSample && (
                        <>
                            {order.status === 'order.paid' && (
                                <ShippingDialog orderId={order.id} />
                            )}
                            {order.status === 'order.received' && order.paymentMethod !== 'tpay' && (
                                <Button size="sm" variant="outline" onClick={() => markAsPaid(order.id)}>
                                    Oznacz jako opłacone
                                </Button>
                            )}
                        </>
                    )}

                    {/* FLOOR WORKFLOW */}
                    {!isSample && (
                        <>
                             {order.status === 'order.pending_proforma' || order.status === 'order.received' ? (
                                <UploadProformaDialog orderId={order.id} />
                            ) : null}
                        </>
                    )}

                    <Link href={`/dashboard/shop/orders/${order.id}`}>
                        <Button size="icon" variant="ghost">
                            <Search className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </td>
        </tr>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'order.received': 'bg-slate-100 text-slate-800 border-slate-200',
        'order.pending_proforma': 'bg-orange-100 text-orange-800 border-orange-200',
        'order.proforma_issued': 'bg-blue-100 text-blue-800 border-blue-200',
        'order.awaiting_payment': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'order.paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'order.fulfillment_confirmed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'order.cancelled': 'bg-red-100 text-red-800 border-red-200',
    };

    const labels: Record<string, string> = {
        'order.received': 'Nowe',
        'order.pending_proforma': 'Czeka na Proformę',
        'order.proforma_issued': 'Proforma Wysłana',
        'order.awaiting_payment': 'Czeka na płatność',
        'order.paid': 'Opłacone',
        'order.fulfillment_confirmed': 'Wysłane',
        'order.cancelled': 'Anulowane',
    };

    const style = styles[status] || 'bg-gray-100 text-gray-800';
    const label = labels[status] || status;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
            {label}
        </span>
    );
}

function ShippingDialog({ orderId }: { orderId: string }) {
    const [open, setOpen] = useState(false);
    const [carrier, setCarrier] = useState('inpost');
    const [tracking, setTracking] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await updateShippingInfo(orderId, carrier, tracking);
            toast.success('Zapisano dane wysyłki');
            setOpen(false);
        } catch (e) {
            toast.error('Błąd zapisu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                    <Truck className="h-4 w-4 mr-2" />
                    Wysyłka
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Wprowadź dane wysyłki</DialogTitle>
                    <DialogDescription>
                        Uzupełnij numer listu przewozowego aby zmienić status na &quot;Wysłane&quot;.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="carrier" className="text-sm font-medium">Przewoźnik</label>
                        <Select value={carrier} onValueChange={setCarrier}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inpost">InPost</SelectItem>
                                <SelectItem value="dpd">DPD</SelectItem>
                                <SelectItem value="dhl">DHL</SelectItem>
                                <SelectItem value="poczta">Poczta Polska</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="tracking" className="text-sm font-medium">Numer przesyłki</label>
                        <Input 
                            id="tracking" 
                            value={tracking} 
                            onChange={(e) => setTracking(e.target.value)} 
                            placeholder="np. 6800..." 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
                    <Button onClick={handleSubmit} disabled={loading || !tracking}>
                        {loading ? 'Zapisywanie...' : 'Zapisz i Wyślij'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

