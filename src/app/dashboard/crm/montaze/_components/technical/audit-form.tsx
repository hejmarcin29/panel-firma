'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { updateTechnicalAudit } from '../../technical-actions';
import type { TechnicalAuditData } from '../../technical-data';

interface AuditFormProps {
  montageId: string;
  initialData: TechnicalAuditData | null;
  readOnly?: boolean;
}

export function AuditForm({ montageId, initialData, readOnly = false }: AuditFormProps) {
  const [isPending, startTransition] = useTransition();
  
  const defaultValues: TechnicalAuditData = initialData || {
    humidity: null,
    humidityMethod: 'CM',
    flatness: null,
    subfloorType: null,
    heating: false,
    heatingProtocol: false,
    notes: '',
    photos: [],
  };

  const [formData, setFormData] = useState<TechnicalAuditData>(defaultValues);

  const handleSave = () => {
    startTransition(async () => {
      await updateTechnicalAudit(montageId, formData);
    });
  };

  const handleChange = (field: keyof TechnicalAuditData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audyt Techniczny Podłoża</CardTitle>
        <CardDescription>Wypełnia pomiarowiec przed zamówieniem materiału.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Wilgotność (%)</Label>
            <div className="flex gap-2">
                <Input 
                    type="number" 
                    step="0.1"
                    value={formData.humidity ?? ''} 
                    onChange={(e) => handleChange('humidity', e.target.value ? parseFloat(e.target.value) : null)}
                    disabled={readOnly}
                    className={formData.humidity && formData.humidity > 2.0 ? 'border-red-500 bg-red-50' : ''}
                />
                <Select 
                    value={formData.humidityMethod} 
                    onValueChange={(v) => handleChange('humidityMethod', v)}
                    disabled={readOnly}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CM">Metoda CM</SelectItem>
                        <SelectItem value="electric">Elektr.</SelectItem>
                        <SelectItem value="other">Inna</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {formData.humidity && formData.humidity > 2.0 && (
                <p className="text-xs text-red-600 font-medium">Uwaga: Wilgotność powyżej normy!</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Rodzaj podłoża</Label>
            <Select 
                value={formData.subfloorType || ''} 
                onValueChange={(v) => handleChange('subfloorType', v)}
                disabled={readOnly}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Wybierz..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="concrete">Beton / Jastrych</SelectItem>
                    <SelectItem value="anhydrite">Anhydryt</SelectItem>
                    <SelectItem value="osb">Płyta OSB / Drewno</SelectItem>
                    <SelectItem value="other">Inne</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Równość podłoża</Label>
            <Select 
                value={formData.flatness || ''} 
                onValueChange={(v) => handleChange('flatness', v)}
                disabled={readOnly}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Ocena..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ok">W normie (gotowe)</SelectItem>
                    <SelectItem value="grinding">Wymaga szlifowania</SelectItem>
                    <SelectItem value="leveling">Wymaga wylewki</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
                <Label>Ogrzewanie podłogowe</Label>
                <Switch 
                    checked={formData.heating} 
                    onCheckedChange={(v) => handleChange('heating', v)}
                    disabled={readOnly}
                />
            </div>
            {formData.heating && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-blue-200">
                    <Label>Protokół wygrzania</Label>
                    <Switch 
                        checked={formData.heatingProtocol} 
                        onCheckedChange={(v) => handleChange('heatingProtocol', v)}
                        disabled={readOnly}
                    />
                </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
            <Label>Notatki techniczne</Label>
            <Textarea 
                value={formData.notes} 
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={readOnly}
                placeholder="Opisz ewentualne pęknięcia, dylatacje itp."
            />
        </div>

        {!readOnly && (
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Zapisz Audyt
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
