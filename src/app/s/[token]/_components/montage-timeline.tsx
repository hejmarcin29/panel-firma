'use client';

import { cn } from '@/lib/utils';
import { Check, Clock, Truck, Ruler, FileText, Hammer, CheckCircle2, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { PORTAL_STEPS, type PortalStepDefinition } from '@/lib/customer-portal-definitions';

interface MontageTimelineProps {
    montage: {
        status: string;
        createdAt: Date;
        scheduledInstallationAt: Date | null;
        forecastedInstallationDate: Date | null;
        installationCity: string | null;
        measurementDate: Date | null;
        floorArea: number | null;
        quotes: { status: string }[];
    }
}

type TimelineStep = {
    id: string;
    label: string;
    description?: string;
    icon: React.ElementType;
    date?: Date | null;
    status: 'completed' | 'current' | 'upcoming';
};

const ICON_MAP: Record<PortalStepDefinition['iconName'], React.ElementType> = {
    'FileText': FileText,
    'Ruler': Ruler,
    'Calculator': Calculator,
    'CheckCircle2': CheckCircle2,
    'Truck': Truck,
    'Hammer': Hammer,
    'Check': Check
};

export function MontageTimeline({ montage }: MontageTimelineProps) {
    const { status, createdAt, scheduledInstallationAt: scheduledDate, forecastedInstallationDate: forecastedDate, installationCity: city, measurementDate, floorArea, quotes } = montage;
    
    const getStepState = (targetStatus: string, currentStatus: string): 'completed' | 'current' | 'upcoming' => {
        const statusOrder = ['lead', 'before_measurement', 'before_first_payment', 'before_installation', 'before_final_invoice', 'completed'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const targetIndex = statusOrder.indexOf(targetStatus);

        if (currentIndex > targetIndex) return 'completed';
        if (currentIndex === targetIndex) return 'current';
        return 'upcoming';
    };

    // Logic Helpers
    const isMeasurementDone = (floorArea && floorArea > 0) || getStepState('before_measurement', status) === 'completed';
    const hasQuote = quotes && quotes.length > 0;
    const isQuoteAccepted = quotes && quotes.some(q => q.status === 'accepted');
    const isDepositPaid = getStepState('before_first_payment', status) === 'completed';

    // Map definitions to runtime steps
    const steps: TimelineStep[] = PORTAL_STEPS.map(def => {
        let stepStatus: 'completed' | 'current' | 'upcoming' = 'upcoming';
        let date: Date | null | undefined = undefined;
        let dynamicDescription = def.description;

        switch (def.id) {
            case 'lead':
                stepStatus = getStepState('lead', status);
                date = createdAt;
                break;
            case 'before_measurement':
                stepStatus = isMeasurementDone ? 'completed' : getStepState('before_measurement', status);
                date = measurementDate;
                if (measurementDate) dynamicDescription = 'Zaplanowany termin pomiaru';
                break;
            case 'quote_preparation':
                stepStatus = hasQuote ? 'completed' : (isMeasurementDone ? 'current' : 'upcoming');
                break;
            case 'quote_acceptance':
                stepStatus = isQuoteAccepted ? 'completed' : (hasQuote ? 'current' : 'upcoming');
                break;
            case 'before_first_payment':
                stepStatus = isDepositPaid ? 'completed' : (isQuoteAccepted ? 'current' : 'upcoming');
                break;
            case 'before_installation':
                stepStatus = getStepState('before_installation', status);
                break;
            case 'floor_install':
                stepStatus = getStepState('before_final_invoice', status);
                date = scheduledDate || forecastedDate;
                if (scheduledDate) dynamicDescription = 'Zaplanowany termin prac';
                else if (forecastedDate) dynamicDescription = 'Oczekiwanie na termin';
                break;
            case 'completed':
                stepStatus = getStepState('completed', status);
                break;
        }

        return {
            id: def.id,
            label: def.label,
            description: dynamicDescription,
            icon: ICON_MAP[def.iconName],
            date: date,
            status: stepStatus
        };
    });

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border shadow-sm p-6">
            {/* Header Section similar to the screenshot */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span className="inline-flex items-center gap-1">
                            <Truck className="w-4 h-4" /> Status zlecenia
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold">
                        {city ? `Realizacja: ${city}` : 'Twoje Zlecenie'}
                    </h2>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted-foreground">Przewidywany termin</div>
                    <div className="font-medium">
                        {forecastedDate ? format(forecastedDate, 'd MMMM yyyy', { locale: pl }) : 'Do ustalenia'}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-4 md:pl-8 space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-[27px] md:left-[43px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-zinc-800" />

                {steps.map((step) => (
                    <div key={step.id} className="relative flex gap-6 group">
                        {/* Icon / Dot */}
                        <div className={cn(
                            "relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-4 transition-colors duration-300 shrink-0",
                            step.status === 'completed' && "bg-primary border-primary text-primary-foreground",
                            step.status === 'current' && "bg-white border-primary text-primary animate-pulse shadow-[0_0_0_4px_rgba(var(--primary),0.2)]",
                            step.status === 'upcoming' && "bg-gray-50 border-gray-100 text-gray-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-700"
                        )}>
                            <step.icon className="w-6 h-6" />
                        </div>

                        {/* Content */}
                        <div className={cn(
                            "flex-1 pt-2 pb-8",
                            step.status === 'upcoming' && "opacity-50 grayscale"
                        )}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <h3 className={cn(
                                        "text-lg font-semibold leading-none mb-1",
                                        step.status === 'current' && "text-primary"
                                    )}>
                                        {step.label}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                                {step.date && (
                                    <div className="text-sm font-medium text-muted-foreground bg-gray-50 dark:bg-zinc-900 px-3 py-1 rounded-full whitespace-nowrap">
                                        {format(step.date, 'd MMM yyyy, HH:mm', { locale: pl })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Footer Action (Optional) */}
            {status === 'lead' && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Nasz zespół wkrótce skontaktuje się z Tobą w celu umówienia pomiaru.
                </div>
            )}
        </div>
    );
}
