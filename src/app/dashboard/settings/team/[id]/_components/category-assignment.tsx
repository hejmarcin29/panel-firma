'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { updateArchitectProfile } from '../../actions';

interface Product {
    id: string;
    name: string;
    sku: string;
}

interface CategoryWithProducts {
    id: string;
    name: string;
    products: Product[];
}

interface CategoryAssignmentProps {
    user: {
        id: string;
        architectProfile: {
            assignedCategories?: { id: number | string; name: string }[];
            assignedProductIds?: (number | string)[];
            excludedProductIds?: (number | string)[];
        } | null;
    };
    data: CategoryWithProducts[];
}

export function CategoryAssignment({ user, data }: CategoryAssignmentProps) {
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    
    // State: We only track explicitly selected Product IDs
    // We cast to string[] because we are now using string UUIDs from ERP
    const [selectedProductIds, setSelectedProductIds] = useState<(string | number)[]>(
        user.architectProfile?.assignedProductIds || []
    );

    // Helper: Which categories are "active" (have at least one product selected, OR were explicitly enabled in UI)
    const [manuallyEnabledCategories, setManuallyEnabledCategories] = useState<string[]>(() => {
        // Init: Categories that have products selected are enabled.
        const activeIds = new Set<string>();
        data.forEach(cat => {
            if (cat.products.some(p => (user.architectProfile?.assignedProductIds || []).includes(p.id))) {
                activeIds.add(cat.id);
            }
        });
        return Array.from(activeIds);
    });

    const filteredData = data.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isCategoryChecked = (catId: string) => {
        return manuallyEnabledCategories.includes(catId);
    };

    const toggleCategory = (catId: string, products: Product[]) => {
        if (manuallyEnabledCategories.includes(catId)) {
            // Unchecking: Remove from enabled list AND deselect all its products
            setManuallyEnabledCategories(prev => prev.filter(id => id !== catId));
            const productIdsToRemove = products.map(p => p.id);
            setSelectedProductIds(prev => prev.filter(id => !productIdsToRemove.includes(id)));
            // Also collapse? Optional.
        } else {
            // Checking: Add to enabled list. DO NOT SELECT ANY PRODUCTS (User requirement: "zero jest zaznaczonych").
            setManuallyEnabledCategories(prev => [...prev, catId]);
            // Auto-expand for convenience
            if (!expandedCategories.includes(catId)) {
                setExpandedCategories(prev => [...prev, catId]);
            }
        }
    };

    const toggleProduct = (productId: string, catId: string) => {
        setSelectedProductIds(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            }
            return [...prev, productId];
        });
        // Ensure category is marked enabled if we select a product
        if (!manuallyEnabledCategories.includes(catId)) {
            setManuallyEnabledCategories(prev => [...prev, catId]);
        }
    };

    const handleSelectAllInProgress = (products: Product[]) => {
        // Helper to select all visible products in category
        const idsToAdd = products.map(p => p.id);
        setSelectedProductIds(prev => {
            const newSet = new Set([...prev, ...idsToAdd]);
            return Array.from(newSet);
        });
    };

    const toggleExpand = (catId: string) => {
        setExpandedCategories(prev => 
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                const currentProfile = user.architectProfile || {};
                
                await updateArchitectProfile(user.id, {
                    ...currentProfile,
                    assignedProductIds: selectedProductIds,
                    // Clear legacy fields to avoid confusion
                    assignedCategories: [], 
                    excludedProductIds: [] 
                });
                alert('Konfiguracja oferty została zapisana.');
            } catch (error) {
                console.error(error);
                alert('Wystąpił błąd podczas zapisywania.');
            }
        });
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Konfiguracja Oferty (Lista Produktów)</CardTitle>
                <CardDescription>
                    Aktywuj kategorię, aby wybrać produkty widoczne dla architekta.
                    Nowe produkty dodane do sklepu <strong>nie pojawią się</strong> automatycznie.
                </CardDescription>
                
                <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Szukaj kategorii lub produktu..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-[600px] border rounded-md p-2">
                    <div className="space-y-2">
                        {filteredData.map((category) => {
                            const isChecked = isCategoryChecked(category.id);
                            const isExpanded = expandedCategories.includes(category.id) || searchQuery.length > 0;
                            
                            // Check count for display
                            const selectedCount = category.products.filter(p => selectedProductIds.includes(p.id)).length;
                            const totalProducts = category.products.length;
                            
                            return (
                                <div key={category.id} className={`border rounded-md px-3 py-2 bg-card ${isChecked ? 'border-primary/30' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                                id={`cat-${category.id}`}
                                                checked={isChecked}
                                                onCheckedChange={() => toggleCategory(category.id, category.products)}
                                            />
                                            <div className="flex flex-col">
                                                <Label 
                                                    htmlFor={`cat-${category.id}`} 
                                                    className="font-semibold cursor-pointer text-base"
                                                >
                                                    {category.name}
                                                </Label>
                                                <span className="text-xs text-muted-foreground">
                                                    {isChecked 
                                                        ? `Wybrano: ${selectedCount}/${totalProducts}` 
                                                        : 'Kategoria nieaktywna'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            {/* Helper button to select all if category is checked but few items selected */}
                                            {isChecked && selectedCount < totalProducts && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 text-[10px] px-2 text-primary"
                                                    onClick={() => handleSelectAllInProgress(category.products)}
                                                >
                                                    Zaznacz wszystkie
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => toggleExpand(category.id)}>
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Products List */}
                                    {isExpanded && isChecked && (
                                        <div className="mt-2 pl-9 space-y-1 border-l-2 ml-2 border-muted animate-in fade-in slide-in-from-top-2 duration-200">
                                            {category.products.map(product => {
                                                 const isProdSelected = selectedProductIds.includes(product.id);

                                                 return (
                                                    <div key={product.id} className="flex items-center gap-2 py-1">
                                                        <Checkbox 
                                                            id={`prod-${product.id}`}
                                                            checked={isProdSelected}
                                                            onCheckedChange={() => toggleProduct(product.id, category.id)}
                                                        />
                                                        <Label 
                                                            htmlFor={`prod-${product.id}`}
                                                            className={`text-sm cursor-pointer font-normal ${isProdSelected ? '' : 'text-muted-foreground'}`}
                                                        >
                                                            {product.name}
                                                            <span className="text-xs text-muted-foreground ml-2">({product.sku})</span>
                                                        </Label>
                                                    </div>
                                                 );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {filteredData.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <p>Brak dostępnych kategorii produktów.</p>
                                <p className="text-sm">
                                    Upewnij się, że produkty zostały zsynchronizowane z WooCommerce i mają status &quot;Opublikowane&quot;.
                                    <br />
                                    Możesz to sprawdzić w zakładce <strong>ERP &gt; Produkty</strong>.
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="mt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zapisz listę produktów
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

