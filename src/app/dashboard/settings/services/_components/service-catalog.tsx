'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createService, updateService, deleteService } from '../actions';
import type { services } from '@/lib/db/schema';

type Service = typeof services.$inferSelect;

interface ServiceCatalogProps {
    services: Service[];
}

export function ServiceCatalog({ services }: ServiceCatalogProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            unit: formData.get('unit') as string,
            basePriceNet: parseFloat(formData.get('basePriceNet') as string),
            baseInstallerRate: 0, // Disabled base rate
            vatRate: parseFloat(formData.get('vatRate') as string) / 100,
        };

        try {
            if (editingService) {
                await updateService(editingService.id, data);
                toast.success('Usługa zaktualizowana');
            } else {
                await createService(data);
                toast.success('Usługa dodana');
            }
            setIsDialogOpen(false);
            setEditingService(null);
        } catch {
            toast.error('Wystąpił błąd');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć tę usługę?')) return;
        try {
            await deleteService(id);
            toast.success('Usługa usunięta');
        } catch {
            toast.error('Wystąpił błąd');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Katalog Usług</h3>
                <Button onClick={() => { setEditingService(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj Usługę
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Jednostka</TableHead>
                            <TableHead>Cena Bazowa (Netto)</TableHead>
                            <TableHead className="w-[100px]">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.unit}</TableCell>
                                <TableCell>{service.basePriceNet?.toFixed(2)} PLN</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingService(service); setIsDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {services.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Brak zdefiniowanych usług. Dodaj pierwszą.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Edytuj Usługę' : 'Nowa Usługa'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nazwa Usługi</Label>
                            <Input id="name" name="name" defaultValue={editingService?.name} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unit">Jednostka</Label>
                                <Select name="unit" defaultValue={editingService?.unit || 'm2'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="m2">m²</SelectItem>
                                        <SelectItem value="mb">mb</SelectItem>
                                        <SelectItem value="szt">szt.</SelectItem>
                                        <SelectItem value="kpl">kpl.</SelectItem>
                                        <SelectItem value="godz">godz.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vatRate">Stawka VAT</Label>
                                <Select name="vatRate" defaultValue={editingService ? ((editingService.vatRate || 0) * 100).toString() : "23"}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">bez (0%)</SelectItem>
                                        <SelectItem value="8">8%</SelectItem>
                                        <SelectItem value="23">23%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="basePriceNet">Cena dla Klienta (Netto)</Label>
                                <Input 
                                    id="basePriceNet" 
                                    name="basePriceNet" 
                                    type="number" 
                                    step="0.01" 
                                    defaultValue={editingService?.basePriceNet || 0} 
                                    required 
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
