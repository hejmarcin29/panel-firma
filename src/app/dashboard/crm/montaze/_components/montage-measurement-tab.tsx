'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Eraser, Plus, Pencil } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import type { Montage, MeasurementMaterialItem } from '../types';
import { updateMontageMeasurement } from '../actions';

import { Loader2, Check, Upload, FileIcon, ExternalLink, Trash2, Info, Search } from 'lucide-react';

import { ProductSelectorModal } from './product-selector-modal';
import { ServiceSelector } from './service-selector';
import { AuditForm } from './technical/audit-form';
import type { TechnicalAuditData } from '../technical-data';
import { addMontageAttachment } from '../actions';
import { MontageSubCategories } from '@/lib/r2/constants';

import { MeasurementAssistantModal } from './measurement-assistant-modal';
import { CostEstimationModal } from './cost-estimation-modal';
import { updateMontageCostEstimation } from '../actions';
import { getEstimatedBaseService } from '../actions-services';

interface MontageMeasurementTabProps {
  montage: Montage;
  userRoles?: string[];
  defaultOpenModal?: 'assistant' | 'costEstimation';
}

export function MontageMeasurementTab({ montage, userRoles = [], defaultOpenModal }: MontageMeasurementTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const isLockedBySettlement = montage.settlement?.status === 'approved' || montage.settlement?.status === 'paid';
  const isReadOnly = (!userRoles.includes('admin') && !userRoles.includes('installer')) || isLockedBySettlement;

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCostEstimationOpen, setIsCostEstimationOpen] = useState(false);
  const [baseServicePrice, setBaseServicePrice] = useState<number | undefined>(undefined);
  const [baseServiceName, setBaseServiceName] = useState<string>('Montaż podłogi');

  useEffect(() => {
      if (defaultOpenModal === 'assistant') {
          setIsAssistantOpen(true);
      } else if (defaultOpenModal === 'costEstimation') {
          setIsCostEstimationOpen(true);
      }
  }, [defaultOpenModal]);

  const [isSketchOpen, setIsSketchOpen] = useState(false);
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(montage.sketchUrl || null);
  
  const [measurementDetails] = useState(montage.measurementDetails || '');
  const [floorArea, setFloorArea] = useState<string>(montage.floorArea?.toString() || '');
  // floorDetails repurposed as Panel Additional Materials
  const [panelAdditionalMaterials, setPanelAdditionalMaterials] = useState(montage.floorDetails || '');
  
  const [panelModel, setPanelModel] = useState(montage.panelModel || '');
  const [panelProductId, setPanelProductId] = useState<number | null>(montage.panelProductId || null);
  const [panelWaste, setPanelWaste] = useState<string>(montage.panelWaste?.toString() || '5');
  const [modelsApproved, setModelsApproved] = useState(montage.modelsApproved || false);

  const [installationMethod, setInstallationMethod] = useState<'click' | 'glue'>(
    (montage.measurementInstallationMethod as 'click' | 'glue') || 'click'
  );
  const [floorPattern, setFloorPattern] = useState<'classic' | 'herringbone'>(
    (montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic'
  );

  // Fetch base service price when modal opens
  useEffect(() => {
      if (isCostEstimationOpen) {
          const fetchPrice = async () => {
              try {
                  const service = await getEstimatedBaseService(
                      installationMethod || 'click',
                      floorPattern || 'classic',
                      montage.id
                  );
                  if (service) {
                      setBaseServicePrice(service.basePriceNet || 0);
                      setBaseServiceName(service.name);
                  }
              } catch (e) {
                  console.error("Failed to fetch base service price", e);
              }
          };
          fetchPrice();
      }
  }, [isCostEstimationOpen, installationMethod, floorPattern, montage.id]);
  const [subfloorCondition, setSubfloorCondition] = useState(montage.measurementSubfloorCondition || 'good');
  const [additionalWorkNeeded, setAdditionalWorkNeeded] = useState(montage.measurementAdditionalWorkNeeded || false);
  const [additionalWorkDescription, setAdditionalWorkDescription] = useState(montage.measurementAdditionalWorkDescription || '');
  const [additionalMaterials, setAdditionalMaterials] = useState<MeasurementMaterialItem[]>(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = montage.measurementAdditionalMaterials as any;
      if (Array.isArray(raw)) return raw;
      // Fallback for legacy string or null
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
  
  // Additional Services State (for Cost Estimation)
  // We don't have a direct field in montage for this yet, so we might need to fetch it or assume it's empty initially
  // For now, let's initialize it as empty array. In a real scenario, we would fetch existing service items linked to this montage.
  const [additionalServices, setAdditionalServices] = useState<{ id: string; name: string; quantity: number; unit: string; price: number }[]>([]);

  const [isHousingVat, setIsHousingVat] = useState(montage.isHousingVat ?? true);

  const [additionalInfo, setAdditionalInfo] = useState(montage.additionalInfo || '');
  
  const [measurementDate, setMeasurementDate] = useState(
    montage.measurementDate 
      ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
      : ""
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
    to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  const [isPanelSelectorOpen, setIsPanelSelectorOpen] = useState(false);
  const [isAccessorySelectorOpen, setIsAccessorySelectorOpen] = useState(false);
  const [currentAccessoryIndex, setCurrentAccessoryIndex] = useState<number | null>(null);

  useEffect(() => {
    setSketchDataUrl(montage.sketchUrl || null);
    setFloorArea(montage.floorArea?.toString() || '');
    setPanelAdditionalMaterials(montage.floorDetails || '');
    setPanelModel(montage.panelModel || '');
    setPanelProductId(montage.panelProductId || null);
    setPanelWaste(montage.panelWaste?.toString() || '5');
    setModelsApproved(montage.modelsApproved || false);
    setInstallationMethod((montage.measurementInstallationMethod as 'click' | 'glue') || 'click');
    setFloorPattern((montage.measurementFloorPattern as 'classic' | 'herringbone') || 'classic');
    setSubfloorCondition(montage.measurementSubfloorCondition || 'good');
    setAdditionalWorkNeeded(montage.measurementAdditionalWorkNeeded || false);
    setAdditionalWorkDescription(montage.measurementAdditionalWorkDescription || '');
    
    const rawMaterials = montage.measurementAdditionalMaterials;
    if (Array.isArray(rawMaterials)) {
        setAdditionalMaterials(rawMaterials);
    } else if (typeof rawMaterials === 'string' && (rawMaterials as string).trim().length > 0) {
        setAdditionalMaterials([{
            id: 'legacy-1',
            name: rawMaterials as string,
            quantity: '',
            supplySide: 'installer'
        }]);
    } else {
        setAdditionalMaterials([]);
    }

    setAdditionalInfo(montage.additionalInfo || '');
    setMeasurementDate(
      montage.measurementDate 
        ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
        : ""
    );
    setDateRange({
        from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
        to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montage.id]);

  const technicalAudit = montage.technicalAudit as unknown as TechnicalAuditData | null;

  const saveCostEstimation = useCallback(async (completed: boolean = false) => {
      setIsSaving(true);
      try {
          await updateMontageCostEstimation({
              montageId: montage.id,
              measurementAdditionalMaterials: additionalMaterials,
              additionalServices: additionalServices,
              completed
          });
          setLastSaved(new Date());
          router.refresh();
      } catch (err) {
          console.error("Cost estimation save failed", err);
      } finally {
          setIsSaving(false);
      }
  }, [montage.id, additionalMaterials, additionalServices, router]);

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
          additionalInfo,
          sketchUrl: sketchDataUrl,
          scheduledInstallationAt: dateRange?.from ? dateRange.from.getTime() : null,
          scheduledInstallationEndAt: dateRange?.to ? dateRange.to.getTime() : null,
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
    montage.id,
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
    additionalInfo,
    sketchDataUrl,
    dateRange,
    measurementDate,
  ]);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }

    if (isReadOnly) return;

    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [saveData, isReadOnly]);

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = 300; // Fixed height for now
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        setContext(ctx);
      }
    }
  }, []);

  useEffect(() => {
    if (isSketchOpen && sketchDataUrl && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            const img = new Image();
            img.onload = () => {
                context.drawImage(img, 0, 0);
            };
            img.src = sketchDataUrl;
        }
    }
  }, [isSketchOpen, sketchDataUrl]);

  const saveSketch = () => {
    if (canvasRef.current) {
      setSketchDataUrl(canvasRef.current.toDataURL());
    }
    setIsSketchOpen(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    const { offsetX, offsetY } = getCoordinates(e);
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      };
    }
  };

  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="space-y-6">
      {isLockedBySettlement && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800">Edycja zablokowana</h4>
              <p className="text-sm text-amber-700">
                Do tego montażu istnieje zatwierdzone rozliczenie finansowe. 
                Aby wprowadzić zmiany w pomiarach, musisz najpierw cofnąć lub usunąć rozliczenie.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Karta Pomiarowa</h3>
          <p className="text-sm text-muted-foreground">
            Wprowadź szczegóły pomiaru, szkice i dodatkowe informacje.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
            {!isReadOnly && (
                <div className="flex items-center gap-2">
                    {/* Stage 2: Cost Estimation Button (Visible only if measurement is started) */}
                    {((floorArea && parseFloat(floorArea) > 0) || measurementDate) && (
                        <Button
                            onClick={() => setIsCostEstimationOpen(true)}
                            variant="outline"
                            className="border-green-600 text-green-700 hover:bg-green-50"
                        >
                            <span className="mr-2">💰</span>
                            Edytuj Kosztorys
                        </Button>
                    )}

                    <div className="flex flex-col items-end gap-1">
                        <Button 
                            onClick={() => setIsAssistantOpen(true)}
                            className={cn(
                                "shadow-md transition-all",
                                ((floorArea && parseFloat(floorArea) > 0) || measurementDate)
                                    ? "bg-amber-500 hover:bg-amber-600 text-white" 
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                        >
                            <span className="mr-2">{((floorArea && parseFloat(floorArea) > 0) || measurementDate) ? "✏️" : "🚀"}</span>
                            {((floorArea && parseFloat(floorArea) > 0) || measurementDate) ? "Edytuj Pomiar" : "Uruchom Asystenta"}
                        </Button>
                        {((floorArea && parseFloat(floorArea) > 0) || measurementDate) && montage.updatedAt && (
                             <span className="text-xs text-muted-foreground">
                                Ostatnia edycja: {formatDistanceToNow(new Date(montage.updatedAt), { addSuffix: true, locale: pl })}
                             </span>
                        )}
                    </div>
                </div>
            )}
            {isSaving ? (
                <span className="text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Zapisywanie...
                </span>
            ) : lastSaved ? (
                <span className="text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Zapisano {lastSaved.toLocaleTimeString()}
                </span>
            ) : null}
        </div>
      </div>

      <MeasurementAssistantModal
        key={isAssistantOpen ? 'open' : 'closed'}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onSave={() => {
            saveData();
            setIsAssistantOpen(false);
        }}
        measurementDate={measurementDate}
        setMeasurementDate={setMeasurementDate}
        isHousingVat={isHousingVat}
        setIsHousingVat={setIsHousingVat}
        subfloorCondition={subfloorCondition}
        setSubfloorCondition={setSubfloorCondition}
        technicalAudit={technicalAudit}
        montageId={montage.id}
        installationMethod={installationMethod}
        setInstallationMethod={setInstallationMethod}
        floorPattern={floorPattern}
        setFloorPattern={setFloorPattern}
        panelWaste={panelWaste}
        setPanelWaste={setPanelWaste}
        floorArea={floorArea}
        setFloorArea={setFloorArea}
        panelModel={panelModel}
        setIsPanelSelectorOpen={setIsPanelSelectorOpen}
        additionalMaterials={additionalMaterials}
        setAdditionalMaterials={setAdditionalMaterials}
      />

      <CostEstimationModal
        isOpen={isCostEstimationOpen}
        onClose={() => setIsCostEstimationOpen(false)}
        onSave={(completed) => {
            saveCostEstimation(completed);
            setIsCostEstimationOpen(false);
        }}
        measurementDate={measurementDate}
        additionalWorkDescription={additionalWorkDescription}
        baseService={{
            name: baseServiceName,
            quantity: montage.floorArea || 0,
            unit: 'm2',
            price: baseServicePrice
        }}
        additionalMaterials={additionalMaterials}
        setAdditionalMaterials={setAdditionalMaterials}
        additionalServices={additionalServices}
        setAdditionalServices={setAdditionalServices}
      />

<Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Główne Dane</TabsTrigger>
          <TabsTrigger value="additional">Prace i Materiały</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6 mt-4">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className={cn("border-l-4", measurementDate ? "border-l-green-500" : "border-l-orange-500")}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Termin Pomiaru
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="grid gap-1.5 flex-1">
                                <Label htmlFor="measurementDate">Data i godzina wizyty</Label>
                                <Input
                                    id="measurementDate"
                                    type="datetime-local"
                                    value={measurementDate}
                                    onChange={(e) => setMeasurementDate(e.target.value)}
                                    disabled={isReadOnly}
                                    className="max-w-[200px]"
                                />
                            </div>
                            {!measurementDate && (
                                <div className="text-sm text-orange-600 font-medium">
                                    Nie ustalono terminu!
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn("border-l-4", isHousingVat ? "border-l-green-500" : "border-l-gray-300")}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <FileIcon className="h-4 w-4" />
                            Ustalenia Podatkowe
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isHousingVat"
                                checked={isHousingVat}
                                onCheckedChange={setIsHousingVat}
                                disabled={isReadOnly}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="isHousingVat" className="text-base font-medium cursor-pointer">
                                    Budownictwo objęte społecznym programem mieszkaniowym (VAT 8%)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Lokal mieszkalny do 150m² lub dom jednorodzinny do 300m².
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Technical Audit */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Audyt Techniczny Podłoża</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Stan podłoża (wstępna ocena)</Label>
                                <Select value={subfloorCondition} onValueChange={setSubfloorCondition} disabled={isReadOnly}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz stan podłoża" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ideal">Idealne (bez uwag)</SelectItem>
                                        <SelectItem value="good">Dobre (drobne nierówności)</SelectItem>
                                        <SelectItem value="bad">Złe (wymaga szlifowania/naprawy)</SelectItem>
                                        <SelectItem value="critical">Krytyczne (wymaga wylewki)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label>Termin montażu</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        disabled={isReadOnly}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateRange?.from && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                            {format(dateRange.from, "PPP", { locale: pl })} -{" "}
                                            {format(dateRange.to, "PPP", { locale: pl })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "PPP", { locale: pl })
                                        )
                                        ) : (
                                        <span>Wybierz termin montażu</span>
                                        )}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                        locale={pl}
                                        classNames={{
                                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                            day_today: "bg-accent text-accent-foreground",
                                        }}
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="pt-4 border-t">
                                <AuditForm 
                                    montageId={montage.id} 
                                    initialData={technicalAudit} 
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </CardContent>
                    </Card>
            </div>

            {/* Sketch */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-medium">Szkic sytuacyjny</CardTitle>
                    <Dialog open={isSketchOpen} onOpenChange={setIsSketchOpen}>
                        {!isReadOnly && (
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" />
                                {sketchDataUrl ? 'Edytuj szkic' : 'Rysuj'}
                                </Button>
                            </DialogTrigger>
                        )}
                        <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                            <DialogTitle>Szkic sytuacyjny</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 border rounded-md overflow-hidden bg-white touch-none relative">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-full cursor-crosshair absolute inset-0"
                                width={800}
                                height={600}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            </div>
                            <div className="flex justify-between items-center mt-4">
                            <Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>
                                <Eraser className="mr-2 h-4 w-4" />
                                Wyczyść
                            </Button>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsSketchOpen(false)}>Anuluj</Button>
                                <Button type="button" onClick={saveSketch}>Zatwierdź</Button>
                            </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Możesz rysować palcem na urządzeniach mobilnych lub myszką.
                            </p>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden min-h-[200px] flex items-center justify-center bg-muted/10">
                        {sketchDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={sketchDataUrl} alt="Szkic" className="w-full h-auto max-h-[300px] object-contain" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                                <Pencil className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Brak szkicu. Kliknij &quot;Rysuj&quot; aby dodać.</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 mt-4">
                        <Label htmlFor="additionalInfo">Uwagi z pomiaru</Label>
                        <Textarea
                            disabled={isReadOnly}
                            id="additionalInfo"
                            placeholder="Inne uwagi, ustalenia z klientem..."
                            value={additionalInfo}
                            onChange={(e) => setAdditionalInfo(e.target.value)}
                            className="min-h-20"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Measurement Attachments */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                        Zdjęcia z pomiaru
                    </CardTitle>
                    {!isReadOnly && (
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (!files || files.length === 0) return;

                                    startTransition(async () => {
                                        try {
                                            for (let i = 0; i < files.length; i++) {
                                                const file = files[i];
                                                const formData = new FormData();
                                                formData.append("montageId", montage.id);
                                                formData.append("file", file);
                                                formData.append("title", file.name);
                                                formData.append("category", MontageSubCategories.MEASUREMENT_BEFORE);
                                                
                                                await addMontageAttachment(formData);
                                            }
                                            router.refresh();
                                        } catch (error) {
                                            console.error(error);
                                            alert("Wystąpił błąd podczas przesyłania plików.");
                                        }
                                        // Reset input
                                        e.target.value = "";
                                    });
                                }}
                            />
                            <Button variant="outline" size="sm" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                Dodaj zdjęcia
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {montage.attachments
                            ?.filter(att => att.url.includes(MontageSubCategories.MEASUREMENT_BEFORE))
                            .map((att) => (
                            <div key={att.id} className="group relative aspect-square rounded-lg border bg-background overflow-hidden">
                                {/\.(jpg|jpeg|png|gif|webp)$/i.test(att.url) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={att.url} 
                                        alt={att.title || 'Załącznik'} 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2">
                                        <FileIcon className="h-8 w-8 mb-2" />
                                        <span className="text-xs text-center truncate w-full">{att.title}</span>
                                    </div>
                                )}
                                <a 
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                >
                                    <ExternalLink className="text-white h-6 w-6 drop-shadow-md" />
                                </a>
                            </div>
                        ))}
                        {(!montage.attachments || !montage.attachments.some(att => att.url.includes(MontageSubCategories.MEASUREMENT_BEFORE))) && (
                            <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
                                Brak zdjęć z pomiaru.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="additional" className="space-y-6 mt-4">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Installation Specs */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium">Specyfikacja Montażu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Wzór ułożenia</Label>
                            <RadioGroup 
                                value={floorPattern} 
                                onValueChange={(v) => {
                                    const val = v as 'classic' | 'herringbone';
                                    setFloorPattern(val);
                                    if (val === 'herringbone') {
                                        setPanelWaste('12');
                                    } else {
                                        setPanelWaste('5');
                                    }
                                }} 
                                className="flex gap-4" 
                                disabled={isReadOnly}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="classic" id="pattern-classic" />
                                    <Label htmlFor="pattern-classic">Klasycznie</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="herringbone" id="pattern-herringbone" />
                                    <Label htmlFor="pattern-herringbone">Jodełka</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label>Sposób montażu</Label>
                            <RadioGroup value={installationMethod} onValueChange={(v) => setInstallationMethod(v as 'click' | 'glue')} className="flex gap-4" disabled={isReadOnly}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="click" id="method-click" />
                                    <Label htmlFor="method-click">Pływająca (Click)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="glue" id="method-glue" />
                                    <Label htmlFor="method-glue">Klejona</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                {/* Floor Calculator */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            Podłoga
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="floorArea" className="text-xs text-muted-foreground flex items-center gap-2">
                                    Wymiar netto (m²)
                                    {montage.estimatedFloorArea && (
                                        <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                            (Klient: {montage.estimatedFloorArea} m²)
                                        </span>
                                    )}
                                </Label>
                                <Input
                                id="floorArea"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={floorArea}
                                onChange={(e) => setFloorArea(e.target.value)}
                                disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="panelWaste" className="text-xs text-muted-foreground">Zapas (%)</Label>
                                <Select value={panelWaste} onValueChange={setPanelWaste} disabled={isReadOnly}>
                                    <SelectTrigger id="panelWaste">
                                        <SelectValue placeholder="Zapas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0%</SelectItem>
                                        <SelectItem value="5">5%</SelectItem>
                                        <SelectItem value="7">7%</SelectItem>
                                        <SelectItem value="10">10%</SelectItem>
                                        <SelectItem value="12">12%</SelectItem>
                                        <SelectItem value="15">15%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-dashed">
                            <div className="space-y-1">
                                <Label htmlFor="panelModel" className="text-xs text-muted-foreground">Model paneli</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="panelModel"
                                        placeholder="Kliknij aby wybrać z listy..."
                                        value={panelModel}
                                        readOnly
                                        onClick={() => !isReadOnly && setIsPanelSelectorOpen(true)}
                                        className="h-8 text-sm flex-1 cursor-pointer bg-muted/50"
                                        disabled={isReadOnly}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-2"
                                        onClick={() => setIsPanelSelectorOpen(true)}
                                        disabled={isReadOnly}
                                    >
                                        Wybierz
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Do zamówienia:</span>
                            <span className="text-lg font-bold">
                                {floorArea ? (parseFloat(floorArea) * (1 + parseInt(panelWaste)/100)).toFixed(2) : '0.00'} m²
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Services */}
                <ServiceSelector 
                    montageId={montage.id}
                    floorArea={parseFloat(floorArea) || 0}
                    isReadOnly={isReadOnly}
                />
            </div>

            {/* Additional Work */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium">Materiały dodatkowe</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>Lista zakupów</Label>
                                    <Drawer>
                                        <DrawerTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DrawerTrigger>
                                        <DrawerContent>
                                            <DrawerHeader>
                                                <DrawerTitle>Instrukcja zakupów</DrawerTitle>
                                                <DrawerDescription>
                                                    Wpisz co trzeba dokupić. Jeśli kupujesz Ty (Montażysta), podaj szacunkowy koszt.
                                                    Możesz to uzupełnić teraz lub na spokojnie po powrocie.
                                                    Pozycje bez ceny będą oznaczone jako wymagające uzupełnienia.
                                                </DrawerDescription>
                                            </DrawerHeader>
                                            <DrawerFooter>
                                                <DrawerClose asChild>
                                                    <Button variant="outline">Rozumiem</Button>
                                                </DrawerClose>
                                            </DrawerFooter>
                                        </DrawerContent>
                                    </Drawer>
                                </div>
                                {!isReadOnly && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setAdditionalMaterials([
                                                ...additionalMaterials,
                                                {
                                                    id: crypto.randomUUID(),
                                                    name: '',
                                                    quantity: '',
                                                    supplySide: 'installer'
                                                }
                                            ]);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Dodaj pozycję
                                    </Button>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                {additionalMaterials.length === 0 && (
                                    <div className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                                        Brak dodatkowych materiałów.
                                    </div>
                                )}
                                {additionalMaterials.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-1 gap-3 p-3 border rounded-md bg-muted/20">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Co potrzeba? (np. Klej montażowy)"
                                                        value={item.name}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => {
                                                            const newItems = [...additionalMaterials];
                                                            newItems[index].name = e.target.value;
                                                            setAdditionalMaterials(newItems);
                                                        }}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        disabled={isReadOnly}
                                                        onClick={() => {
                                                            setCurrentAccessoryIndex(index);
                                                            setIsAccessorySelectorOpen(true);
                                                        }}
                                                        title="Wybierz z bazy"
                                                    >
                                                        <Search className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="w-1/3 space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground uppercase">Ilość</Label>
                                                        <div className="flex gap-1">
                                                            <Input
                                                                placeholder="2"
                                                                value={item.quantity}
                                                                disabled={isReadOnly}
                                                                onChange={(e) => {
                                                                    const newItems = [...additionalMaterials];
                                                                    newItems[index].quantity = e.target.value;
                                                                    setAdditionalMaterials(newItems);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Select
                                                                disabled={isReadOnly}
                                                                value={item.unit || 'opak.'}
                                                                onValueChange={(val) => {
                                                                    const newItems = [...additionalMaterials];
                                                                    newItems[index].unit = val;
                                                                    setAdditionalMaterials(newItems);
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-[65px] px-1">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="szt">szt</SelectItem>
                                                                    <SelectItem value="opak.">opak.</SelectItem>
                                                                    <SelectItem value="mb">mb</SelectItem>
                                                                    <SelectItem value="m2">m²</SelectItem>
                                                                    <SelectItem value="kg">kg</SelectItem>
                                                                    <SelectItem value="l">l</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="w-2/3 space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground uppercase">Kto zapewnia?</Label>
                                                        <Select
                                                            disabled={isReadOnly}
                                                            value={item.supplySide}
                                                            onValueChange={(val: 'installer' | 'company') => {
                                                                const newItems = [...additionalMaterials];
                                                                newItems[index].supplySide = val;
                                                                setAdditionalMaterials(newItems);
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="installer">Kupuje Montażysta</SelectItem>
                                                                <SelectItem value="company">Zapewnia Firma</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                {item.supplySide === 'installer' && (
                                                    <div className="space-y-1 pt-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Koszt zakupu</Label>
                                                            <div className="flex items-center gap-1">
                                                                <Label htmlFor={`tab-gross-${item.id}`} className="text-[10px] cursor-pointer select-none text-muted-foreground">Brutto (23%)</Label>
                                                                <input 
                                                                    type="checkbox" 
                                                                    id={`tab-gross-${item.id}`}
                                                                    className="accent-blue-600 h-3 w-3"
                                                                    disabled={isReadOnly}
                                                                    onChange={(e) => {
                                                                        const el = document.getElementById(`tab-cost-input-${item.id}`) as HTMLInputElement;
                                                                        if (el) {
                                                                            el.dataset.isGross = e.target.checked ? 'true' : 'false';
                                                                            if (item.estimatedCost) {
                                                                                if (e.target.checked) {
                                                                                    el.value = (item.estimatedCost * 1.23).toFixed(2);
                                                                                } else {
                                                                                    el.value = item.estimatedCost.toFixed(2);
                                                                                }
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <Input
                                                                id={`tab-cost-input-${item.id}`}
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                defaultValue={item.estimatedCost?.toFixed(2)}
                                                                disabled={isReadOnly}
                                                                onChange={(e) => {
                                                                    const isGross = e.target.dataset.isGross === 'true';
                                                                    const val = parseFloat(e.target.value);
                                                                    
                                                                    const newItems = [...additionalMaterials];
                                                                    if (!isNaN(val)) {
                                                                        newItems[index].estimatedCost = isGross ? val / 1.23 : val;
                                                                    } else {
                                                                        newItems[index].estimatedCost = undefined;
                                                                    }
                                                                    setAdditionalMaterials(newItems);
                                                                }}
                                                                className="pl-8 h-8 text-sm"
                                                            />
                                                            <span className="absolute left-2 top-2 text-xs text-muted-foreground">PLN</span>
                                                            {item.estimatedCost && (
                                                                <span className="absolute right-8 top-2 text-[10px] text-muted-foreground">
                                                                    netto: {item.estimatedCost.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {!isReadOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive/90"
                                                    onClick={() => {
                                                        const newItems = additionalMaterials.filter((_, i) => i !== index);
                                                        setAdditionalMaterials(newItems);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Form */}
                {/* Moved to Technical Details in Main Tab */}
            </div>
        </TabsContent>
      </Tabs>



            <ProductSelectorModal
                isOpen={isPanelSelectorOpen}
                onClose={() => setIsPanelSelectorOpen(false)}
                onSelect={(product) => {
                    setPanelModel(product.name);
                    setPanelProductId(product.id);
                    setIsPanelSelectorOpen(false);
                }}
                type="panel"
            />

            <ProductSelectorModal
                isOpen={isAccessorySelectorOpen}
                onClose={() => {
                    setIsAccessorySelectorOpen(false);
                    setCurrentAccessoryIndex(null);
                }}
                onSelect={(product) => {
                    if (currentAccessoryIndex !== null) {
                        const newItems = [...additionalMaterials];
                        newItems[currentAccessoryIndex].name = product.name;
                        setAdditionalMaterials(newItems);
                    }
                    setIsAccessorySelectorOpen(false);
                    setCurrentAccessoryIndex(null);
                }}
                type="accessory"
            />
        </div>
    );
}