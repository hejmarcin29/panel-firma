"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_STAGES, MOCK_LOGS } from "./data";

export function SmartStepperVariant() {
  const [expandedStage, setExpandedStage] = useState<string | null>("quote");

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold">Wariant 1: Smart Stepper</h3>
        <p className="text-muted-foreground text-sm">
          Klasyczny stepper nawigacyjny z rozwijaną historią per etap.
        </p>
      </div>

      {/* Stepper Container */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10 hidden md:block" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 overflow-x-auto pb-4 md:pb-0">
          {MOCK_STAGES.map((stage, index) => {
            const isCompleted = stage.status === "completed";
            const isCurrent = stage.status === "current";
            
            return (
              <div 
                key={stage.id} 
                className={cn(
                  "flex md:flex-col items-center gap-3 md:gap-2 min-w-[120px] cursor-pointer group",
                  isCurrent ? "opacity-100" : isCompleted ? "opacity-80" : "opacity-40"
                )}
                onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all bg-white z-10",
                  isCompleted ? "bg-green-500 border-green-500 text-white" : 
                  isCurrent ? "border-blue-600 text-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" : 
                  "border-gray-300 text-gray-400"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
                </div>
                
                <div className="text-left md:text-center">
                  <div className={cn("font-medium text-sm", isCurrent && "text-blue-600")}>
                    {stage.label}
                  </div>
                  {stage.date && (
                    <div className="text-xs text-muted-foreground">{stage.date}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contextual History Panel */}
      <AnimatePresence mode="wait">
        {expandedStage && (
          <motion.div
            key={expandedStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Historia etapu: {MOCK_STAGES.find(s => s.id === expandedStage)?.label}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setExpandedStage(null)}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_LOGS.filter(log => log.stageId === expandedStage).length > 0 ? (
                    MOCK_LOGS.filter(log => log.stageId === expandedStage).map((log) => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className="min-w-[50px] text-xs text-muted-foreground pt-0.5">
                          {log.time}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">{log.action}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" /> {log.user}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Brak zdarzeń dla tego etapu.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
