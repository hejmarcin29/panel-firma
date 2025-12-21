'use client';

import { Edit2, Loader2, Check, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from 'use-debounce';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { updateMontageMaterialDetails, updateMontageRealizationStatus } from '../../actions';
import type { Montage, MaterialsEditHistoryEntry } from '../../types';
import { type UserRole, type MontageMaterialClaimType } from '@/lib/db/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProductSelectorModal } from '../../_components/product-selector-modal';

export function MontageMaterialCard({ montage, userRoles = ['admin'] }: { montage: Montage; userRoles?: UserRole[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    finalPanelAmount: montage.finalPanelAmount?.toString() || '',
    finalSkirtingLength: montage.finalSkirtingLength?.toString() || '',
    panelModel: montage.panelModel || '',
    panelProductId: montage.panelProductId || null,
    skirtingModel: montage.skirtingModel || '',
    skirtingProductId: montage.skirtingProductId || null,
    floorDetails: montage.floorDetails || '',
    skirtingDetails: montage.skirtingDetails || '',
    materialDetails: montage.measurementDetails || montage.materialDetails || '',
  });

  const [isPanelSelectorOpen, setIsPanelSelectorOpen] = useState(false);
  const [isSkirtingSelectorOpen, setIsSkirtingSelectorOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
    setFormData({
        finalPanelAmount: montage.finalPanelAmount?.toString() || '',
        finalSkirtingLength: montage.finalSkirtingLength?.toString() || '',
        panelModel: montage.panelModel || '',
        panelProductId: montage.panelProductId || null,
        skirtingModel: montage.skirtingModel || '',
        skirtingProductId: montage.skirtingProductId || null,
        floorDetails: montage.floorDetails || '',
        skirtingDetails: montage.skirtingDetails || '',
        materialDetails: montage.measurementDetails || montage.materialDetails || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montage.id]);

  useEffect(() => {
    if (isEditing) {
        window.history.pushState({ modalOpen: true }, '', window.location.href);
        
        const handlePopState = () => {
            setIsEditing(false);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }
  }, [isEditing]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setIsEditing(false);
        if (window.history.state?.modalOpen) {
            window.history.back();
        }
    } else {
        setIsEditing(true);
    }
  };

  const calculatedPanelAmount = montage.floorArea 
    ? (montage.floorArea * (1 + (montage.panelWaste || 5) / 100)).toFixed(2) 
    : null;
  const calculatedSkirtingLength = montage.skirtingLength 
    ? (montage.skirtingLength * (1 + (montage.skirtingWaste || 5) / 100)).toFixed(2) 
    : null;

  const debouncedSave = useDebouncedCallback(async (data: typeof formData) => {
    setIsSaving(true);
    try {
      await updateMontageMaterialDetails({
        montageId: montage.id,
        materialDetails: data.materialDetails,
        finalPanelAmount: data.finalPanelAmount ? parseFloat(data.finalPanelAmount) : null,
        finalSkirtingLength: data.finalSkirtingLength ? parseFloat(data.finalSkirtingLength) : null,
        panelModel: data.panelModel || null,
        panelProductId: data.panelProductId,
        skirtingModel: data.skirtingModel || null,
        skirtingProductId: data.skirtingProductId,
        floorDetails: data.floorDetails || null,
        skirtingDetails: data.skirtingDetails || null,
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleChange = (field: keyof typeof formData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    debouncedSave(newData);
  };

  const handleMaterialStatusChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          materialStatus: value as 'none' | 'ordered' | 'in_stock' | 'delivered'
      });
      router.refresh();
  };

    const handleClaimTypeChange = async (value: string) => {
        await updateMontageRealizationStatus({
            montageId: montage.id,
            materialClaimType: value as MontageMaterialClaimType
        });
        router.refresh();
    };  const getMaterialStatusColor = (status: string) => {
      switch (status) {
          case 'none': return 'bg-red-100 text-red-800 border-red-200';
          case 'ordered': return 'bg-orange-100 text-orange-800 border-orange-200';
          case 'in_stock':
          case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Materiały</CardTitle>
        <div className="flex items-center gap-2">
            <Select
                value={montage.materialStatus}
                onValueChange={handleMaterialStatusChange}
                disabled={!userRoles.includes('admin')}
            >
                <SelectTrigger className={cn("h-8 w-[140px] text-xs font-medium border", getMaterialStatusColor(montage.materialStatus))}>
                    <SelectValue placeholder="Status materiału" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Niezamówiono</SelectItem>
                    <SelectItem value="ordered">Zamówiono</SelectItem>
                    <SelectItem value="in_stock">Na magazynie</SelectItem>
                    <SelectItem value="delivered">Dostarczono</SelectItem>
                </SelectContent>
            </Select>
            
            {montage.materialStatus !== 'none' && (
                <Select
                    value={montage.materialClaimType || "installer_pickup"}
                    onValueChange={handleClaimTypeChange}
                    disabled={!userRoles.includes('admin')}
                >
                    <SelectTrigger className="h-8 w-[140px] text-xs font-medium border bg-white">
                        <SelectValue placeholder="Sposób odbioru" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="installer_pickup">Odbiór przez montażystę</SelectItem>
                        <SelectItem value="company_delivery">Dostawa firmowa</SelectItem>
                        <SelectItem value="courier">Kurier</SelectItem>
                        <SelectItem value="client_pickup">Odbiór własny (Klient)</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {userRoles.includes('admin') && (
            <Dialog open={isEditing} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <Edit2 className='h-4 w-4' />
            </Button>
          </DialogTrigger>
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl' onPointerDownOutside={() => {
              // Allow closing without confirmation since we have auto-save
          }}>
            <DialogHeader className='flex flex-row items-center justify-between'>
              <DialogTitle>Edytuj listę materiałów</DialogTitle>
              <div className='flex items-center gap-2 pr-8'>
                  {isSaving ? (
                      <span className='text-xs text-muted-foreground flex items-center gap-1'>
                          <Loader2 className='w-3 h-3 animate-spin' />
                          Zapisywanie...
                      </span>
                  ) : (
                      <span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isSaving}>
                          <Check className='w-3 h-3' />
                          Zapisano
                      </span>
                  )}
              </div>
            </DialogHeader>
            <div className='space-y-6 py-4'>
              <div className='space-y-2'>
                <Label>Ilość paneli do zamówienia (m²)</Label>
                <div className='flex gap-2 items-center'>
                    <Input 
                        name='finalPanelAmount' 
                        type='number' 
                        step='0.01' 
                        value={formData.finalPanelAmount}
                        onChange={(e) => handleChange('finalPanelAmount', e.target.value)}
                        className='w-32'
                    />
                    <div className='text-xs text-muted-foreground'>
                        (Wyliczono z pomiaru: {calculatedPanelAmount || 0} m²)
                    </div>
                </div>
                <div className="flex gap-2">
                    <Input 
                        name='panelModel' 
                        placeholder='Model paneli'
                        value={formData.panelModel}
                        readOnly
                        onClick={() => setIsPanelSelectorOpen(true)}
                        className="cursor-pointer bg-muted/50"
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsPanelSelectorOpen(true)}
                    >
                        Wybierz
                    </Button>
                </div>
                <Input 
                    name='floorDetails' 
                    placeholder='Dodatkowe materiały do paneli'
                    value={formData.floorDetails}
                    onChange={(e) => handleChange('floorDetails', e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Ilość listew do zamówienia (mb)</Label>
                <div className='flex gap-2 items-center'>
                    <Input 
                        name='finalSkirtingLength' 
                        type='number' 
                        step='0.01' 
                        value={formData.finalSkirtingLength}
                        onChange={(e) => handleChange('finalSkirtingLength', e.target.value)}
                        className='w-32'
                    />
                    <div className='text-xs text-muted-foreground'>
                        (Wyliczono z pomiaru: {calculatedSkirtingLength || 0} mb)
                    </div>
                </div>
                <div className="flex gap-2">
                    <Input 
                        name='skirtingModel' 
                        placeholder='Model listew'
                        value={formData.skirtingModel}
                        readOnly
                        onClick={() => setIsSkirtingSelectorOpen(true)}
                        className="cursor-pointer bg-muted/50"
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsSkirtingSelectorOpen(true)}
                    >
                        Wybierz
                    </Button>
                </div>
                <Input 
                    name='skirtingDetails' 
                    placeholder='Dodatkowe materiały do listew'
                    value={formData.skirtingDetails}
                    onChange={(e) => handleChange('skirtingDetails', e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Uwagi dotyczące listew i podłogi / Materiały</Label>
                <Textarea
                    name='materialDetails'
                    className='min-h-[150px]'
                    value={formData.materialDetails}
                    onChange={(e) => handleChange('materialDetails', e.target.value)}
                    placeholder='Wpisz uwagi...'
                />
              </div>
            </div>
            
            {montage.materialsEditHistory && Array.isArray(montage.materialsEditHistory) && montage.materialsEditHistory.length > 0 && (
                <div className='mt-6 pt-4 border-t'>
                    <h4 className='text-sm font-medium mb-2'>Historia edycji</h4>
                    <div className='space-y-2 max-h-[150px] overflow-y-auto text-xs text-muted-foreground'>
                        {[...montage.materialsEditHistory].reverse().map((entry: MaterialsEditHistoryEntry, i: number) => (
                            <div key={i} className='flex flex-col gap-1 pb-2 border-b border-border/50 last:border-0'>
                                <span className='font-medium'>{new Date(entry.date).toLocaleString('pl-PL')}</span>
                                <div className='pl-2 border-l-2 border-muted'>
                                    {entry.changes.finalPanelAmount && <div>Panele: {entry.changes.finalPanelAmount} m²</div>}
                                    {entry.changes.finalSkirtingLength && <div>Listwy: {entry.changes.finalSkirtingLength} mb</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </DialogContent>
        </Dialog>
        )}
        </div>
      </CardHeader>
      
      <ProductSelectorModal
        isOpen={isPanelSelectorOpen}
        onClose={() => setIsPanelSelectorOpen(false)}
        onSelect={(product) => {
            setFormData(prev => ({
                ...prev,
                panelModel: product.name,
                panelProductId: product.id
            }));
            setIsPanelSelectorOpen(false);
            debouncedSave({
                ...formData,
                panelModel: product.name,
                panelProductId: product.id
            });
        }}
        type="panel"
      />

      <ProductSelectorModal
        isOpen={isSkirtingSelectorOpen}
        onClose={() => setIsSkirtingSelectorOpen(false)}
        onSelect={(product) => {
            setFormData(prev => ({
                ...prev,
                skirtingModel: product.name,
                skirtingProductId: product.id
            }));
            setIsSkirtingSelectorOpen(false);
            debouncedSave({
                ...formData,
                skirtingModel: product.name,
                skirtingProductId: product.id
            });
        }}
        type="skirting"
      />

      <CardContent className='space-y-4'>
        {/* Calculated Materials Section */}
        {(calculatedPanelAmount || calculatedSkirtingLength) && (
            <div className='mb-4 p-3 bg-muted/30 rounded-md border border-border/50'>
                <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>POMIAR</h4>
                <div className='grid grid-cols-2 gap-4'>
                    {calculatedPanelAmount && (
                        <div className='space-y-1'>
                            <div className='flex items-center gap-2'>
                                <span className='h-2 w-2 rounded-full bg-blue-500'></span>
                                <span className='text-sm font-medium'>Podłoga</span>
                            </div>
                            <div className='text-lg font-bold'>{calculatedPanelAmount} m²</div>
                            <div className='text-xs text-muted-foreground'>
                                ({montage.floorArea} m² + {montage.panelWaste}%)
                            </div>
                            {montage.panelModel && <div className='text-sm font-medium mt-1'>{montage.panelModel}</div>}
                        </div>
                    )}
                    {calculatedSkirtingLength && (
                        <div className='space-y-1'>
                            <div className='flex items-center gap-2'>
                                <span className='h-2 w-2 rounded-full bg-amber-500'></span>
                                <span className='text-sm font-medium'>Listwy</span>
                            </div>
                            <div className='text-lg font-bold'>{calculatedSkirtingLength} mb</div>
                            <div className='text-xs text-muted-foreground'>
                                ({montage.skirtingLength} mb + {montage.skirtingWaste}%)
                            </div>
                            {montage.skirtingModel && <div className='text-sm font-medium mt-1'>{montage.skirtingModel}</div>}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Manual overrides display if they exist and differ from calculated */}
        {((montage.finalPanelAmount && montage.finalPanelAmount !== parseFloat(calculatedPanelAmount || '0')) || 
          (montage.finalSkirtingLength && montage.finalSkirtingLength !== parseFloat(calculatedSkirtingLength || '0'))) && (
            <div className='grid grid-cols-2 gap-4 pt-2 border-t border-border/50'>
                <div className='space-y-1'>
                    {montage.finalPanelAmount && montage.finalPanelAmount !== parseFloat(calculatedPanelAmount || '0') && (
                        <>
                            <span className='text-xs text-muted-foreground'>Panele (ręczna zmiana)</span>
                            <div className='font-medium text-orange-600'>
                                {montage.finalPanelAmount} m²
                            </div>
                        </>
                    )}
                </div>
                <div className='space-y-1'>
                    {montage.finalSkirtingLength && montage.finalSkirtingLength !== parseFloat(calculatedSkirtingLength || '0') && (
                        <>
                            <span className='text-xs text-muted-foreground'>Listwy (ręczna zmiana)</span>
                            <div className='font-medium text-orange-600'>
                                {montage.finalSkirtingLength} mb
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}

        {(montage.floorDetails || montage.skirtingDetails) && (
            <div className='pt-4 border-t border-border/50 grid grid-cols-2 gap-4'>
                {montage.floorDetails && (
                    <div className='space-y-1'>
                        <span className='text-xs text-muted-foreground'>Dodatkowe (Panele)</span>
                        <div className='text-sm'>{montage.floorDetails}</div>
                    </div>
                )}
                {montage.skirtingDetails && (
                    <div className='space-y-1'>
                        <span className='text-xs text-muted-foreground'>Dodatkowe (Listwy)</span>
                        <div className='text-sm'>{montage.skirtingDetails}</div>
                    </div>
                )}
            </div>
        )}

        {!montage.finalPanelAmount && !montage.finalSkirtingLength && !montage.measurementDetails && !montage.materialDetails && !calculatedPanelAmount && (
          <div className='flex flex-col items-center justify-center py-4 text-center text-sm text-muted-foreground'>
            <Package className='mb-2 h-8 w-8 opacity-50' />
            <p>Brak danych materiałowych</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
