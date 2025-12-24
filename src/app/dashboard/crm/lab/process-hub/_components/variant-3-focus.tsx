"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { History, ArrowRight, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MOCK_STAGES, MOCK_LOGS } from "./data";

export function FocusHubVariant() {
  const [isOpen, setIsOpen] = useState(false);
  const currentStage = MOCK_STAGES.find(s => s.status === 'current');
  const progress = (MOCK_STAGES.findIndex(s => s.status === 'current') / MOCK_STAGES.length) * 100;

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold">Wariant 3: Focus Hub</h3>
        <p className="text-muted-foreground text-sm">
          Minimalistyczny widget "Next Action" + Drawer z historią.
        </p>
      </div>

      {/* Main Focus Widget */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl border p-6 relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Aktualny Status
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStage?.label}
          </h2>
          <p className="text-gray-500 mb-8">
            Oczekujemy na weryfikację dostępności produktów u dostawcy.
          </p>

          <div className="space-y-3">
            <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
              Zatwierdź Wycenę <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full border-dashed">
                  <History className="mr-2 w-4 h-4" /> Zobacz pełną historię
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle>Oś Czasu Zlecenia</SheetTitle>
                </SheetHeader>
                
                <div className="relative pl-4 border-l border-gray-200 space-y-8">
                  {MOCK_STAGES.map((stage) => {
                    const logs = MOCK_LOGS.filter(l => l.stageId === stage.id);
                    const isCompleted = stage.status === 'completed';
                    const isCurrent = stage.status === 'current';

                    return (
                      <div key={stage.id} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                          isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-300'
                        }`} />
                        
                        <div className="mb-2">
                          <h4 className={`font-semibold ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                            {stage.label}
                          </h4>
                          {stage.date && <span className="text-xs text-muted-foreground">{stage.date}</span>}
                        </div>

                        {logs.length > 0 && (
                          <div className="space-y-3 mt-3">
                            {logs.map(log => (
                              <div key={log.id} className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                <p className="text-gray-800">{log.action}</p>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                  <span>{log.user}</span>
                                  <span>{log.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Progress Bar at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </motion.div>

      {/* Quick Stats / Context */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold text-xs uppercase">Termin</span>
          </div>
          <p className="font-medium text-gray-900">Na czas</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold text-xs uppercase">Braki</span>
          </div>
          <p className="font-medium text-gray-900">1 produkt</p>
        </div>
      </div>
    </div>
  );
}
