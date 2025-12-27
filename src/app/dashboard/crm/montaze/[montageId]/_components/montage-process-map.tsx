'use client';

import { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    NodeProps,
    Edge,
    Node,
    MarkerType,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PROCESS_STEPS } from '@/lib/montaze/process-definition';
import { cn } from '@/lib/utils';
import { Check, User, Building, Hammer, Cpu, Zap, ListChecks, Maximize2, X } from 'lucide-react';
import type { Montage } from '../../types';
import { getProcessState } from '@/lib/montaze/process-utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';

// --- Custom Node Components ---

const StepNode = ({ data }: NodeProps) => {
    const { label, actor, status, automationsCount } = data;

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'completed': return 'bg-emerald-50 border-emerald-500 text-emerald-900';
            case 'current': return 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-200 animate-pulse';
            case 'locked': return 'bg-slate-50 border-slate-200 text-slate-400';
            default: return 'bg-white border-slate-200';
        }
    };

    const getActorIcon = (a: string) => {
        switch (a) {
            case 'client': return <User className="w-3 h-3" />;
            case 'office': return <Building className="w-3 h-3" />;
            case 'installer': return <Hammer className="w-3 h-3" />;
            case 'system': return <Cpu className="w-3 h-3" />;
            default: return null;
        }
    };

    return (
        <div className={cn(
            "px-4 py-3 rounded-lg border-2 shadow-sm min-w-[180px] transition-all relative",
            getStatusColor(status)
        )}>
            <Handle type="target" position={Position.Left} className="bg-slate-400!" />
            <Handle type="source" position={Position.Top} id="top" className="bg-transparent! border-0! top-0!" />
            
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">{actor}</span>
                {getActorIcon(actor)}
            </div>
            
            <div className="font-bold text-sm mb-1">{label}</div>
            
            {automationsCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] bg-white/50 px-1.5 py-0.5 rounded-full w-fit border border-black/5">
                    <Cpu className="w-3 h-3" />
                    {automationsCount} auto
                </div>
            )}

            <Handle type="source" position={Position.Right} className="bg-slate-400!" />
        </div>
    );
};

const CheckpointNode = ({ data }: NodeProps) => {
    const { label, isMet, isCurrentStep } = data;

    return (
        <div className={cn(
            "w-8 h-8 rotate-45 border-2 flex items-center justify-center shadow-sm transition-all",
            isMet ? "bg-emerald-100 border-emerald-500" : 
            isCurrentStep ? "bg-white border-blue-400" : "bg-slate-50 border-slate-200"
        )}>
            <Handle type="target" position={Position.Top} className="bg-transparent! border-0!" />
            <div className="-rotate-45">
                {isMet ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
            </div>
            
            {/* Label Tooltip-ish */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 -rotate-45 w-[120px] text-center">
                <span className={cn(
                    "text-[10px] font-medium px-1 py-0.5 rounded",
                    isMet ? "text-emerald-700 bg-emerald-50" : "text-slate-500"
                )}>
                    {label}
                </span>
            </div>

            <Handle type="source" position={Position.Bottom} className="bg-transparent! border-0!" />
        </div>
    );
};

const AutomationNode = ({ data }: NodeProps) => {
    const { label, description } = data;
    return (
        <div className="flex flex-col items-center group">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shadow-sm text-amber-700">
                <Zap className="w-4 h-4" />
            </div>
            <Handle type="target" position={Position.Bottom} className="bg-transparent! border-0!" />
            
            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50">
                {label}
                {description && <div className="opacity-70 font-light">{description}</div>}
            </div>
        </div>
    );
};

const GateNode = ({ data }: NodeProps) => {
    const { label } = data;
    return (
        <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-md px-2 py-1 shadow-sm">
            <Handle type="target" position={Position.Left} className="bg-transparent! border-0!" />
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600">
                <ListChecks className="w-3 h-3" />
                {label}
            </div>
            <Handle type="source" position={Position.Right} className="bg-transparent! border-0!" />
        </div>
    );
};

const nodeTypes = {
    stepNode: StepNode,
    checkpointNode: CheckpointNode,
    automationNode: AutomationNode,
    gateNode: GateNode,
};

// --- Main Component ---

interface MontageProcessMapProps {
    montage?: Montage; // Optional: if provided, shows live status. If not, shows template.
}

export function MontageProcessMap({ montage }: MontageProcessMapProps) {
    // Calculate state if montage is provided
    const processState = useMemo(() => montage ? getProcessState(montage) : null, [montage]);

    // Generate Nodes and Edges
    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const linearNodes: Node[] = [];
        const linearEdges: Edge[] = [];
        let currentX = 0;
        const Y_CENTER = 100;

        PROCESS_STEPS.forEach((step) => {
            // Step Status
            let status = 'locked';
            if (processState) {
                const stepState = processState.steps.find(s => s.id === step.id);
                status = stepState?.status || 'locked';
            } else {
                status = 'default';
            }

            // 1. The Main Step Block
            const stepNodeId = `step-${step.id}`;
            linearNodes.push({
                id: stepNodeId,
                type: 'stepNode',
                position: { x: currentX, y: Y_CENTER - 40 }, // Centered vertically
                data: { 
                    label: step.label, 
                    actor: step.actor,
                    status: status,
                    automationsCount: step.automations.length
                },
            });

            // 1b. Process Automations (Satellites)
            step.automations.forEach((auto, autoIdx) => {
                const autoNodeId = `auto-${step.id}-${autoIdx}`;
                // Position above the step
                const autoX = currentX + (autoIdx * 40); // Stagger if multiple
                const autoY = Y_CENTER - 100 - (autoIdx % 2 * 20); // Above step

                linearNodes.push({
                    id: autoNodeId,
                    type: 'automationNode',
                    position: { x: autoX, y: autoY },
                    data: {
                        label: auto.label,
                        description: auto.description
                    }
                });

                // Connect Step -> Automation
                linearEdges.push({
                    id: `e-${stepNodeId}-${autoNodeId}`,
                    source: stepNodeId,
                    target: autoNodeId,
                    sourceHandle: 'top',
                    type: 'straight',
                    style: { stroke: '#fbbf24', strokeWidth: 1, strokeDasharray: '4 2' },
                });
            });

            let previousNodeId = stepNodeId;
            currentX += 250; // Move right after step

            // 2. The Checkpoints (Diamonds)
            step.checkpoints.forEach((cp) => {
                const cpNodeId = `cp-${step.id}-${cp.key}`;
                const isMet = processState?.steps.find(s => s.id === step.id)?.checkpointsState.find(c => c.key === cp.key)?.isMet || false;
                const isCurrentStep = status === 'current';

                linearNodes.push({
                    id: cpNodeId,
                    type: 'checkpointNode',
                    position: { x: currentX, y: Y_CENTER },
                    data: { 
                        label: cp.label,
                        isMet,
                        isCurrentStep
                    },
                });

                // Edge from previous to this CP
                linearEdges.push({
                    id: `e-${previousNodeId}-${cpNodeId}`,
                    source: previousNodeId,
                    target: cpNodeId,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                });

                previousNodeId = cpNodeId;
                currentX += 150; // Move right after CP
            });
        });

        // Pass 2: Create edges between steps with Gates
        // Helper to find the last node ID generated for a step
        const getLastNodeIdForStep = (stepIndex: number) => {
            const step = PROCESS_STEPS[stepIndex];
            if (step.checkpoints.length > 0) {
                const lastCp = step.checkpoints[step.checkpoints.length - 1];
                return `cp-${step.id}-${lastCp.key}`;
            }
            return `step-${step.id}`;
        };

        for (let i = 0; i < PROCESS_STEPS.length - 1; i++) {
            const sourceId = getLastNodeIdForStep(i);
            const targetId = `step-${PROCESS_STEPS[i + 1].id}`;
            
            linearEdges.push({
                id: `e-step-connect-${i}`,
                source: sourceId,
                target: targetId,
                type: 'smoothstep',
                animated: true,
                label: 'Auto-Next',
                labelStyle: { fill: '#059669', fontWeight: 700, fontSize: 10 },
                labelBgStyle: { fill: '#ecfdf5' },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
                style: { stroke: '#64748b', strokeWidth: 2 },
            });
        }

        return { nodes: linearNodes, edges: linearEdges };
    }, [processState]);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    return (
        <Dialog>
            <div className="w-full h-[400px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative group">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.5}
                    maxZoom={1.5}
                >
                    <Background color="#e2e8f0" gap={16} />
                    <Controls />
                </ReactFlow>
                
                <DialogTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="absolute top-4 right-4 z-10 gap-2 shadow-sm bg-white/90 hover:bg-white"
                    >
                        <Maximize2 className="w-4 h-4" />
                        Pełny ekran
                    </Button>
                </DialogTrigger>
            </div>

            <DialogContent className="max-w-[95vw]! w-[95vw]! h-[90vh]! p-0 gap-0 border-none bg-slate-50">
                <div className="relative w-full h-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                        attributionPosition="bottom-right"
                        minZoom={0.1}
                        maxZoom={2}
                    >
                        <Background color="#e2e8f0" gap={16} />
                        <Controls />
                    </ReactFlow>
                    
                    <DialogClose asChild>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="absolute top-4 right-4 z-10 shadow-sm bg-white/90 hover:bg-white"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
