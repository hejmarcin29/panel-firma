'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Eraser } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Montage } from '../types';
import { updateMontageMeasurement } from '../actions';

interface MontageMeasurementTabProps {
  montage: Montage;
}

export function MontageMeasurementTab({ montage }: MontageMeasurementTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [measurementDetails, setMeasurementDetails] = useState(montage.measurementDetails || '');
  const [floorArea, setFloorArea] = useState<string>(montage.floorArea?.toString() || '');
  const [floorDetails, setFloorDetails] = useState(montage.floorDetails || '');
  const [skirtingLength, setSkirtingLength] = useState<string>(montage.skirtingLength?.toString() || '');
  const [skirtingDetails, setSkirtingDetails] = useState(montage.skirtingDetails || '');
  const [panelType, setPanelType] = useState(montage.panelType || '');
  const [additionalInfo, setAdditionalInfo] = useState(montage.additionalInfo || '');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined
  );
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>(
    montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined
  );

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await updateMontageMeasurement({
          montageId: montage.id,
          measurementDetails,
          floorArea: floorArea ? parseFloat(floorArea) : null,
          floorDetails,
          skirtingLength: skirtingLength ? parseFloat(skirtingLength) : null,
          skirtingDetails,
          panelType,
          additionalInfo,
          scheduledInstallationAt: scheduledDate ? scheduledDate.getTime() : null,
          scheduledInstallationEndAt: scheduledEndDate ? scheduledEndDate.getTime() : null,
        });
        setFeedback('Zapisano dane pomiarowe.');
        router.refresh();
      } catch (err) {
        setError('Wystąpił błąd podczas zapisywania.');
        console.error(err);
      }
    });
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
        {feedback && <div className="text-sm text-green-600">{feedback}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="floorArea">Pomiar podłoga (m²)</Label>
            <Input
              id="floorArea"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={floorArea}
              onChange={(e) => setFloorArea(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floorDetails">Szczegóły podłogi</Label>
            <Input
              id="floorDetails"
              placeholder="Np. rodzaj wylewki, uwagi..."
              value={floorDetails}
              onChange={(e) => setFloorDetails(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="skirtingLength">Pomiar listwy (mb)</Label>
            <Input
              id="skirtingLength"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={skirtingLength}
              onChange={(e) => setSkirtingLength(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skirtingDetails">Szczegóły listew</Label>
            <Input
              id="skirtingDetails"
              placeholder="Np. rodzaj listwy, narożniki..."
              value={skirtingDetails}
              onChange={(e) => setSkirtingDetails(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="measurementDetails">Ogólne szczegóły pomiaru</Label>
            <Textarea
              id="measurementDetails"
              placeholder="Wymiary, uwagi techniczne..."
              value={measurementDetails}
              onChange={(e) => setMeasurementDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="panelType">Rodzaj paneli</Label>
              <Input
                id="panelType"
                placeholder="np. Panel ogrodzeniowy 3D"
                value={panelType}
                onChange={(e) => setPanelType(e.target.value)}
              />
            </div>

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Szkic sytuacyjny</Label>
            <Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>
              <Eraser className="mr-2 h-4 w-4" />
              Wyczyść
            </Button>
          </div>
          <div className="border rounded-md overflow-hidden bg-white touch-none">
            <canvas
              ref={canvasRef}
              className="w-full h-[300px] cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Możesz rysować palcem na urządzeniach mobilnych lub myszką.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        </div>
      </form>
    </div>
  );
}
