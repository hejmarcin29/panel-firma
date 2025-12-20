import { PROCESS_STEPS, type ProcessStepDefinition } from './process-definition';
import { type MontageStatus } from '@/lib/db/schema';
import type { Montage } from '@/app/dashboard/crm/montaze/types';

export type StepStatus = 'completed' | 'current' | 'pending' | 'locked';

export type ProcessStepState = ProcessStepDefinition & {
    status: StepStatus;
    isCompleted: boolean;
    isCurrent: boolean;
    checkpointsState: {
        key: string;
        label: string;
        isMet: boolean;
    }[];
};

export function getProcessState(montage: Montage): { 
    steps: ProcessStepState[]; 
    currentStepIndex: number;
    progress: number;
} {
    const currentStatus = montage.status as MontageStatus;
    
    // Find which step corresponds to the current status
    let currentStepIndex = PROCESS_STEPS.findIndex(step => 
        step.relatedStatuses.includes(currentStatus)
    );

    // If status not found (e.g. cancelled), default to 0 or handle specifically
    if (currentStepIndex === -1) {
        if (currentStatus === 'cancelled') {
            // Handle cancelled state if needed, for now show as stuck at 0 or special
            currentStepIndex = 0; 
        } else {
            currentStepIndex = 0;
        }
    }

    const steps: ProcessStepState[] = PROCESS_STEPS.map((step, index) => {
        let status: StepStatus = 'pending';
        
        if (index < currentStepIndex) {
            status = 'completed';
        } else if (index === currentStepIndex) {
            status = 'current';
        } else {
            status = 'pending';
        }

        // Evaluate checkpoints
        const checkpointsState = step.checkpoints.map(cp => ({
            key: cp.key,
            label: cp.label,
            isMet: cp.condition(montage)
        }));

        // If it's the current step, but all checkpoints are met, maybe we should suggest it's "ready to advance"?
        // For now, simple logic.

        return {
            ...step,
            status,
            isCompleted: status === 'completed',
            isCurrent: status === 'current',
            checkpointsState
        };
    });

    const progress = Math.round(((currentStepIndex) / (PROCESS_STEPS.length - 1)) * 100);

    return {
        steps,
        currentStepIndex,
        progress
    };
}
