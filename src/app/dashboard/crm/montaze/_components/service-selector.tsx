'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getServices } from '@/app/dashboard/settings/services/actions';
import { 
    getMontageServices, 
    addMontageService, 
    removeMontageService, 
    updateMontageServiceQuantity 
} from '../actions-services';
import { cn } from '@/lib/utils';

// Temporary type definitions if not available from schema directly
type ServiceType = {
    id: string;
    name: string;
    unit: string;
    basePriceNet: number | null;
    vatRate: number | null;
};

type MontageServiceItemType = {
    id: string;
    serviceId: string;
    quantity: number;
    snapshotName: string | null;
    service: ServiceType;
};

interface ServiceSelectorProps {
    montageId: string;
    floorArea: number;
    isReadOnly?: boolean;
}

export function ServiceSelector({ 
    montageId, 
    floorArea, 
    isReadOnly = false 
}: ServiceSelectorProps) {
    const [services, setServices] = useState<ServiceType[]>([]);
    const [addedServices, setAddedServices] = useState<MontageServiceItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // New service form state
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [allServices, currentItems] = await Promise.all([
                    getServices(),
                    getMontageServices(montageId)
                ]);
                setServices(allServices as ServiceType[]);
                setAddedServices(currentItems as unknown as MontageServiceItemType[]);
            } catch (error) {
                console.error(error);
                toast.error('Nie udało się pobrać listy usług');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [montageId]);

    const handleServiceSelect = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        const service = services.find(s => s.id === serviceId);
        if (service) {
            // Heuristic: Auto-fill quantity based on unit
            if (service.unit === 'm2') {
                setQuantity(floorArea ? floorArea.toString() : '');
            } else {
                setQuantity('1');
            }
        }
    };

    const handleAddService = () => {
        if (!selectedServiceId || !quantity) return;

        const qty = parseFloat(quantity.replace(',', '.'));
        if (isNaN(qty) || qty <= 0) {
            toast.error('Podaj poprawną ilość');
            return;
        }

        startTransition(async () => {
            try {
                await addMontageService(montageId, selectedServiceId, qty);
                // Refresh list
                const items = await getMontageServices(montageId);
                setAddedServices(items as unknown as MontageServiceItemType[]);
                
                // Reset form
                setSelectedServiceId('');
                setQuantity('');
                toast.success('Dodano usługę');
            } catch (error) {
                toast.error('Błąd podczas dodawania usługi');
            }
        });
    };

    const handleRemoveService = (itemId: string) => {
        startTransition(async () => {
            try {
                await removeMontageService(itemId, montageId);
                setAddedServices(prev => prev.filter(item => item.id !== itemId));
                toast.success('Usunięto usługę');
            } catch (error) {
                toast.error('Błąd usuwania');
            }
        });
    };

    if (loading) {
        return <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    🛠️ Usługi Dodatkowe
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* List of added services */}
                {addedServices.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Nazwa usługi</TableHead>
                                    <TableHead className="w-[100px] text-right">Ilość</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {addedServices.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.snapshotName || item.service.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.quantity} {item.service.unit}
                                        </TableCell>
                                        <TableCell>
                                            {!isReadOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveService(item.id)}
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                        Brak dodanych usług. Wybierz usługi z listy poniżej.
                    </div>
                )}

                {/* Add new service form */}
                {!isReadOnly && (
                    <div className="flex gap-2 items-end pt-2 border-t">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Wybierz usługę</Label>
                            <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz z katalogu..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map((service) => (
                                        <SelectItem key={service.id} value={service.id}>
                                            {service.name} ({service.unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[100px] space-y-1">
                            <Label className="text-xs">Ilość</Label>
                            <Input 
                                type="number" 
                                value={quantity} 
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <Button onClick={handleAddService} disabled={isPending || !selectedServiceId}>
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
