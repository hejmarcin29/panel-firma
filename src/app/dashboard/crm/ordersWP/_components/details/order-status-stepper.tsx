"use client";

import { Check, Circle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, StatusDefinition } from "../../utils";

interface OrderStatusStepperProps {
  currentStatus: string;
}

// Define the linear progress path. Some statuses might be parallel or skipped, 
// but for a stepper, we need a logical linear progression.
const STEPPER_PATH = [
  'order.received',
  'order.pending_proforma',
  'order.proforma_issued',
  'order.paid',
  'order.forwarded_to_supplier',
  'order.fulfillment_confirmed',
  'order.closed'
];

export function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
  // Find index of current, but handle "order.final_invoice" or others seamlessly
  // If status is not in path, try to find closest semantic match or fallback to end
  const getCurrentStepIndex = () => {
    const idx = STEPPER_PATH.findIndex(s => s === currentStatus);
    if (idx !== -1) return idx;
    
    // Fallbacks for statuses not explicitly in the linear path
    if (currentStatus === 'order.cancelled') return -1; 
    if (currentStatus === 'order.final_invoice') return STEPPER_PATH.length - 1; // Treat as closed?
    
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = currentStatus === 'order.cancelled';

  if (isCancelled) {
    return (
        <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="font-bold">✕</span>
            </div>
            <div>
                <p className="font-semibold">Zamówienie anulowane</p>
                <p className="text-sm opacity-80">Proces realizacji został przerwany.</p>
            </div>
        </div>
    );
  }

  // Filter STATUS_Definitions to only those in our path to render labels
  const steps = STEPPER_PATH.map(statusId => {
    return ORDER_STATUSES.find(s => s.id === statusId) as StatusDefinition;
  }).filter(Boolean);

  return (
    <div className="w-full py-2 overflow-x-auto">
      <div className="min-w-[700px]"> {/* Ensure min width for scrolling on very small mobile */}
        <div className="relative flex items-center justify-between w-full">
            {/* Connecting Lines Background */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -translate-y-1/2 z-0 rounded-full" />
            
            {/* Active Progress Line */}
            <div 
                className="absolute top-1/2 left-0 h-1 bg-primary transition-all duration-500 -translate-y-1/2 z-0 rounded-full"
                style={{ 
                    width: `${(currentStepIndex / (steps.length - 1)) * 100}%` 
                }} 
            />

            {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                const isUpcoming = index > currentStepIndex;

                return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center group">
                        <div 
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-300",
                                isActive && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20",
                                isCompleted && "border-primary bg-primary text-primary-foreground",
                                isUpcoming && "border-muted-foreground/20 text-muted-foreground/40 bg-card"
                            )}
                        >
                            {isCompleted ? (
                                <Check className="h-4 w-4" />
                            ) : isActive ? (
                                <Package className="h-4 w-4 animate-pulse" />
                            ) : (
                                <Circle className="h-2 w-2 fill-current" />
                            )}
                        </div>
                        
                        <div className={cn(
                            "absolute top-10 w-24 text-center transition-all duration-300",
                            isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                        )}>
                            <p className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </p>
                        </div>
                        
                        {/* Always visible label for current step on mobile could be added here if needed */}
                         {isActive && (
                            <div className="absolute top-10 w-32 text-center md:hidden">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                    {step.label}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        <div className="h-8 md:h-6" /> {/* Spacer for labels */}
      </div>
    </div>
  );
}
