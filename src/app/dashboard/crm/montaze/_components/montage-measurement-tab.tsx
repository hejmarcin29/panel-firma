'use client';

import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { 
  CalendarIcon, 
  FileText, 
  Ruler, 
  Info, 
  Check, 
  X, 
  AlertTriangle,
  Maximize2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Montage } from '../types';
import type { TechnicalAuditData } from '../technical-data';

interface MontageMeasurementTabProps {
  montage: Montage;
  userRoles?: string[];
  onOpenProtocol?: () => void;
}

export function MontageMeasurementTab({ montage, userRoles = [], onOpenProtocol }: MontageMeasurementTabProps) {
  const isLockedBySettlement = montage.settlement?.status === 'approved' || montage.settlement?.status === 'paid';
  const isReadOnly = (!userRoles.includes('admin') && !userRoles.includes('installer')) || isLockedBySettlement;
  
  const technicalAudit = montage.technicalAudit as unknown as TechnicalAuditData | null;
  const hasAudit = !!technicalAudit;
  
  const measurementDate = montage.measurementDate 
    ? new Date(montage.measurementDate as string | number | Date)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Karta Pomiarowa</h3>
          <p className="text-sm text-muted-foreground">
            Podsumowanie ustaleń z wizyty pomiarowej.
          </p>
        </div>
        
        {!isReadOnly && onOpenProtocol && (
          <Button onClick={onOpenProtocol} className="w-full md:w-auto gap-2" size="lg">
            <Maximize2 className="h-4 w-4" />
            Uruchom Tryb Terenowy
          </Button>
        )}
      </div>

      {isLockedBySettlement && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Edycja zablokowana</h4>
            <p className="text-sm text-amber-700">
              Zatwierdzone rozliczenie finansowe blokuje możliwość edycji pomiarów.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-500" />
              Termin i Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Data pomiaru</span>
              <span className="font-medium">
                {measurementDate ? format(measurementDate, "PPP, p", { locale: pl }) : "Nie ustalono"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Status modeli</span>
              <Badge variant={montage.modelsApproved ? "default" : "outline"} className={montage.modelsApproved ? "bg-green-600 hover:bg-green-700 border-transparent" : ""}>
                {montage.modelsApproved ? "Zaakceptowane" : "Do ustalenia"}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">VAT 8%</span>
              <Badge variant={montage.isHousingVat ? "default" : "secondary"}>
                {montage.isHousingVat ? "Tak (Społeczny)" : "Nie (23%)"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Technical Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Ruler className="h-4 w-4 text-purple-500" />
              Dane Techniczne
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Powierzchnia</span>
                <p className="text-lg font-bold">
                  {montage.floorArea ? `${montage.floorArea} m²` : "---"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Zapas</span>
                <p className="text-lg font-bold">
                  {montage.panelWaste ? `${montage.panelWaste}%` : "---"}
                </p>
              </div>
            </div>
            
            <div className="space-y-1 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Model paneli</span>
              <p className="font-medium truncate">
                {montage.panelModel || "Nie wybrano"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
               <div>
                 <span className="text-xs text-muted-foreground">Montaż</span>
                 <p className="text-sm font-medium">
                   {montage.measurementInstallationMethod === 'glue' ? 'Klejony' : 'Pływający (Click)'}
                 </p>
               </div>
               <div>
                 <span className="text-xs text-muted-foreground">Wzór</span>
                 <p className="text-sm font-medium">
                   {montage.measurementFloorPattern === 'herringbone' ? 'Jodełka' : 'Klasyczny'}
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Status Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              Audyt Techniczny
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasAudit ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
                <p>Brak danych audytu technicznego.</p>
                {!isReadOnly && onOpenProtocol && (
                   <Button variant="link" onClick={onOpenProtocol}>
                     Wypełnij w trybie terenowym
                   </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                    <Check className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="text-sm font-medium">Wilgotność</p>
                        <p className="text-xs text-muted-foreground">
                            {technicalAudit?.humidity ? `${technicalAudit.humidity}% (${technicalAudit.humidityMethod})` : 'Brak pomiaru'}
                        </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                    <Check className="h-5 w-5 text-green-500" />
                    <div>
                        <p className="text-sm font-medium">Równość</p>
                        <p className="text-xs text-muted-foreground">
                            {technicalAudit?.flatness === 'ok' ? 'W normie' : 
                             technicalAudit?.flatness === 'grinding' ? 'Szlifowanie' :
                             technicalAudit?.flatness === 'leveling' ? 'Wylewka' : 'Brak danych'}
                        </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                    <Info className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="text-sm font-medium">Podłoże</p>
                        <p className="text-xs text-muted-foreground">
                            {technicalAudit?.subfloorType === 'concrete' ? 'Beton' :
                             technicalAudit?.subfloorType === 'anhydrite' ? 'Anhydryt' :
                             technicalAudit?.subfloorType === 'osb' ? 'OSB/Drewno' : 
                             technicalAudit?.subfloorType || 'Nie określono'}
                        </p>
                    </div>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}