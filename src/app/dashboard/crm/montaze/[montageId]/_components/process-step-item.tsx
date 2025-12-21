'use client';

import { Check, Clock, Lock, User, Building, Hammer, Cpu } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ProcessStepState, StepStatus } from '@/lib/montaze/process-utils';
import { Badge } from '@/components/ui/badge';

interface ProcessStepItemProps {
    step: ProcessStepState;
    isLast: boolean;
}

export function ProcessStepItem({ step, isLast }: ProcessStepItemProps) {
    const getStatusIcon = (status: StepStatus) => {
        switch (status) {
            case 'completed': return <Check className="w-4 h-4 text-white" />;
            case 'current': return <Clock className="w-4 h-4 text-white animate-pulse" />;
            case 'locked': return <Lock className="w-3 h-3 text-muted-foreground" />;
            default: return <div className="w-2 h-2 rounded-full bg-muted-foreground" />;
        }
    };

    const getStatusColor = (status: StepStatus) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500 border-emerald-500';
            case 'current': return 'bg-blue-500 border-blue-500 ring-4 ring-blue-100';
            case 'locked': return 'bg-muted border-muted-foreground/30';
            default: return 'bg-muted border-muted';
        }
    };

    const getActorIcon = (actor: string) => {
        switch (actor) {
            case 'client': return <User className="w-3 h-3" />;
            case 'office': return <Building className="w-3 h-3" />;
            case 'installer': return <Hammer className="w-3 h-3" />;
            case 'system': return <Cpu className="w-3 h-3" />;
            default: return null;
        }
    };

    const getActorLabel = (actor: string) => {
        switch (actor) {
            case 'client': return 'Klient';
            case 'office': return 'Biuro';
            case 'installer': return 'Montażysta';
            case 'system': return 'System';
            default: return actor;
        }
    };

    return (
        <div className="relative flex gap-4 pb-8 last:pb-0">
            {/* Vertical Line */}
            {!isLast && (
                <div className={cn(
                    "absolute left-[15px] top-8 bottom-0 w-0.5",
                    step.status === 'completed' ? "bg-emerald-200" : "bg-muted"
                )} />
            )}

            {/* Icon/Dot */}
            <div className={cn(
                "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                getStatusColor(step.status)
            )}>
                {getStatusIcon(step.status)}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1 space-y-3">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className={cn(
                            "font-semibold text-sm",
                            step.status === 'completed' ? "text-emerald-700" : 
                            step.status === 'current' ? "text-blue-700" : "text-muted-foreground"
                        )}>
                            {step.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                        </p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] h-5 px-1.5">
                        {getActorIcon(step.actor)}
                        {getActorLabel(step.actor)}
                    </Badge>
                </div>

                {/* Scheduled Date Indicator */}
                {step.scheduledDate && (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md border border-blue-100 w-fit">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                            Zaplanowano: {format(step.scheduledDate, "d MMMM yyyy", { locale: pl })}
                        </span>
                    </div>
                )}

                {/* Checkpoints */}
                {step.checkpointsState.length > 0 && (
                    <div className="space-y-1.5">
                        {step.checkpointsState.map((cp) => (
                            <div key={cp.key} className="flex items-center gap-2 text-xs">
                                {cp.isMet ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                    <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                                )}
                                <span className={cn(
                                    cp.isMet ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {cp.label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Automations */}
                {step.automations.length > 0 && (
                    <div className="bg-muted/30 rounded-md p-2 space-y-2 border border-dashed border-muted-foreground/20">
                        {step.automations.map((auto, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Cpu className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-purple-700">
                                        {auto.label}
                                    </p>
                                    {auto.description && (
                                        <p className="text-[10px] text-muted-foreground">
                                            {auto.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
