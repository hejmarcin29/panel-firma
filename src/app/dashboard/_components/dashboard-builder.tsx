'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Pencil, Settings, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebouncedCallback } from 'use-debounce';

import { AgendaWidget, type AgendaItem } from './agenda-widget';
import { RecentActivity } from './recent-activity';
import { QuickActions } from './quick-actions';
import { KPICards } from './kpi-cards';
import { MontageAlertsKPI, type MontageAlertItem } from './montage-alerts-kpi';
import { MeasurementAlertsKPI, type MeasurementAlertItem } from './measurement-alerts-kpi';
import { UpcomingMontagesKPI, type MontageSimple } from './upcoming-montages-kpi';
import { updateDashboardLayout, type DashboardLayoutConfig, type DashboardWidgetConfig } from '../actions';
import { toast } from 'sonner';
import type { Montage } from '../crm/montaze/types';

// Widget Registry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'kpi': KPICards,
  'montage-alerts': MontageAlertsKPI,
  'measurement-alerts': MeasurementAlertsKPI,
  'upcoming-montages': UpcomingMontagesKPI,
  'agenda': AgendaWidget,
  'recent-activity': RecentActivity,
  'quick-actions': QuickActions,
};

const WIDGET_LABELS: Record<string, string> = {
    'kpi': 'Statystyki (KPI)',
    'montage-alerts': 'Zagrożone Montaże',
    'measurement-alerts': 'Zagrożone Pomiary/Oferty',
    'upcoming-montages': 'Harmonogram montaży',
    'agenda': 'Najbliższe montaże',
    'recent-activity': 'Ostatnia Aktywność',
    'quick-actions': 'Szybkie Akcje',
};

function WidgetSettingsDialog({ 
    open, 
    onOpenChange, 
    widget, 
    onSave 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    widget: DashboardWidgetConfig | null; 
    onSave: (settings: Record<string, unknown>) => void; 
}) {
    const [localSettings, setLocalSettings] = useState<Record<string, unknown>>(widget?.settings || {});

    if (!widget) return null;

    const handleSave = () => {
        onSave(localSettings);
        onOpenChange(false);
    };

    // KPI Specific Settings
    if (widget.type === 'kpi') {
        const visibleCards = (localSettings.visibleCards as string[] | undefined) || ['leads', 'payments', 'contracts', 'urgent', 'orders', 'urgentOrders', 'stalledOrders'];
        
        const toggleCard = (card: string) => {
            if (visibleCards.includes(card)) {
                setLocalSettings({ ...localSettings, visibleCards: visibleCards.filter((c: string) => c !== card) });
            } else {
                setLocalSettings({ ...localSettings, visibleCards: [...visibleCards, card] });
            }
        };

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfiguracja: {WIDGET_LABELS[widget.type]}</DialogTitle>
                        <DialogDescription>Wybierz które karty mają być widoczne.</DialogDescription>
                    </DialogHeader>
                    <div className='grid gap-4 py-4'>
                        <div className='flex items-center space-x-2'>
                            <Checkbox 
                                id='card-leads' 
                                checked={visibleCards.includes('leads')}
                                onCheckedChange={() => toggleCard('leads')}
                            />
                            <Label htmlFor='card-leads'>Nowe Leady</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox 
                                id='card-orders' 
                                checked={visibleCards.includes('orders')}
                                onCheckedChange={() => toggleCard('orders')}
                            />
                            <Label htmlFor='card-orders'>Nowe Zamówienia</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox 
                                id='card-payments' 
                                checked={visibleCards.includes('payments')}
                                onCheckedChange={() => toggleCard('payments')}
                            />
                            <Label htmlFor='card-payments'>Oczekujące płatności</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox 
                                id='card-contracts' 
                                checked={visibleCards.includes('contracts')}
                                onCheckedChange={() => toggleCard('contracts')}
                            />
                            <Label htmlFor='card-contracts'>Do Podpisania (Umowy)</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox 
                                id='card-urgent' 
                                checked={visibleCards.includes('urgent')}
                                onCheckedChange={() => toggleCard('urgent')}
                            />
                            <Label htmlFor='card-urgent'>Pilne Montaże</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox 
                                id='card-urgentOrders' 
                                checked={visibleCards.includes('urgentOrders')}
                                onCheckedChange={() => toggleCard('urgentOrders')}
                            />
                            <Label htmlFor='card-urgentOrders'>Pilne Zamówienia</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox 
                                id='card-stalledOrders' 
                                checked={visibleCards.includes('stalledOrders')}
                                onCheckedChange={() => toggleCard('stalledOrders')}
                            />
                            <Label htmlFor='card-stalledOrders'>Brak Faktury</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Zatwierdź</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return null;
}

interface DashboardBuilderProps {
  initialLayout: DashboardLayoutConfig;
  data: {
    upcomingMontages: AgendaItem[];
    recentMontages: Montage[];
    tasksStats: {
        tasksCount: number;
        urgentCount: number;
        todoCount: number;
        reminderTasks: { id: string; content: string; reminderAt: Date | null; dueDate: Date | null }[];
    };
    kpiData: {
        newLeadsCount: number;
        leadsBreakdown?: {
            new: number;
            attempt: number;
            established: number;
        };
        pendingPaymentsCount: number;
        urgentTasksCount: number;
        newOrdersCount: number;
        todoCount: number;
        urgentOrdersCount?: number;
        stalledOrdersCount?: number;
        orderUrgentDays?: number;
    };
    upcomingMontagesStats: {
        montages7Days: MontageSimple[];
        montages3Days: MontageSimple[];
        montagesInProgress: MontageSimple[];
    };
    montageAlerts: MontageAlertItem[];
    measurementAlerts: MeasurementAlertItem[];
    threatDays?: number;
  };
}

import { motion } from 'framer-motion';

function SortableWidget({ widget, data, isEditing, onConfigure }: { id: string; widget: DashboardWidgetConfig; data: DashboardBuilderProps['data']; isEditing: boolean; onConfigure: (widget: DashboardWidgetConfig) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: isEditing ? 'none' : 'auto', // Explicitly allow touch actions when not editing
  };

  const Component = WIDGET_COMPONENTS[widget.type];

  if (!Component) return null;

  // Map data to widget props
  const props = widget.type === 'agenda' ? { upcomingMontages: data.upcomingMontages } :
                widget.type === 'recent-activity' ? { recentMontages: data.recentMontages } :
                widget.type === 'tasks' ? { ...data.tasksStats, todoCount: data.kpiData.todoCount } :
                widget.type === 'kpi' ? { ...data.kpiData, settings: widget.settings, montageThreatDays: data.threatDays } :
                widget.type === 'montage-alerts' ? { alerts: data.montageAlerts, threatDays: data.threatDays } :
                widget.type === 'measurement-alerts' ? { alerts: data.measurementAlerts } :
                widget.type === 'upcoming-montages' ? { ...data.upcomingMontagesStats } :
                {};

  return (
    <motion.div 
        ref={setNodeRef} 
        style={style} 
        className='relative h-full'
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
    >
        {isEditing && (
            <div 
                {...attributes} 
                {...listeners} 
                className='absolute inset-0 z-50 bg-background/50 flex items-center justify-center border-2 border-dashed border-primary/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-background/70 transition-colors'
            >
                <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm bg-background px-3 py-1 rounded-full shadow-sm border'>
                        {WIDGET_LABELS[widget.type] || widget.type}
                    </span>
                    {widget.type === 'kpi' && (
                        <Button 
                            variant='secondary' 
                            size='icon' 
                            className='h-7 w-7 rounded-full shadow-sm border'
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfigure(widget);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Settings className='h-3 w-3' />
                        </Button>
                    )}
                </div>
            </div>
        )}
        <Component {...props} />
    </motion.div>
  );
}

export function DashboardBuilder({ initialLayout, data }: DashboardBuilderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<DashboardLayoutConfig>(initialLayout);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidgetConfig | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const debouncedSave = useDebouncedCallback(async (newLayout: DashboardLayoutConfig) => {
      setIsSaving(true);
      try {
          await updateDashboardLayout(newLayout);
          setLastSaved(new Date());
      } catch (error) {
          console.error('Failed to save layout:', error);
          toast.error('Błąd zapisu układu');
      } finally {
          setIsSaving(false);
      }
  }, 1000);

  // Trigger save whenever layout changes, but only if it's different from initial (to avoid initial save)
  // Actually, we only want to trigger save on user interaction, so we'll call debouncedSave in handlers.

  function findContainer(id: string) {
    if (id in layout.columns) {
      return id;
    }
    return Object.keys(layout.columns).find((key) =>
      layout.columns[key].find((w) => w.id === id)
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(overId));

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setLayout((prev) => {
      const activeItems = prev.columns[activeContainer];
      const overItems = prev.columns[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      let newIndex;
      if (overId in prev.columns) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      const newLayout = {
        ...prev,
        columns: {
          ...prev.columns,
          [activeContainer]: [
            ...prev.columns[activeContainer].filter((item) => item.id !== active.id),
          ],
          [overContainer]: [
            ...prev.columns[overContainer].slice(0, newIndex),
            activeItems[activeIndex],
            ...prev.columns[overContainer].slice(newIndex, overItems.length),
          ],
        },
      };
      
      // We don't save on drag over, only on drag end
      return newLayout;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(String(active.id));
    const overContainer = over ? findContainer(String(over.id)) : null;

    if (
      activeContainer &&
      overContainer &&
      activeContainer === overContainer &&
      over
    ) {
      const activeIndex = layout.columns[activeContainer].findIndex(
        (i) => i.id === active.id
      );
      const overIndex = layout.columns[overContainer].findIndex(
        (i) => i.id === over.id
      );

      if (activeIndex !== overIndex) {
        setLayout((prev) => {
            const newLayout = {
                ...prev,
                columns: {
                    ...prev.columns,
                    [activeContainer]: arrayMove(
                        prev.columns[activeContainer],
                        activeIndex,
                        overIndex
                    ),
                },
            };
            debouncedSave(newLayout);
            return newLayout;
        });
      }
    } else {
        // If we moved between containers (handled in DragOver), we still need to save the final state
        debouncedSave(layout);
    }

    setActiveId(null);
  };

  return (
    <div className='space-y-4'>
        <div className='flex justify-end items-center gap-4'>
            <div className='flex items-center gap-2'>
                {isSaving ? (
                    <span className='text-xs text-muted-foreground flex items-center gap-1'>
                        <Loader2 className='w-3 h-3 animate-spin' />
                        Zapisywanie...
                    </span>
                ) : (
                    <span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!!lastSaved}>
                        <Check className='w-3 h-3' />
                        Zapisano
                    </span>
                )}
            </div>
            
            {isEditing ? (
                <Button size='sm' onClick={() => setIsEditing(false)}>
                    <Check className='mr-2 h-4 w-4' />
                    Zakończ edycję
                </Button>
            ) : (
                <Button variant='ghost' size='sm' onClick={() => setIsEditing(true)}>
                    <Pencil className='mr-2 h-4 w-4' />
                    Dostosuj układ
                </Button>
            )}
        </div>

        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-3'>
                {/* Left Column (Main) */}
                <div className='lg:col-span-2 space-y-6'>
                    {/* Left Column - Vertical Stack */}
                    <SortableContext
                        id='left'
                        items={layout.columns.left.map((w) => w.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className='space-y-6'>
                            {layout.columns.left.map((widget) => (
                                <SortableWidget 
                                    key={widget.id} 
                                    id={widget.id} 
                                    widget={widget} 
                                    data={data} 
                                    isEditing={isEditing} 
                                    onConfigure={(w) => {
                                        setSelectedWidget(w);
                                        setSettingsDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>

                {/* Right Column (Sidebar) */}
                <div className='space-y-6'>
                    <SortableContext
                        id='right'
                        items={layout.columns.right.map((w) => w.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className='space-y-6 min-h-25'>
                            {layout.columns.right.map((widget) => (
                                <SortableWidget 
                                    key={widget.id}  
                                    id={widget.id} 
                                    widget={widget} 
                                    data={data} 
                                    isEditing={isEditing} 
                                    onConfigure={(w) => {
                                        setSelectedWidget(w);
                                        setSettingsDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            </div>
            
            <DragOverlay>
                {activeId ? (
                    <div className='opacity-80'>
                         {/* Placeholder for drag overlay - simplified */}
                         <div className='bg-background border rounded-lg p-4 shadow-lg'>
                            Przenoszenie...
                         </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>

        {/* Widget Settings Dialog - for configuring widget settings like KPI cards visibility */}
        {selectedWidget && (
            <WidgetSettingsDialog
                open={settingsDialogOpen}
                onOpenChange={setSettingsDialogOpen}
                widget={selectedWidget}
                onSave={(settings) => {
                    setLayout((prev) => {
                        const updatedColumns = { ...prev.columns };
                        const widgetColumn = Object.keys(updatedColumns).find((key) =>
                          updatedColumns[key].find((w) => w.id === selectedWidget?.id)
                        );
                        
                        if (widgetColumn) {
                          updatedColumns[widgetColumn] = updatedColumns[widgetColumn].map((w) =>
                            w.id === selectedWidget.id ? { ...w, settings } : w
                          );
                        }

                        const newLayout = {
                          ...prev,
                          columns: updatedColumns,
                        };
                        debouncedSave(newLayout);
                        return newLayout;
                    });
                }}
            />
        )}
    </div>
  );
}
