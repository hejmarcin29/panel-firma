"use client";

import { useState } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Home, 
  Calendar, 
  Package, 
  Hammer, 
  Mail,
  Settings,
  Image as ImageIcon,
  ClipboardList,
  KanbanSquare,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateMobileMenuConfig, type MobileMenuItem } from "../actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
    "Home": Home,
    "Calendar": Calendar,
    "Package": Package,
    "Hammer": Hammer,
    "Mail": Mail,
    "Settings": Settings,
    "ImageIcon": ImageIcon,
    "ClipboardList": ClipboardList,
    "KanbanSquare": KanbanSquare
};

const DEFAULT_ITEMS: MobileMenuItem[] = [
    { id: "home", label: "Start", href: "/dashboard", iconName: "Home", visible: true },
    { id: "todo", label: "To Do", href: "/dashboard/todo", iconName: "KanbanSquare", visible: true },
    { id: "tasks", label: "Zad. Montaże", href: "/dashboard/zadania", iconName: "ClipboardList", visible: true },
    { id: "calendar", label: "Kalendarz", href: "/dashboard/calendar", iconName: "Calendar", visible: true },
    { id: "orders", label: "Zamówienia", href: "/dashboard/orders", iconName: "Package", visible: false },
    { id: "montages", label: "Montaże", href: "/dashboard/montaze", iconName: "Hammer", visible: false },
    { id: "mail", label: "Poczta", href: "/dashboard/mail", iconName: "Mail", visible: false },
    { id: "gallery", label: "Galeria", href: "/dashboard/montaze/galeria", iconName: "ImageIcon", visible: false },
    { id: "settings", label: "Ustawienia", href: "/dashboard/settings", iconName: "Settings", visible: false },
];

interface SortableItemProps {
    item: MobileMenuItem;
    onToggle: (id: string) => void;
}

function SortableItem({ item, onToggle }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = ICON_MAP[item.iconName] || Home;

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border mb-2 touch-none">
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-background rounded-md border">
                        <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">
                    {item.visible ? "Widoczne" : "Ukryte"}
                </span>
                <Switch 
                    checked={item.visible} 
                    onCheckedChange={() => onToggle(item.id)} 
                />
            </div>
        </div>
    );
}

export function MobileMenuSettings({ initialConfig }: { initialConfig?: MobileMenuItem[] | null }) {
    const [items, setItems] = useState<MobileMenuItem[]>(() => {
        if (!initialConfig || initialConfig.length === 0) return DEFAULT_ITEMS;
        
        // Merge with default to ensure all items exist (in case we add new ones later)
        const existingIds = new Set(initialConfig.map(i => i.id));
        const missingItems = DEFAULT_ITEMS.filter(i => !existingIds.has(i.id));
        return [...initialConfig, ...missingItems];
    });
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleToggle = (id: string) => {
        setItems(items.map(item => 
            item.id === id ? { ...item, visible: !item.visible } : item
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateMobileMenuConfig(items);
            toast.success("Zapisano ustawienia menu");
        } catch {
            toast.error("Błąd zapisu ustawień");
        } finally {
            setIsSaving(false);
        }
    };

    const visibleCount = items.filter(i => i.visible).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Menu Mobilne</CardTitle>
                <CardDescription>
                    Dostosuj dolny pasek nawigacji w wersji mobilnej. Przeciągnij, aby zmienić kolejność.
                    Zalecane maksymalnie 4-5 widocznych elementów.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {visibleCount > 5 && (
                    <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-3 rounded-md text-sm border border-yellow-500/20">
                        Uwaga: Wybrano więcej niż 5 elementów. Na mniejszych ekranach mogą się nie zmieścić.
                    </div>
                )}
                
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext 
                        items={items.map(i => i.id)} 
                        strategy={verticalListSortingStrategy}
                    >
                        {items.map((item) => (
                            <SortableItem 
                                key={item.id} 
                                item={item} 
                                onToggle={handleToggle} 
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
