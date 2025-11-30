"use client";

import { useState } from "react";
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { AgendaWidget, type AgendaItem } from "./agenda-widget";
import { RecentActivity } from "./recent-activity";
import { QuickActions } from "./quick-actions";
import { TasksWidget } from "./tasks-widget";
import { KPICards } from "./kpi-cards";
import { updateDashboardLayout, type DashboardLayoutConfig, type DashboardWidgetConfig } from "../actions";
import { toast } from "sonner";
import type { Montage } from "../montaze/types";

// Widget Registry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  "kpi": KPICards,
  "agenda": AgendaWidget,
  "recent-activity": RecentActivity,
  "quick-actions": QuickActions,
  "tasks": TasksWidget,
};

const WIDGET_LABELS: Record<string, string> = {
    "kpi": "Statystyki (KPI)",
    "agenda": "Najbliższe montaże",
    "recent-activity": "Ostatnia Aktywność",
    "quick-actions": "Szybkie Akcje",
    "tasks": "Zadania do wykonania",
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
        const visibleCards = (localSettings.visibleCards as string[] | undefined) || ['today', 'leads', 'payments', 'urgent', 'orders', 'todo'];
        
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
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="card-today" 
                                checked={visibleCards.includes('today')}
                                onCheckedChange={() => toggleCard('today')}
                            />
                            <Label htmlFor="card-today">Dzisiejsze montaże</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="card-todo" 
                                checked={visibleCards.includes('todo')}
                                onCheckedChange={() => toggleCard('todo')}
                            />
                            <Label htmlFor="card-todo">To Do (Osobiste)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="card-leads" 
                                checked={visibleCards.includes('leads')}
                                onCheckedChange={() => toggleCard('leads')}
                            />
                            <Label htmlFor="card-leads">Nowe Leady</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="card-orders" 
                                checked={visibleCards.includes('orders')}
                                onCheckedChange={() => toggleCard('orders')}
                            />
                            <Label htmlFor="card-orders">Nowe Zamówienia</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="card-payments" 
                                checked={visibleCards.includes('payments')}
                                onCheckedChange={() => toggleCard('payments')}
                            />
                            <Label htmlFor="card-payments">Oczekujące płatności</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="card-urgent" 
                                checked={visibleCards.includes('urgent')}
                                onCheckedChange={() => toggleCard('urgent')}
                            />
                            <Label htmlFor="card-urgent">Pilne zadania</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Zapisz</Button>
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
    };
    kpiData: {
        todayMontagesCount: number;
        newLeadsCount: number;
        pendingPaymentsCount: number;
        urgentTasksCount: number;
        newOrdersCount: number;
        todoCount: number;
    };
  };
}

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
  };

  const Component = WIDGET_COMPONENTS[widget.type];

  if (!Component) return null;

  // Map data to widget props
  const props = widget.type === "agenda" ? { upcomingMontages: data.upcomingMontages } :
                widget.type === "recent-activity" ? { recentMontages: data.recentMontages } :
                widget.type === "tasks" ? { ...data.tasksStats, todoCount: data.kpiData.todoCount } :
                widget.type === "kpi" ? { ...data.kpiData, settings: widget.settings } :
                {};

  return (
    <div ref={setNodeRef} style={style} className="relative h-full">
        {isEditing && (
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute inset-0 z-50 bg-background/50 flex items-center justify-center border-2 border-dashed border-primary/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-background/70 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm bg-background px-3 py-1 rounded-full shadow-sm border">
                        {WIDGET_LABELS[widget.type] || widget.type}
                    </span>
                    {widget.type === 'kpi' && (
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-7 w-7 rounded-full shadow-sm border"
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfigure(widget);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Settings className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
        )}
        <Component {...props} />
    </div>
  );
}

export function DashboardBuilder({ initialLayout, data }: DashboardBuilderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<DashboardLayoutConfig>(initialLayout);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidgetConfig | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSave = async () => {
      try {
          await updateDashboardLayout(layout);
          setIsEditing(false);
          toast.success("Układ zapisany");
      } catch {
          toast.error("Błąd zapisu układu");
      }
  };

  const handleCancel = () => {
      setLayout(initialLayout);
      setIsEditing(false);
  };

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

      return {
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
        setLayout((prev) => ({
          ...prev,
          columns: {
            ...prev.columns,
            [activeContainer]: arrayMove(
              prev.columns[activeContainer],
              activeIndex,
              overIndex
            ),
          },
        }));
      }
    }

    setActiveId(null);
  };

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            {isEditing ? (
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        Anuluj
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Zapisz układ
                    </Button>
                </div>
            ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edytuj układ
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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {/* Left Column (Main) */}
                <div className="lg:col-span-2 space-y-6">
                    <SortableContext
                        id="left"
                        items={layout.columns.left.map((w) => w.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-6 min-h-[100px]">
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
                <div className="space-y-6">
                    <SortableContext
                        id="right"
                        items={layout.columns.right.map((w) => w.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-6 min-h-[100px]">
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
                    <div className="opacity-80">
                         {/* Placeholder for drag overlay - simplified */}
                         <div className="bg-background border rounded-lg p-4 shadow-lg">
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

                        return {
                          ...prev,
                          columns: updatedColumns,
                        };
                    });
                }}
            />
        )}
    </div>
  );
}
