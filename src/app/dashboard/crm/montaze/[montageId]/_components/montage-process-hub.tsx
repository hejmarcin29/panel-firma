"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { History, ArrowRight, CheckCircle2, AlertTriangle, Check, ChevronUp, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { Montage, MontageLog } from "../../types";

const STAGES = [
  { id: 'lead', label: 'Nowy Lead' },
  { id: 'before_measurement', label: 'Przed Pomiorem' },
  { id: 'before_first_payment', label: 'Wycena / Zaliczka' },
  { id: 'before_installation', label: 'Oczekiwanie na Montaż' },
  { id: 'before_skirting_installation', label: 'Montaż Listew' },
  { id: 'before_final_invoice', label: 'Rozliczenie' },
  { id: 'completed', label: 'Zakończone' },
] as const;

interface MontageProcessHubProps {
  montage: Montage;
  logs: MontageLog[];
}

export function MontageProcessHub({ montage, logs }: MontageProcessHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const currentStageIndex = STAGES.findIndex(s => s.id === montage.status);
  const progress = Math.max(5, ((currentStageIndex + 1) / STAGES.length) * 100);
  const currentStage = STAGES[currentStageIndex] || STAGES[0];

  // Helper to get logs for a specific stage
  // Since we don't store stageId in logs directly in the schema provided, 
  // we might need to infer it or just show all logs for now.
  // For the stepper, we can try to group logs by date or just show them all in a list if stage mapping is hard.
  // However, the prompt implies we should try to make it work.
  // Let's assume for now we show all logs in the drawer, but maybe we can filter by date ranges if we had stage transition dates.
  // Given the constraints, we will show ALL logs in the drawer, but visually grouped by "Latest" vs "Older".
  
  // Actually, let's try to map logs to stages if possible. 
  // If not, we will just list stages in the stepper and show logs below or in a separate tab in the drawer.
  // Better approach for the Stepper: Show the stages status (Completed/Current/Upcoming).
  // And when clicking a stage, show logs that happened *during* that stage? 
  // Without explicit transition logs, it's hard.
  // Let's stick to the visual Stepper showing status, and a general "History" list below it in the drawer.

  const nextActionLabel = useMemo(() => {
    switch (montage.status) {
      case 'lead': return 'Zweryfikuj klienta';
      case 'before_measurement': return 'Umów pomiar';
      case 'before_first_payment': return 'Przygotuj ofertę';
      case 'before_installation': return 'Zaplanuj montaż';
      case 'before_skirting_installation': return 'Umów montaż listew';
      case 'before_final_invoice': return 'Wystaw fakturę końcową';
      case 'completed': return 'Zakończone';
      default: return 'Zarządzaj';
    }
  }, [montage.status]);

  return (
    <div className="w-full space-y-4">
      {/* Main Focus Widget */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-xl shadow-sm border p-4 md:p-6 relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status Realizacji
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {currentStage.label}
                </h2>
                <p className="text-sm text-gray-500">
                    {montage.updatedAt ? `Ostatnia aktywność: ${formatDistanceToNow(new Date(montage.updatedAt), { addSuffix: true, locale: pl })}` : 'Brak aktywności'}
                </p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1 md:flex-none border-dashed">
                    <History className="mr-2 w-4 h-4" /> Historia
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto z-[150]">
                    <SheetHeader className="mb-6">
                    <SheetTitle>Oś Czasu Zlecenia</SheetTitle>
                    </SheetHeader>
                    
                    {/* Stepper View inside Drawer */}
                    <div className="space-y-8">
                        <div className="relative pl-4 border-l border-gray-200 space-y-8">
                        {STAGES.map((stage, index) => {
                            const isCompleted = index < currentStageIndex;
                            const isCurrent = index === currentStageIndex;
                            const isUpcoming = index > currentStageIndex;

                            return (
                            <div key={stage.id} className="relative">
                                {/* Dot */}
                                <div className={cn(
                                    "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white transition-colors",
                                    isCompleted ? "bg-green-500" : 
                                    isCurrent ? "bg-blue-500 ring-4 ring-blue-100" : 
                                    "bg-gray-300"
                                )} />
                                
                                <div className="mb-2">
                                <h4 className={cn(
                                    "font-semibold text-sm",
                                    isCurrent ? "text-blue-600" : "text-gray-900"
                                )}>
                                    {stage.label}
                                </h4>
                                </div>
                            </div>
                            );
                        })}
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <History className="w-4 h-4" /> Pełny dziennik zdarzeń
                            </h3>
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-3 text-sm">
                                        <div className="min-w-[50px] text-xs text-muted-foreground pt-0.5">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <div className="text-[10px]">{new Date(log.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-gray-900 font-medium">{log.action}</p>
                                            {log.details && <p className="text-gray-600 mt-1 text-xs">{log.details}</p>}
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <User className="w-3 h-3" /> {log.userId || 'System'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <p className="text-muted-foreground text-sm italic">Brak wpisów w historii.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetContent>
                </Sheet>
            </div>
          </div>
        </div>
        
        {/* Progress Bar at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </motion.div>
    </div>
  );
}
