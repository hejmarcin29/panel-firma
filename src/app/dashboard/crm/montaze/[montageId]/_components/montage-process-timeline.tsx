'use client';

import { useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getProcessState } from '@/lib/montaze/process-utils';
import { ProcessStepItem } from './process-step-item';
import type { Montage } from '../../types';
import { Sparkles } from 'lucide-react';
import { updateMontageStatus } from '../../actions';
import { toast } from 'sonner';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';

interface MontageProcessTimelineProps {
    montage: Montage;
}

export function MontageProcessTimeline({ montage }: MontageProcessTimelineProps) {
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
                        <span className="text-sm font-bold text-blue-700">{progress}%</span>
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
                                        onAdvance={handleAdvance}
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
