'use client';

import { Switch } from '@/components/ui/switch';
import { toggleShopVisibility, toggleSampleAvailability } from '../actions';
import { useTransition } from 'react';
import { toast } from 'sonner';

type ProductRowProps = {
    product: {
        id: string;
        name: string;
        sku: string;
        isShopVisible: boolean | null;
        isSampleAvailable: boolean | null; 
    }
};

export function ProductRow({ product }: ProductRowProps) {
    const [isPendingShop, startTransitionShop] = useTransition();
    const [isPendingSample, startTransitionSample] = useTransition();

    const handleShopToggle = (checked: boolean) => {
        startTransitionShop(async () => {
            try {
                await toggleShopVisibility(product.id, checked);
                toast.success(`Zmieniono widoczność w sklepie: ${product.name}`);
            } catch {
                toast.error('Błąd aktualizacji');
            }
        });
    };

    const handleSampleToggle = (checked: boolean) => {
        startTransitionSample(async () => {
            try {
                await toggleSampleAvailability(product.id, checked);
                toast.success(`Zmieniono dostępność próbki: ${product.name}`);
            } catch {
                toast.error('Błąd aktualizacji');
            }
        });
    };

    return (
        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <td className="p-4 align-middle font-medium">{product.name}</td>
            <td className="p-4 align-middle text-muted-foreground">{product.sku}</td>
            <td className="p-4 align-middle text-center">
                <Switch 
                    checked={!!product.isShopVisible} 
                    onCheckedChange={handleShopToggle} 
                    disabled={isPendingShop}
                />
            </td>
            <td className="p-4 align-middle text-center">
                <Switch 
                    checked={!!product.isSampleAvailable} 
                    onCheckedChange={handleSampleToggle}
                    disabled={isPendingSample}
                />
            </td>
        </tr>
    );
}
