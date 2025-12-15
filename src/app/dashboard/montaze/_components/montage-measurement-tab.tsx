'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Eraser, Plus, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import type { Montage } from '../types';
import { updateMontageMeasurement, addMontageTask, toggleMontageTask } from '../actions';

import { Loader2, Check } from 'lucide-react';

import { ProductSelectorModal } from './product-selector-modal';

interface MontageMeasurementTabProps {
  montage: Montage;
  userRoles?: string[];
}

export function MontageMeasurementTab({ montage, userRoles = [] }: MontageMeasurementTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const isInstaller = userRoles.includes('installer') && !userRoles.includes('admin') && !userRoles.includes('measurer');
  const isReadOnly = isInstaller;

  const [isSketchOpen, setIsSketchOpen] = useState(false);
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(montage.sketchUrl || null);
  
  const [measurementDetails, setMeasurementDetails] = useState(montage.measurementDetails || '');
  const [floorArea, setFloorArea] = useState<string>(montage.floorArea?.toString() || '');
  // floorDetails repurposed as Panel Additional Materials
  const [panelAdditionalMaterials, setPanelAdditionalMaterials] = useState(montage.floorDetails || '');
  const [skirtingLength, setSkirtingLength] = useState<string>(montage.skirtingLength?.toString() || '');
  // skirtingDetails repurposed as Skirting Additional Materials
  const [skirtingAdditionalMaterials, setSkirtingAdditionalMaterials] = useState(montage.skirtingDetails || '');
  
  const [panelModel, setPanelModel] = useState(montage.panelModel || '');
  const [panelProductId, setPanelProductId] = useState<number | null>(montage.panelProductId || null);
  const [panelWaste, setPanelWaste] = useState<string>(montage.panelWaste?.toString() || '5');
  const [skirtingModel, setSkirtingModel] = useState(montage.skirtingModel || '');
  const [skirtingProductId, setSkirtingProductId] = useState<number | null>(montage.skirtingProductId || null);
  const [skirtingWaste, setSkirtingWaste] = useState<string>(montage.skirtingWaste?.toString() || '5');
  const [modelsApproved, setModelsApproved] = useState(montage.modelsApproved || false);

  const [installationMethod, setInstallationMethod] = useState<'click' | 'glue'>(
    (montage.measurementInstallationMethod as 'click' | 'glue') || 'click'
  );
  const [subfloorCondition, setSubfloorCondition] = useState(montage.measurementSubfloorCondition || 'good');
  const [additionalWorkNeeded, setAdditionalWorkNeeded] = useState(montage.measurementAdditionalWorkNeeded || false);
  const [additionalWorkDescription, setAdditionalWorkDescription] = useState(montage.measurementAdditionalWorkDescription || '');
  const [separateSkirting, setSeparateSkirting] = useState(montage.measurementSeparateSkirting || false);

  const [additionalInfo, setAdditionalInfo] = useState(montage.additionalInfo || '');
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
    to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  const [isPanelSelectorOpen, setIsPanelSelectorOpen] = useState(false);
  const [isSkirtingSelectorOpen, setIsSkirtingSelectorOpen] = useState(false);

  const saveData = useCallback(async () => {
      setIsSaving(true);
      try {
        await updateMontageMeasurement({
          montageId: montage.id,
          measurementDetails,
          floorArea: floorArea ? parseFloat(floorArea) : null,
          floorDetails: panelAdditionalMaterials,
          skirtingLength: skirtingLength ? parseFloat(skirtingLength) : null,
          skirtingDetails: skirtingAdditionalMaterials,
          panelModel,
          panelProductId,
          panelWaste: parseFloat(panelWaste),
          skirtingModel,
          skirtingProductId,
          skirtingWaste: parseFloat(skirtingWaste),
          modelsApproved,
          measurementInstallationMethod: installationMethod,
          measurementSubfloorCondition: subfloorCondition,
          measurementAdditionalWorkNeeded: additionalWorkNeeded,
          measurementAdditionalWorkDescription: additionalWorkDescription,
          measurementSeparateSkirting: separateSkirting,
          additionalInfo,
          sketchUrl: sketchDataUrl,
          scheduledInstallationAt: dateRange?.from ? dateRange.from.getTime() : null,
          scheduledInstallationEndAt: dateRange?.to ? dateRange.to.getTime() : null,
        });
        setLastSaved(new Date());
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
  }, [
    montage.id,
    measurementDetails,
    floorArea,
    panelAdditionalMaterials,
    skirtingLength,
    skirtingAdditionalMaterials,
    panelModel,
    panelProductId,
    panelWaste,
    skirtingModel,
    skirtingProductId,
    skirtingWaste,
    modelsApproved,
    installationMethod,
    subfloorCondition,
    additionalWorkNeeded,
    additionalWorkDescription,
    separateSkirting,
    additionalInfo,
    sketchDataUrl,
    dateRange,
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

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = async () => {
      if (!newTaskTitle.trim() || isReadOnly) return;
      startTransition(async () => {
          try {
              await addMontageTask({
                  montageId: montage.id,
                  title: newTaskTitle,
                  source: 'measurement'
              });
              setNewTaskTitle('');
              router.refresh();
          } catch (e) {
              console.error(e);
          }
      });
  };

  const measurementTasks = montage.tasks.filter(t => t.source === 'measurement');

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Karta Pomiarowa</h3>
          <p className="text-sm text-muted-foreground">
            Wprowadź szczegóły pomiaru, szkice i dodatkowe informacje.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
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

      <div className="space-y-6">
        <div className="grid gap-6 grid-cols-1">
          {/* Floor Calculator */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/5">
            <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Podłoga
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="floorArea" className="text-xs text-muted-foreground flex items-center gap-2">
                        Wymiar netto (m²)
                        {montage.status === 'lead' && montage.floorArea && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                                (Szacowany)
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
                <div className="space-y-1">
                    <Label htmlFor="panelAdditionalMaterials" className="text-xs text-muted-foreground">Dodatkowe (podkład, folia...)</Label>
                    <Input
                    id="panelAdditionalMaterials"
                    placeholder="np. podkład 5mm, folia paroizolacyjna"
                    value={panelAdditionalMaterials}
                    disabled={isReadOnly}
                    onChange={(e) => setPanelAdditionalMaterials(e.target.value)}
                    className="h-8 text-sm"
                    />
                </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Do zamówienia:</span>
                <span className="text-lg font-bold">
                    {floorArea ? (parseFloat(floorArea) * (1 + parseInt(panelWaste)/100)).toFixed(2) : '0.00'} m²
                </span>
            </div>
          </div>

          {/* Skirting Calculator */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/5">
            <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Listwy
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="skirtingLength" className="text-xs text-muted-foreground">Wymiar netto (mb)</Label>
                    <Input
                    id="skirtingLength"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={skirtingLength}
                    disabled={isReadOnly}
                    onChange={(e) => setSkirtingLength(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="skirtingWaste" className="text-xs text-muted-f disabled={isReadOnly}oreground">Zapas (%)</Label>
                    <Select value={skirtingWaste} onValueChange={setSkirtingWaste}>
                        <SelectTrigger id="skirtingWaste">
                            <SelectValue placeholder="Zapas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="7">7%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="15">15%</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-dashed">
                <div className="space-y-1">
                    <Label htmlFor="skirtingModel" className="text-xs text-muted-foreground">Model listew</Label>
                    <div className="flex gap-2">
                        <Input
                            id="skirtingModel"
                            placeholder="Kliknij aby wybrać z listy..."
                            value={skirtingModel}
                            readOnly!isReadOnly && setIsSkirtingSelectorOpen(true)}
                            className="h-8 text-sm flex-1 cursor-pointer bg-muted/50"
                            disabled={isReadOnly}
                        />
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => setIsSkirtingSelectorOpen(true)}
                            disabled={isReadOnly
                            onClick={() => setIsSkirtingSelectorOpen(true)}
                        >
                            Wybierz
                        </Button>
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="skirtingAdditionalMaterials" className="text-xs text-muted-foreground">Dodatkowe (klej, narożniki...)</Label>
                    <Input
                    id="skirtingAdditionalMaterials"
                    placeholder="np. klej montażowy, narożniki wew."
                    value={skirtingAdditionalMaterials}
                    disabled={isReadOnly}
                    onChange={(e) => setSkirtingAdditionalMaterials(e.target.value)}
                    className="h-8 text-sm"
                    />
                </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Do zamówienia:</span>
                <span className="text-lg font-bold">
                    {skirtingLength ? (parseFloat(skirtingLength) * (1 + parseInt(skirtingWaste)/100)).toFixed(2) : '0.00'} mb
                </span>
            </div>
            
            <div className="pt-2 border-t flex items-center space-x-2">
                <Checkbox 
                    disabled={isReadOnly}
                    id="separateSkirting" 
                    checked={separateSkirting} 
                    onCheckedChange={(checked) => setSeparateSkirting(checked as boolean)} 
                />
                <Label htmlFor="separateSkirting" className="text-sm font-medium">Zalecany montaż listew w osobnym terminie</Label>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid gap-6 md:grid-cols-2 p-4 border rounded-lg bg-muted/5"> disabled={isReadOnly}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Sposób montażu</Label>
                    <RadioGroup value={installationMethod} onValueChange={(v) => setInstallationMethod(v as 'click' | 'glue')} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="click" id="method-click" />
                            <Label htmlFor="method-click">Pływająca (Click)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="glue" id="method-glue" />
                            <Label htmlFor="method-glue">Klejona</Label>
                        </div>
                    </RadioGroup>
                </div> disabled={isReadOnly}

                <div className="space-y-2">
                    <Label>Stan podłoża</Label>
                    <Select value={subfloorCondition} onValueChange={setSubfloorCondition}>
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
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="additionalWork" className="flex flex-col gap-1">
                        <span>Dodatkowe prace</span>
                        <span className="font-normal text-xs text-muted-foreground">Czy wymagane są dodatkowe prace przygotowawcze?</span>
                    </Label>
                    <Switch
                        id="additionalWork"
                        disabled={isReadOnly}
                        checked={additionalWorkNeeded}
                        onCheckedChange={setAdditionalWorkNeeded}
                    />
                </div>
                
                {additionalWorkNeeded && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="additionalWorkDesc">Opis prac dodatkowych</Label>
                        <Textarea
                            id="additionalWorkDesc"
                            placeholder="Opisz co trzeba zrobić (np. szlifowanie, gruntowanie, wylewka...)"
                            disabled={isReadOnly}
                            value={additionalWorkDescription}
                            onChange={(e) => setAdditionalWorkDescription(e.target.value)}
                            className="h-20"
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                disabled={isReadOnly}
                id="modelsApproved" 
                checked={modelsApproved} 
                onCheckedChange={(checked) => setModelsApproved(checked as boolean)} 
              />
              <Label htmlFor="modelsApproved">Wybrane modele zaakceptowane przez klienta</Label>
            </div>
        </div>

        <div className="grid gap-4">
            <div className="space-y-2">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Uwagi z pomiaru</Label>
          <Textarea
            disabled={isReadOnly}
            id="additionalInfo"
            placeholder="Inne uwagi, ustalenia z klientem..."
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </div>

        {/* Measurement Tasks */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground mb-2">Zadania z pomiaru</h4>
            
            <div className="space-y-2">
                {measurementTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                        <Checkbox 
                            checked={task.completed} 
                            onCheckedChange={(checked) => {
                                startTransition(async () => {
                                    await toggleMontageTask({
                                        taskId: task.id,
                                        montageId: montage.id,
                            disabled={isReadOnly}
                                        completed: !!checked
                                    });
                                    router.refresh();
                                });
                            }}
                        />
                        <span className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>
                            {task.title}
                        </span>
                    </div>
                ))}
                {!isReadOnly && (
                    <>
                        <Input 
                            placeholder="Dodaj nowe zadanie..." 
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTask();
                                }
                            }}
                        />
                        <Button type="button" onClick={handleAddTask} disabled={!newTaskTitle.trim() || isPending} size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </>
                )}   handleAddTask();
                        }
                    }}
                />
              {!isReadOnly && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    {sketchDataUrl ? 'Edytuj szkic' : 'Rysuj'}
                    </Button>
                </DialogTrigger>
              )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Szkic sytuacyjny</Label>
            <Dialog open={isSketchOpen} onOpenChange={setIsSketchOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  {sketchDataUrl ? 'Edytuj szkic' : 'Rysuj'}
                </Button>
              </DialogTrigger>
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
          </div>
          
          <div className="border rounded-md overflow-hidden min-h-[150px] flex items-center justify-center bg-muted/10">
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
        </div>

        {/* Removed Save Button */}
            </div>
            
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
                isOpen={isSkirtingSelectorOpen}
                onClose={() => setIsSkirtingSelectorOpen(false)}
                onSelect={(product) => {
                    setSkirtingModel(product.name);
                    setSkirtingProductId(product.id);
                    setIsSkirtingSelectorOpen(false);
                }}
                type="skirting"
            />
        </div>
    );
}