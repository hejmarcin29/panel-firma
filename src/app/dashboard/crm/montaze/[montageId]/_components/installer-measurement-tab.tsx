'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  Droplets, 
  Layers, 
  Check, 
  Loader2, 
  Info,
  ImageIcon,
  Pencil
} from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Montage, MeasurementMaterialItem } from '../../types';
import { updateMontageMeasurement } from '../../actions';
import { TechnicalAuditData } from '../../technical-data';

interface InstallerMeasurementTabProps {
  montage: Montage;
  userRoles?: string[];
  onEditSection?: (section: 'date' | 'tax' | 'subfloor' | 'humidity' | 'area' | 'tech' | 'materials') => void;
}

export function InstallerMeasurementTab({ montage, userRoles = [], onEditSection }: InstallerMeasurementTabProps) {
  const router = useRouter();
  
  const isLockedBySettlement = montage.settlement?.status === 'approved' || montage.settlement?.status === 'paid';
  const isReadOnly = (!userRoles.includes('admin') && !userRoles.includes('installer')) || isLockedBySettlement;

  // --- STATE MANAGEMENT (Copied from montage-measurement-tab.tsx) ---
  // Ideally, this should be extracted to a custom hook useMontageMeasurement(montage) to avoid duplication.
  // For now, keeping it local to this file as requested.

  const [measurementDetails] = useState(montage.measurementDetails || '');
  const [floorArea, setFloorArea] = useState<string>(montage.floorArea?.toString() || '');
  const [panelAdditionalMaterials] = useState(montage.floorDetails || '');
  
  const [panelModel] = useState(montage.panelModel || '');
  const [panelProductId] = useState<number | string | null>(montage.panelProductId || null);
  const [panelWaste] = useState<string>(montage.panelWaste?.toString() || '5');
  const [modelsApproved] = useState(montage.modelsApproved || false);

  const [installationMethod, setInstallationMethod] = useState<'click' | 'glue'>(
    (montage.measurementInstallationMethod as 'click' | 'glue') || 'click'
  );
  const [floorPattern] = useState<'classic' | 'herringbone'>(
    (montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic'
  );

  const [subfloorCondition, setSubfloorCondition] = useState(montage.measurementSubfloorCondition || 'good');
  const [additionalWorkNeeded, setAdditionalWorkNeeded] = useState(montage.measurementAdditionalWorkNeeded || false);
  const [additionalWorkDescription, setAdditionalWorkDescription] = useState(montage.measurementAdditionalWorkDescription || '');
  
  // Legacy material handling
  const [additionalMaterials] = useState<MeasurementMaterialItem[]>(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = montage.measurementAdditionalMaterials as any;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string' && raw.trim().length > 0) {
          return [{
              id: 'legacy-1',
              name: raw,
              quantity: '',
              supplySide: 'installer'
          }];
      }
      return [];
  });
  
  const [measurementRooms] = useState<{ name: string; area: number }[]>(montage.measurementRooms || []);

  const [isHousingVat, setIsHousingVat] = useState(montage.isHousingVat ?? true);
  const [additionalInfo] = useState(montage.additionalInfo || '');
  
  const [measurementDate] = useState(
    montage.measurementDate 
      ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
      : ""
  );

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  // Sync state with prop changes
  useEffect(() => {
    // When montage prop updates (e.g. after Assistant saves and router.refresh() occurs),
    // we need to update our local state to reflect those changes.
    setFloorArea(montage.floorArea?.toString() || '');
    setSubfloorCondition(montage.measurementSubfloorCondition || 'good');
    setIsHousingVat(montage.isHousingVat ?? true);
    setHumidity((montage.technicalAudit as unknown as TechnicalAuditData)?.humidity ?? null);
    // Add other fields as needed...
  }, [montage]);

  const technicalAudit = montage.technicalAudit as unknown as TechnicalAuditData | null;
  const [humidity, setHumidity] = useState<number | null>(technicalAudit?.humidity ?? null);


  const saveData = useCallback(async () => {
      setIsSaving(true);
      try {
        await updateMontageMeasurement({
          montageId: montage.id,
          measurementDetails,
          floorArea: floorArea ? parseFloat(floorArea) : null,
          floorDetails: panelAdditionalMaterials,
          panelModel,
          panelProductId,
          panelWaste: parseFloat(panelWaste),
          modelsApproved,
          measurementDate,
          measurementInstallationMethod: installationMethod,
          measurementFloorPattern: floorPattern,
          measurementSubfloorCondition: subfloorCondition,
          measurementAdditionalWorkNeeded: additionalWorkNeeded,
          measurementAdditionalWorkDescription: additionalWorkDescription,
          measurementAdditionalMaterials: additionalMaterials,
          isHousingVat,
          measurementRooms,
          additionalInfo,
          sketchUrl: montage.sketchUrl,
          scheduledInstallationAt: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).getTime() : null,
          scheduledInstallationEndAt: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt).getTime() : null,
        });
        setLastSaved(new Date());
        router.refresh();
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
  }, [
    router,
    montage, // We depend on montage for fields we don't edit here
    measurementDetails,
    floorArea,
    panelAdditionalMaterials,
    panelModel,
    panelProductId,
    panelWaste,
    modelsApproved,
    installationMethod,
    floorPattern,
    subfloorCondition,
    additionalWorkNeeded,
    additionalWorkDescription,
    additionalMaterials,
    isHousingVat,
    measurementRooms,
    additionalInfo,
    measurementDate,
  ]);

  // Auto-save effect
  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    if (isReadOnly) return;
    const timer = setTimeout(() => { saveData(); }, 1000);
    return () => clearTimeout(timer);
  }, [saveData, isReadOnly]);


  // Helper for KPI Colors
  const getSubfloorColor = (val: string) => {
      if (val === 'ideal') return 'text-green-600 bg-green-50';
      if (val === 'good') return 'text-blue-600 bg-blue-50';
      return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 for safe area if within drawer */}
      {/* 1. Header Section */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-4 px-4 border-b">
        <div>
            <h2 className="text-lg font-bold tracking-tight">Karta Pomiarowa</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                {measurementDate ? format(new Date(measurementDate), "dd.MM.yyyy HH:mm") : "Brak daty"}
            </div>
        </div>
        <div className="flex flex-col items-end">
             {lastSaved ? (
                <span className="text-[10px] text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Zapisano
                </span>
            ) : isSaving ? (
                <span className="text-[10px] text-blue-600 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> ...
                </span>
            ) : null}
            <Badge variant={measurementDate ? "default" : "secondary"}>
                {measurementDate ? "Wykonany" : "Planowany"}
            </Badge>
        </div>
      </div>

      {isLockedBySettlement && (
         <div className="bg-amber-50 p-3 rounded-lg text-amber-800 text-sm flex gap-2 items-start">
             <Info className="w-5 h-5 shrink-0" />
             Edycja zablokowana przez rozliczenie.
         </div>
      )}

      {/* 2. KPI Grid (Critical Parameters) */}
      <div className="grid grid-cols-2 gap-3">
            {/* Condition */}
            <div 
                className={cn(
                    "p-4 rounded-xl border flex flex-col justify-between min-h-[120px] transition-all active:scale-95 cursor-pointer",
                    getSubfloorColor(subfloorCondition)
                )}
                onClick={() => onEditSection?.('subfloor')}
            >
                <div className="flex items-start justify-between">
                    <Layers className="w-5 h-5 opacity-70" />
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Podłoże</span>
                </div>
                <div>
                     <div className="text-xl font-bold">
                         {subfloorCondition === 'ideal' && 'Idealne'}
                         {subfloorCondition === 'good' && 'Dobre'}
                         {subfloorCondition === 'bad' && 'Złe (Szlif)'}
                         {subfloorCondition === 'critical' && 'Krytyczne'}
                     </div>
                     <p className="text-[10px] leading-tight opacity-80 mt-1">Stan ogólny wylewki</p>
                </div>
            </div>

            {/* Humidity */}
            <div 
                className="p-4 rounded-xl border bg-card flex flex-col justify-between min-h-[120px] transition-all active:scale-95 cursor-pointer hover:border-blue-300"
                onClick={() => onEditSection?.('humidity')}
            >
                 <div className="flex items-start justify-between text-blue-500 mb-2">
                    <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Wilgotność</span>
                    </div>
                 </div>
                 
                 <div className="flex items-baseline gap-1">
                     <span className={cn(
                        "text-3xl font-bold",
                        humidity && humidity > 2.0 ? "text-red-600" : "text-foreground"
                     )}>
                        {humidity ?? '--'}
                     </span>
                     <span className="text-sm font-medium text-muted-foreground self-end mb-1">%</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-1">
                    {technicalAudit?.humidityMethod ? `Metoda: ${technicalAudit.humidityMethod}` : 'Norma: < 2.0% (CM)'}
                 </p>
            </div>

             {/* Area Total */}
             <div 
                className="col-span-2 p-4 rounded-xl border bg-primary/5 flex items-center justify-between transition-all active:scale-95 cursor-pointer hover:border-primary/30"
                onClick={() => onEditSection?.('area')}
             >
                  {/* Left */}
                  <div className="flex-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                          Całkowita Powierzchnia
                      </Label>
                      <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-bold text-gray-900">
                              {floorArea || '0'}
                          </span>
                          <span className="text-xl font-medium text-muted-foreground">m²</span>
                      </div>
                  </div>
                  {/* Right: Info */}
                  <div className="text-right text-xs text-muted-foreground">
                      {measurementRooms.length} pomieszczeń
                      <br/>
                      {floorPattern === 'herringbone' ? 'Jodełka' : 'Klasyk'}
                  </div>
             </div>
      </div>

      {/* 3. Rooms List (Simplified) */}
      <div className="space-y-3">
          <div className="flex items-center justify-between">
               <h3 className="font-semibold text-sm">Lista Pomieszczeń</h3>
               <Badge variant="outline" className="text-[10px]">{measurementRooms.length}</Badge>
          </div>
          <div className="space-y-2">
              {measurementRooms.map((room, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-card/50">
                       <span className="font-medium text-sm truncate">{room.name}</span>
                       <span className="font-mono text-sm">{room.area} m²</span>
                  </div>
              ))}
              {measurementRooms.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm italic bg-muted/20 rounded-lg">
                      Brak zdefiniowanych pomieszczeń.
                      <br />
                      Użyj &quot;Asystenta Pomiaru&quot; aby dodać.
                  </div>
              )}
          </div>
      </div>

      {/* 4. Materials & Installation Info */}
      <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm">Technologia i Materiały</h3>
          
          {/* Method Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
               <span className="text-sm font-medium">Metoda montażu</span>
               <div className="flex bg-muted p-1 rounded-md">
                   <button 
                      onClick={() => !isReadOnly && setInstallationMethod('click')}
                      className={cn(
                          "px-3 py-1 text-xs rounded-sm transition-all",
                          installationMethod === 'click' ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
                      )}
                   >
                       Pływająca
                   </button>
                   <button 
                      onClick={() => !isReadOnly && setInstallationMethod('glue')}
                      className={cn(
                          "px-3 py-1 text-xs rounded-sm transition-all",
                          installationMethod === 'glue' ? "bg-white shadow-sm font-medium" : "text-muted-foreground"
                      )}
                   >
                       Klejona
                   </button>
               </div>
          </div>

          {/* Quick Note Input */}
          <div className="space-y-2">
               <Label className="text-xs">Wymagane prace dodatkowe</Label>
               <div className="flex gap-2">
                   <Switch 
                       checked={additionalWorkNeeded} 
                       onCheckedChange={setAdditionalWorkNeeded}
                       disabled={isReadOnly}
                   />
                   <span className="text-sm">Tak, wymagane</span>
               </div>
               {additionalWorkNeeded && (
                   <Input 
                       value={additionalWorkDescription}
                       onChange={(e) => setAdditionalWorkDescription(e.target.value)}
                       placeholder="Opisz np. szlifowanie subitu..."
                       disabled={isReadOnly}
                       className="mt-2"
                   />
               )}
          </div>
      </div>

      {/* 5. Media (Carousel Style) */}
      <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm">Media i Szkice</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
               {/* Sketch Card */}
               <Card className="min-w-40 snap-center cursor-pointer border-dashed border-2 hover:border-primary/50 transition-colors">
                   <CardContent className="p-0 flex flex-col items-center justify-center h-[120px]">
                       {montage.sketchUrl ? (
                           <div className="relative w-full h-full">
                               {/* Using img for raw url */}
                               {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img 
                                   src={montage.sketchUrl} 
                                   alt="Szkic" 
                                   className="w-full h-full object-cover rounded-lg opacity-80" 
                               />
                               <Badge className="absolute bottom-2 right-2 text-[10px]">Szkic</Badge>
                           </div>
                       ) : (
                           <div className="text-center text-muted-foreground">
                               <Pencil className="w-6 h-6 mx-auto mb-2 opacity-50" />
                               <span className="text-xs">Brak szkicu</span>
                           </div>
                       )}
                   </CardContent>
               </Card>
               
               {/* Photos Placeholder */}
               {technicalAudit?.photos?.map((photo: string, i: number) => (
                   <Card key={i} className="min-w-40 snap-center overflow-hidden">
                       <CardContent className="p-0 h-[120px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={photo} alt={`Foto ${i}`} className="w-full h-full object-cover" />
                       </CardContent>
                   </Card>
               ))}

               {(!technicalAudit?.photos || technicalAudit.photos.length === 0) && (
                   <div className="min-w-[120px] h-[120px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                       <ImageIcon className="w-5 h-5 mb-1" />
                       <span className="text-[10px]">Brak zdjęć</span>
                   </div>
               )}
          </div>
      </div>
      
      {/* 6. Legal / Tax Switch */}
      <div className="flex items-center justify-between py-3 border-t">
           <div className="flex flex-col">
               <span className="text-sm font-medium">Buda. społ. (VAT 8%)</span>
               <span className="text-[10px] text-muted-foreground">Lokal mieszkalny do 150m²</span>
           </div>
           <Switch 
               checked={isHousingVat} 
               onCheckedChange={(checked) => !isReadOnly && setIsHousingVat(checked)}
               disabled={isReadOnly}
           />
      </div>

    </div>
  );
}
