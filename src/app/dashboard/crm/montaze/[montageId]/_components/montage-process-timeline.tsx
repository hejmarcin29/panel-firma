'use client';

import { useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getProcessState } from '@/lib/montaze/process-utils';
import { ProcessStepItem } from './process-step-item';
import type { Montage } from '../../types';
import { Sparkles, Map } from 'lucide-react';
import { updateMontageStatus } from '../../actions';
import { toast } from 'sonner';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface MontageProcessTimelineProps {
    montage: Montage;
    readOnly?: boolean;
}

export function MontageProcessTimeline({ montage, readOnly = false }: MontageProcessTimelineProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const { steps, progress, currentStepIndex } = useMemo(() => getProcessState(montage), [montage]);

    const handleAdvance = (nextStatus: string) => {
        startTransition(async () => {
            try {
                await updateMontageStatus({ montageId: montage.id, status: nextStatus });
                toast.success('Status został zaktualizowany');
                router.refresh();
            } catch (error) {
                toast.error('Wystąpił błąd podczas aktualizacji statusu');
                console.error(error);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header / Progress */}
            <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Postęp procesu</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/dashboard/settings?tab=automations">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-700 hover:text-blue-900 hover:bg-blue-200/50">
                                                <Map className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Zobacz mapę procesu i automatyzacje</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <span className="text-sm font-bold text-blue-700">{progress}%</span>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2 bg-blue-200 [&>div]:bg-blue-600" />
                </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Oś Czasu</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="pl-2">
                        {steps.map((step, index) => {
                            // Determine next status for the current step
                            let nextStatus: string | undefined;
                            if (index === currentStepIndex && index < PROCESS_STEPS.length - 1) {
                                nextStatus = PROCESS_STEPS[index + 1].relatedStatuses[0];
                            }

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <ProcessStepItem 
                                        step={step} 
                                        isLast={index === steps.length - 1}
                                        onAdvance={readOnly ? undefined : handleAdvance}
                                        nextStatus={nextStatus}
                                        isPending={pending}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
