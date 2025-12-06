'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Eraser, Plus, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

interface MontageMeasurementTabProps {
  montage: Montage;
}

export function MontageMeasurementTab({ montage }: MontageMeasurementTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
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
  const [panelWaste, setPanelWaste] = useState<string>(montage.panelWaste?.toString() || '5');
  const [skirtingModel, setSkirtingModel] = useState(montage.skirtingModel || '');
  const [skirtingWaste, setSkirtingWaste] = useState<string>(montage.skirtingWaste?.toString() || '5');
  const [modelsApproved, setModelsApproved] = useState(montage.modelsApproved || false);

  const [additionalInfo, setAdditionalInfo] = useState(montage.additionalInfo || '');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined
  );
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>(
    montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined
  );

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

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
          panelWaste: parseFloat(panelWaste),
          skirtingModel,
          skirtingWaste: parseFloat(skirtingWaste),
          modelsApproved,
          additionalInfo,
          sketchUrl: sketchDataUrl,
          scheduledInstallationAt: scheduledDate ? scheduledDate.getTime() : null,
          scheduledInstallationEndAt: scheduledEndDate ? scheduledEndDate.getTime() : null,
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
    panelWaste,
    skirtingModel,
    skirtingWaste,
    modelsApproved,
    additionalInfo,
    sketchDataUrl,
    scheduledDate,
    scheduledEndDate
  ]);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }

    const timer = setTimeout(() => {
      saveData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [saveData]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = async () => {
      if (!newTaskTitle.trim()) return;
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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Floor Calculator */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/5">
            <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Podłoga
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="floorArea" className="text-xs text-muted-foreground">Wymiar netto (m²)</Label>
                    <Input
                    id="floorArea"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={floorArea}
                    onChange={(e) => setFloorArea(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="panelWaste" className="text-xs text-muted-foreground">Zapas (%)</Label>
                    <Select value={panelWaste} onValueChange={setPanelWaste}>
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
                    <Input
                    id="panelModel"
                    placeholder="np. Dąb Naturalny"
                    value={panelModel}
                    onChange={(e) => setPanelModel(e.target.value)}
                    className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="panelAdditionalMaterials" className="text-xs text-muted-foreground">Dodatkowe (podkład, folia...)</Label>
                    <Input
                    id="panelAdditionalMaterials"
                    placeholder="np. podkład 5mm, folia paroizolacyjna"
                    value={panelAdditionalMaterials}
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
                    onChange={(e) => setSkirtingLength(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="skirtingWaste" className="text-xs text-muted-foreground">Zapas (%)</Label>
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
                    <Input
                    id="skirtingModel"
                    placeholder="np. Biała MDF 8cm"
                    value={skirtingModel}
                    onChange={(e) => setSkirtingModel(e.target.value)}
                    className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="skirtingAdditionalMaterials" className="text-xs text-muted-foreground">Dodatkowe (klej, narożniki...)</Label>
                    <Input
                    id="skirtingAdditionalMaterials"
                    placeholder="np. klej montażowy, narożniki wew."
                    value={skirtingAdditionalMaterials}
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
          </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="measurementDetails">Uwagi dotyczące listew i podłogi</Label>
            <Textarea
              id="measurementDetails"
              placeholder="Wymiary, uwagi techniczne..."
              value={measurementDetails}
              onChange={(e) => setMeasurementDetails(e.target.value)}
              className="min-h-[100px]"
            />
        </div>

        <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="modelsApproved" 
                checked={modelsApproved} 
                onCheckedChange={(checked) => setModelsApproved(checked as boolean)} 
              />
              <Label htmlFor="modelsApproved">Wybrane modele zaakceptowane przez klienta</Label>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data montażu (od)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data montażu (do)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledEndDate ? format(scheduledEndDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledEndDate}
                    onSelect={setScheduledEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Dodatkowe informacje</Label>
          <Textarea
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
                {measurementTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Brak zadań z pomiaru.</p>
                )}
            </div>

            <div className="flex gap-2">
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
            </div>
        </div>

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
    </div>
  );
}
