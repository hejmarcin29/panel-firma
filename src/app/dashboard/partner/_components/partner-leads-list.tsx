'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Lead = {
    id: string;
    clientName: string;
    installationCity: string | null;
    status: string;
    createdAt: Date;
};

const STEPS = [
    { 
        id: 'lead', 
        label: 'Pozyskany', 
        statuses: ['lead', 'contact_attempt', 'contact_established'] 
    },
    { 
        id: 'contract', 
        label: 'Umowa', 
        statuses: ['before_measurement', 'measurement', 'valuation', 'before_first_payment'] 
    },
    { 
        id: 'execution', 
        label: 'Realizacja', 
        statuses: ['before_installation', 'during_installation'] 
    },
    { 
        id: 'finished', 
        label: 'Zakończono', 
        statuses: ['completed', 'finished'] 
    },
];

function getStepStatus(currentStatus: string, stepIndex: number) {
    // Find index of current status
    const currentStepIndex = STEPS.findIndex(step => step.statuses.includes(currentStatus));
    
    if (currentStepIndex === -1) return 'pending'; // Unknown status, assume pending or handle differently
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
}

export function PartnerLeadsList({ leads }: { leads: Lead[] }) {
    if (leads.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Twoje Polecenia</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-muted-foreground">
                    Nie masz jeszcze żadnych poleceń. Udostępnij swój link, aby zacząć zarabiać!
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Twoje Polecenia</h2>
            <div className="grid gap-4">
                {leads.map((lead) => (
                    <Card key={lead.id} className="overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{lead.clientName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {lead.installationCity || 'Brak lokalizacji'} • {format(lead.createdAt, 'd MMMM yyyy', { locale: pl })}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-sm px-3 py-1">
                                    {STEPS.find(s => s.statuses.includes(lead.status))?.label || lead.status}
                                </Badge>
                            </div>

                            <div className="relative">
                                {/* Progress Bar Background */}
                                <div className="absolute top-4 left-0 w-full h-0.5 bg-muted hidden md:block" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {STEPS.map((step, index) => {
                                        const status = getStepStatus(lead.status, index);
                                        
                                        return (
                                            <div key={step.id} className="relative flex md:flex-col items-center md:text-center gap-4 md:gap-2 z-10">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background",
                                                    status === 'completed' && "border-primary bg-primary text-primary-foreground",
                                                    status === 'current' && "border-primary text-primary",
                                                    status === 'pending' && "border-muted-foreground/30 text-muted-foreground/30"
                                                )}>
                                                    {status === 'completed' ? (
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    ) : status === 'current' ? (
                                                        <Clock className="w-5 h-5" />
                                                    ) : (
                                                        <Circle className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-start md:items-center">
                                                    <span className={cn(
                                                        "text-sm font-medium",
                                                        status === 'pending' && "text-muted-foreground"
                                                    )}>
                                                        {step.label}
                                                    </span>
                                                    {status === 'current' && (
                                                        <span className="text-xs text-primary animate-pulse">
                                                            W trakcie
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
