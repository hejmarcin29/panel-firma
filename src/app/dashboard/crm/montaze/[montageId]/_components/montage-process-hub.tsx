"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Montage } from "../../types";

const STAGES = [
  { id: "lead", label: "Nowy Lead" },
  { id: "before_measurement", label: "Przed Pomiorem" },
  { id: "before_first_payment", label: "Wycena / Zaliczka" },
  { id: "before_installation", label: "Oczekiwanie na Montaż" },
  { id: "before_skirting_installation", label: "Montaż Listew" },
  { id: "before_final_invoice", label: "Rozliczenie" },
  { id: "completed", label: "Zakończone" },
] as const;

interface MontageProcessHubProps {
  montage: Montage;
}

export function MontageProcessHub({ montage }: MontageProcessHubProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentStageRef = useRef<HTMLDivElement>(null);

  const currentStageIndex = STAGES.findIndex(s => s.id === montage.status);

  useEffect(() => {
    if (scrollContainerRef.current && currentStageRef.current) {
      const container = scrollContainerRef.current;
      const element = currentStageRef.current;
      
      const containerWidth = container.offsetWidth;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;

      // Center the element
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth"
      });
    }
  }, [currentStageIndex]);

  return (
    <div className="w-full bg-white border rounded-xl shadow-sm overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide py-4 px-4 md:px-8 flex items-center gap-6 md:gap-0 md:justify-between relative"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Desktop Connecting Line */}
        <div className="hidden md:block absolute top-[26px] left-12 right-12 h-0.5 bg-gray-100 -z-10" />

        {STAGES.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          
          return (
            <div 
              key={stage.id}
              ref={isCurrent ? currentStageRef : null}
              className={cn(
                "flex flex-col items-center gap-3 min-w-[100px] md:min-w-0 relative z-10 transition-all duration-300 shrink-0",
                isCurrent ? "opacity-100" : "opacity-70 md:opacity-100"
              )}
            >
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-white",
                isCompleted ? "bg-green-500 border-green-500 text-white" : 
                isCurrent ? "border-blue-600 text-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" : 
                "border-gray-200 text-gray-300"
              )}>
                {isCompleted ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-xs md:text-sm font-medium">{index + 1}</span>}
              </div>
              
              <div className="text-center">
                <div className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors px-2 py-1 rounded-full",
                  isCurrent ? "bg-blue-50 text-blue-700" : 
                  isCompleted ? "text-green-700" : "text-gray-400"
                )}>
                  {stage.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
