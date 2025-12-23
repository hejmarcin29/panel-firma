'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleProductSync } from '../actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductSyncToggleProps {
  productId: string;
  initialIsSyncEnabled: boolean;
  source: 'local' | 'woocommerce';
}

export function ProductSyncToggle({ productId, initialIsSyncEnabled, source }: ProductSyncToggleProps) {
  const [isSyncEnabled, setIsSyncEnabled] = useState(initialIsSyncEnabled);
  const [isLoading, setIsLoading] = useState(false);

  if (source !== 'woocommerce') {
    return null;
  }

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const result = await toggleProductSync(productId, checked);
      if (result.success) {
        setIsSyncEnabled(checked);
        toast.success(checked ? 'Włączono synchronizację' : 'Wyłączono synchronizację');
      } else {
        toast.error('Nie udało się zmienić statusu synchronizacji');
        // Revert state if failed
        setIsSyncEnabled(!checked);
      }
    } catch (error) {
      toast.error('Wystąpił błąd');
      // Revert state if failed
      setIsSyncEnabled(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 border rounded-lg p-2 bg-blue-50/50 border-blue-100">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <Switch
            id="sync-mode"
            checked={isSyncEnabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-blue-600"
          />
        )}
        <Label htmlFor="sync-mode" className="text-sm font-medium text-blue-900 cursor-pointer">
          Synchronizacja z WooCommerce
        </Label>
      </div>
    </div>
  );
}
