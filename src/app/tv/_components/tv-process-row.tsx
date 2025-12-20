'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getProcessState, type ProcessStepState } from '@/lib/montaze/process-utils';
import type { Montage } from '@/app/dashboard/crm/montaze/types';
import { cn } from '@/lib/utils';
import { MapPin, User, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TvProcessRowProps {
    montage: Montage;
}

export function TvProcessRow({ montage }: TvProcessRowProps) {
    const { steps, progress, currentStepIndex } = useMemo(() => getProcessState(montage), [montage]);
    
    // Calculate urgency/status color
    const getRowStatus = () => {
        const daysSinceUpdate = differenceInDays(new Date(), new Date(montage.updatedAt as string));
        
        // Critical: Installation soon but material missing
        if (montage.scheduledInstallationAt) {
            const daysToInstall = differenceInDays(new Date(montage.scheduledInstallationAt as string), new Date());
            if (daysToInstall <= 3 && daysToInstall >= 0 && montage.materialStatus === 'none') return 'critical';
        }

        // Warning: No update for 7 days
        if (daysSinceUpdate > 7) return 'warning';
        
        return 'normal';
    };

    const status = getRowStatus();
    
    const bgClass = {
        normal: 'bg-slate-900/50 border-slate-800',
        warning: 'bg-yellow-950/30 border-yellow-900/50',
        critical: 'bg-red-950/30 border-red-900/50'
    }[status];

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "flex items-center gap-6 p-4 rounded-xl border backdrop-blur-sm mb-3 transition-colors",
                bgClass
            )}
        >
            {/* Left: Context */}
            <div className="w-64 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white truncate">
                        {montage.clientName}
                    </h3>
                    {status === 'critical' && <AlertTriangle className="text-red-500 animate-pulse" />}
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{montage.installationCity || 'Brak miasta'}</span>
                    </div>
                    {montage.scheduledInstallationAt && (
                        <div className="flex items-center gap-1 text-blue-400">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(montage.scheduledInstallationAt as string), 'd MMM', { locale: pl })}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Middle: Timeline */}
            <div className="flex-1 flex items-center justify-between px-4 relative">
                {/* Connecting Line */}
                <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-800 -z-10" />
                
                {steps.map((step, idx) => (
                    <TimelineDot 
                        key={step.id} 
                        step={step} 
                        isActive={idx === currentStepIndex}
                        isPast={idx < currentStepIndex}
                    />
                ))}
            </div>

            {/* Right: Status */}
            <div className="w-48 shrink-0 text-right">
                <div className="text-2xl font-bold text-blue-400">
                    {progress}%
                </div>
                <div className="text-sm text-slate-500 truncate">
                    {steps[currentStepIndex]?.label || 'Zakończone'}
                </div>
            </div>
        </motion.div>
    );
}

function TimelineDot({ step, isActive, isPast }: { step: ProcessStepState, isActive: boolean, isPast: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-500",
                isActive ? "bg-blue-500 border-blue-400 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]" :
                isPast ? "bg-emerald-500 border-emerald-500" :
                "bg-slate-900 border-slate-700"
            )} />
            <span className={cn(
                "text-xs font-medium transition-colors duration-300",
                isActive ? "text-blue-400" :
                isPast ? "text-emerald-500/50" :
                "text-slate-700"
            )}>
                {step.label.split(' ')[0]}
            </span>
        </div>
    );
}
