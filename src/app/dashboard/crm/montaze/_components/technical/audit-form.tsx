'use client';

import { useState, useTransition, useRef } from 'react';
import { Loader2, Camera, X, ImagePlus } from 'lucide-react';

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

import { updateTechnicalAudit, uploadAuditPhotoAction } from '../../technical-actions';
import type { TechnicalAuditData } from '../../technical-data';

interface AuditFormProps {
  montageId: string;
  initialData: TechnicalAuditData | null;
  readOnly?: boolean;
  hideSaveButton?: boolean;
  onChange?: (data: TechnicalAuditData) => void;
}

export function AuditForm({ montageId, initialData, readOnly = false, hideSaveButton = false, onChange }: AuditFormProps) {
  const [isPending, startTransition] = useTransition();
  
  const defaultValues: TechnicalAuditData = {
    humidity: initialData?.humidity ?? null,
    humidityMethod: initialData?.humidityMethod ?? 'CM',
    flatness: initialData?.flatness ?? null,
    subfloorType: initialData?.subfloorType ?? null,
    heating: initialData?.heating ?? false,
    heatingProtocol: initialData?.heatingProtocol ?? false,
    floorHeated: initialData?.floorHeated ?? false,
    notes: initialData?.notes ?? '',
    photos: initialData?.photos ?? [],
  };

  const [formData, setFormData] = useState<TechnicalAuditData>(defaultValues);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateTechnicalAudit(montageId, formData);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        setIsUploading(true);
        try {
            const uploadPromises = Array.from(files).map(file => {
                const formDataUpload = new FormData();
                formDataUpload.append('montageId', montageId);
                formDataUpload.append('file', file);
                return uploadAuditPhotoAction(formDataUpload);
            });
            
            const urls = await Promise.all(uploadPromises);
            
            setFormData(prev => {
                const newData = {
                    ...prev,
                    photos: [...(prev.photos || []), ...urls]
                };
                onChange?.(newData);
                return newData;
            });
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => {
        const newData = {
            ...prev,
            photos: (prev.photos || []).filter((_, i) => i !== index)
        };
        onChange?.(newData);
        return newData;
    });
  };

  const handleChange = (field: keyof TechnicalAuditData, value: string | number | boolean | null) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        onChange?.(newData);
        return newData;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Audyt Techniczny Podłoża</Label>
        {!readOnly && (
            <Button onClick={handleSave} disabled={isPending} size="sm" variant="outline">
                {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Zapisz Audyt
            </Button>
        )}
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
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
                <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                    <div className="flex items-center justify-between">
                        <Label>Protokół wygrzania</Label>
                        <Switch 
                            checked={formData.heatingProtocol} 
                            onCheckedChange={(v) => handleChange('heatingProtocol', v)}
                            disabled={readOnly}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Posadzka wygrzana</Label>
                        <Switch 
                            checked={formData.floorHeated} 
                            onCheckedChange={(v) => handleChange('floorHeated', v)}
                            disabled={readOnly}
                        />
                    </div>
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

        <div className="space-y-2">
            <Label>Zdjęcia / Dokumentacja</Label>
            <div className="grid grid-cols-3 gap-2">
                {formData.photos?.map((url, index) => (
                    <div key={index} className="relative aspect-square bg-muted rounded-md overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Audit" className="w-full h-full object-cover" />
                        {!readOnly && (
                            <button 
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
                {!readOnly && (
                    <>
                        <button 
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={isUploading}
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:bg-muted/50 transition-colors bg-background"
                        >
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                                    <span className="text-[10px] text-muted-foreground font-medium">Aparat</span>
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={isUploading}
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md hover:bg-muted/50 transition-colors bg-background"
                        >
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                                    <span className="text-[10px] text-muted-foreground font-medium">Galeria</span>
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
            <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
            />
            <input 
                type="file" 
                ref={galleryInputRef} 
                className="hidden" 
                accept="image/*"
                multiple
                onChange={handleFileSelect}
            />
        </div>

        {!readOnly && !hideSaveButton && (
            <Button onClick={handleSave} disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz Audyt
            </Button>
        )}
      </div>
    </div>
  );
}
