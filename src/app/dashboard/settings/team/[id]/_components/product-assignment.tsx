
'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { updateArchitectAssignedProducts } from '../../actions';
import { toast } from 'sonner';

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface ProductAssignmentProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    products: Product[];
}

export function ProductAssignment({ user, products }: ProductAssignmentProps) {
    const initialIds = user.architectProfile?.assignedProductIds || [];
    const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    // Sync state if user changes props (unlikely but good practice)
    useEffect(() => {
        setSelectedIds(user.architectProfile?.assignedProductIds || []);
    }, [user.architectProfile?.assignedProductIds]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const lower = searchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lower) || 
            p.sku.toLowerCase().includes(lower)
        );
    }, [products, searchQuery]);

    // Simple comparison for dirty state
    const isDirty = useMemo(() => {
        const a = [...selectedIds].sort((x, y) => x - y);
        const b = [...(user.architectProfile?.assignedProductIds || [])].sort((x, y) => x - y);
        return JSON.stringify(a) !== JSON.stringify(b);
    }, [selectedIds, user.architectProfile?.assignedProductIds]);

    const handleToggle = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleSelectAllFiltered = () => {
        const result = new Set(selectedIds);
        filteredProducts.forEach(p => result.add(p.id));
        setSelectedIds(Array.from(result));
    };

    const handleDeselectAllFiltered = () => {
        const filteredIds = new Set(filteredProducts.map(p => p.id));
        setSelectedIds(prev => prev.filter(id => !filteredIds.has(id)));
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateArchitectAssignedProducts(user.id, selectedIds);
                toast.success('Zapisano ofertę');
            } catch (e) {
                console.error(e);
                toast.error('Błąd zapisu');
            }
        });
    };

    return (
        <Card className="h-full flex flex-col border-none shadow-none md:border md:shadow-sm">
            <CardHeader className="px-0 md:px-6">
                <CardTitle>Oferta produktowa</CardTitle>
                <CardDescription>
                    Wybierz produkty, które będą widoczne dla tego partnera.
                    {selectedIds.length === 0 ? ' (Brak wybranych = widoczne wszystkie)' : ` (${selectedIds.length} wybranych)`}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-[400px] px-0 md:px-6">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                     <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Szukaj po nazwie lub SKU..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" size="sm" onClick={handleSelectAllFiltered}>
                            Zaznacz widoczne
                         </Button>
                         <Button variant="outline" size="sm" onClick={handleDeselectAllFiltered}>
                            Odznacz widoczne
                         </Button>
                    </div>
                </div>

                <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                     <div className="bg-muted/50 p-2 border-b text-xs font-medium grid grid-cols-[auto_1fr_auto] gap-4">
                        <div className="w-8 text-center">#</div>
                        <div>Nazwa produktu</div>
                        <div>SKU</div>
                     </div>
                     <ScrollArea className="flex-1 h-[400px]">
                        <div className="divide-y">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedIds.includes(product.id);
                                return (
                                    <div 
                                        key={product.id} 
                                        className={`flex items-center p-3 hover:bg-muted/50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                        onClick={() => handleToggle(product.id)}
                                    >
                                        <div className="w-8 flex justify-center">
                                            <Checkbox 
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggle(product.id)}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 px-4">
                                            <div className="font-medium truncate">{product.name}</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground px-4">
                                            {product.sku}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    Brak wyników
                                </div>
                            )}
                        </div>
                     </ScrollArea>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t py-4 px-0 md:px-6 sticky bottom-0 bg-background md:static z-10">
                 <div className="text-sm text-muted-foreground">
                    Wybrano: {selectedIds.length} z {products.length}
                 </div>
                 <Button onClick={handleSave} disabled={!isDirty || isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDirty ? 'Zapisz zmiany' : 'Brak zmian'}
                 </Button>
            </CardFooter>
        </Card>
    );
}
