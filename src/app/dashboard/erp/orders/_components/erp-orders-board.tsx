'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, CheckCircle2, AlertCircle, ArrowRight, Box } from "lucide-react";
import { toast } from "sonner";
import { createPurchaseOrder, receivePurchaseOrder, issueMaterialsToCrew } from '../actions';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface MontageToOrder {
    id: string;
    clientName: string;
    createdAt: Date;
    floorArea: number | null;
    quotes: {
        items: {
            name: string;
        }[];
    }[];
}

interface OrderInTransit {
    id: string;
    orderDate: Date | null;
    supplier: {
        name: string;
    } | null;
    items: {
        montage: {
            clientName: string;
        } | null;
    }[];
}

interface MontageReady {
    id: string;
    clientName: string;
    installationAddress: string | null;
    installer: {
        name: string | null;
    } | null;
}

interface Supplier {
    id: string;
    name: string;
}

interface ERPOrdersBoardProps {
    data: {
        toOrder: MontageToOrder[];
        inTransit: OrderInTransit[];
        ready: MontageReady[];
        suppliers: Supplier[];
    };
}

export function ERPOrdersBoard({ data }: ERPOrdersBoardProps) {
    const [selectedMontages, setSelectedMontages] = useState<string[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [isPending, startTransition] = useTransition();

    const handleToggleMontage = (id: string) => {
        setSelectedMontages(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleCreateOrder = () => {
        if (!selectedSupplier) {
            toast.error("Wybierz dostawcę");
            return;
        }
        if (selectedMontages.length === 0) {
            toast.error("Zaznacz co najmniej jeden montaż");
            return;
        }

        startTransition(async () => {
            try {
                const result = await createPurchaseOrder(selectedMontages, selectedSupplier);
                if (result.success) {
                    toast.success("Zamówienie utworzone!");
                    setSelectedMontages([]);
                    setSelectedSupplier('');
                } else {
                    toast.error("Błąd: " + result.error);
                }
            } catch {
                toast.error("Wystąpił błąd");
            }
        });
    };

    const handleReceiveOrder = (poId: string) => {
        startTransition(async () => {
            try {
                await receivePurchaseOrder(poId);
                toast.success("Dostawa przyjęta na stan!");
            } catch {
                toast.error("Wystąpił błąd");
            }
        });
    };

    const handleIssueMaterials = (montageId: string) => {
        startTransition(async () => {
            try {
                await issueMaterialsToCrew(montageId);
                toast.success("Materiały wydane ekipie!");
            } catch {
                toast.error("Wystąpił błąd");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            
            {/* KOLUMNA 1: ZAPOTRZEBOWANIE */}
            <Card className="flex flex-col h-full border-l-4 border-l-red-500 bg-slate-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Zapotrzebowanie
                        </CardTitle>
                        <Badge variant="secondary">{data.toOrder.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Zaliczka wpłacona, towar nie zamówiony.
                    </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="bg-white p-3 rounded-md border shadow-sm space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Wybierz Dostawcę:</label>
                            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Wybierz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button 
                            className="w-full" 
                            size="sm" 
                            disabled={selectedMontages.length === 0 || !selectedSupplier || isPending}
                            onClick={handleCreateOrder}
                        >
                            {isPending ? "Przetwarzanie..." : `Zamów zaznaczone (${selectedMontages.length})`}
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 -mx-4 px-4">
                        <div className="space-y-3 pb-4">
                            {data.toOrder.map((montage) => (
                                <div key={montage.id} className="bg-white p-3 rounded-md border shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <Checkbox 
                                            checked={selectedMontages.includes(montage.id)}
                                            onCheckedChange={() => handleToggleMontage(montage.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-sm">{montage.clientName}</span>
                                                <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {format(new Date(montage.createdAt), 'dd.MM')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {montage.quotes?.[0]?.items?.map((i) => i.name).join(', ') || "Brak szczegółów produktu"}
                                            </p>
                                            <div className="pt-1 flex gap-2">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {montage.floorArea} m²
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {data.toOrder.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Brak nowych zapotrzebowań 🎉
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* KOLUMNA 2: W DRODZE */}
            <Card className="flex flex-col h-full border-l-4 border-l-blue-500 bg-slate-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-500" />
                            W Drodze
                        </CardTitle>
                        <Badge variant="secondary">{data.inTransit.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Zamówione u dostawcy, czekamy na kuriera.
                    </p>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    <ScrollArea className="h-full -mx-4 px-4">
                        <div className="space-y-3 pb-4">
                            {data.inTransit.map((po) => (
                                <div key={po.id} className="bg-white p-3 rounded-md border shadow-sm hover:shadow-md transition-shadow space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-sm">{po.supplier?.name || "Nieznany dostawca"}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Zamówiono: {po.orderDate ? format(new Date(po.orderDate), 'dd.MM.yyyy', { locale: pl }) : '-'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px]">PO #{po.id.slice(0,4)}</Badge>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Zawiera materiały dla:</p>
                                        <ul className="text-xs space-y-1">
                                            {[...new Set(po.items.map((i) => i.montage?.clientName).filter(Boolean))].map((name, idx) => (
                                                <li key={idx} className="flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                                                    {name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <Button 
                                        className="w-full gap-2" 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleReceiveOrder(po.id)}
                                        disabled={isPending}
                                    >
                                        <Package className="w-3.5 h-3.5" />
                                        Przyjmij Dostawę
                                    </Button>
                                </div>
                            ))}
                             {data.inTransit.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Pusto w transporcie 🚚
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* KOLUMNA 3: DO WYDANIA */}
            <Card className="flex flex-col h-full border-l-4 border-l-emerald-500 bg-slate-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <Box className="w-4 h-4 text-emerald-500" />
                            Do Wydania
                        </CardTitle>
                        <Badge variant="secondary">{data.ready.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Na stanie. Gotowe dla ekipy.
                    </p>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    <ScrollArea className="h-full -mx-4 px-4">
                        <div className="space-y-3 pb-4">
                            {data.ready.map((montage) => (
                                <div key={montage.id} className="bg-white p-3 rounded-md border shadow-sm hover:shadow-md transition-shadow space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-sm">{montage.clientName}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {montage.installationAddress || "Brak adresu"}
                                            </p>
                                        </div>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>

                                    {montage.installer && (
                                        <div className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded flex items-center gap-1">
                                            Ekipa: {montage.installer.name}
                                        </div>
                                    )}

                                    <Button 
                                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                        size="sm"
                                        onClick={() => handleIssueMaterials(montage.id)}
                                        disabled={isPending}
                                    >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                        Wydaj Ekipie
                                    </Button>
                                </div>
                            ))}
                             {data.ready.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Magazyn pusty (wszystko wydane) ✅
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

        </div>
    );
}
