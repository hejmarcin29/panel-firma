'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateProductMontageSettings } from '../actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductMontageSettingsProps {
  productId: number;
  initialIsForMontage: boolean;
  initialMontageType: 'panel' | 'other' | null;
}

export function ProductMontageSettings({
  productId,
  initialIsForMontage,
  initialMontageType,
}: ProductMontageSettingsProps) {
  const [isForMontage, setIsForMontage] = useState(initialIsForMontage);
  const [montageType, setMontageType] = useState(initialMontageType || 'other');
  const [isPending, setIsPending] = useState(false);

  const handleSwitchChange = async (checked: boolean) => {
    setIsForMontage(checked);
    setIsPending(true);
    try {
      await updateProductMontageSettings(productId, checked, montageType);
      toast.success('Zaktualizowano ustawienia montażu');
    } catch {
      setIsForMontage(!checked); // Revert
      toast.error('Błąd aktualizacji');
    } finally {
      setIsPending(false);
    }
  };

  const handleTypeChange = async (value: 'panel' | 'other') => {
    setMontageType(value);
    setIsPending(true);
    try {
      await updateProductMontageSettings(productId, isForMontage, value);
      toast.success('Zaktualizowano typ produktu');
    } catch {
      setMontageType(montageType); // Revert
      toast.error('Błąd aktualizacji');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <div className="flex items-center gap-2">
        <Switch
          checked={isForMontage}
          onCheckedChange={handleSwitchChange}
          disabled={isPending}
          className="scale-75 origin-left"
        />
        <span className="text-xs text-muted-foreground">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (isForMontage ? 'Włączony' : 'Wyłączony')}
        </span>
      </div>
      
      {isForMontage && (
        <Select
          value={montageType || 'other'}
          onValueChange={(val) => handleTypeChange(val as 'panel' | 'other')}
          disabled={isPending}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="panel">Panel</SelectItem>
            <SelectItem value="other">Inne</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
