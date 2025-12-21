'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getProcessState } from '@/lib/montaze/process-utils';
import { ProcessStepItem } from './process-step-item';
import type { Montage } from '../../types';
import { Sparkles } from 'lucide-react';

interface MontageProcessTimelineProps {
    montage: Montage;
}

export function MontageProcessTimeline({ montage }: MontageProcessTimelineProps) {
    const { steps, progress } = useMemo(() => getProcessState(montage), [montage]);

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
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ProcessStepItem 
                                    step={step} 
                                    isLast={index === steps.length - 1} 
                                />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
