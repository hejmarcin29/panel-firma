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
  LayoutDashboard, 
  CalendarDays, 
  ShoppingBag, 
  HardHat, 
  MessageSquare,
  Settings2,
  Images,
  ClipboardCheck,
  ListTodo,
  GripVertical,
  Smartphone,
  Sparkles,
  LayoutGrid,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateMobileMenuConfig, type MobileMenuItem } from "../actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
    "Home": LayoutDashboard,
    "Calendar": CalendarDays,
    "Package": ShoppingBag,
    "Hammer": HardHat,
    "Mail": MessageSquare,
    "Settings": Settings2,
    "ImageIcon": Images,
    "ClipboardList": ClipboardCheck,
    "KanbanSquare": ListTodo,
    "Users": Users
};

const DEFAULT_ITEMS: MobileMenuItem[] = [
    { id: "home", label: "Start", href: "/dashboard", iconName: "Home", visible: true },
    { id: "todo", label: "To Do", href: "/dashboard/todo", iconName: "KanbanSquare", visible: true },
    { id: "tasks", label: "Zad. Montaże", href: "/dashboard/zadania", iconName: "ClipboardList", visible: true },
    { id: "calendar", label: "Kalendarz", href: "/dashboard/calendar", iconName: "Calendar", visible: true },
    { id: "customers", label: "Klienci", href: "/dashboard/customers", iconName: "Users", visible: true },
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
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const Icon = ICON_MAP[item.iconName] || LayoutDashboard;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layoutId={item.id}
            initial={false}
            animate={{
                scale: isDragging ? 1.02 : 1,
                backgroundColor: isDragging 
                    ? "var(--bg-dragging)" 
                    : item.visible ? "var(--bg-visible)" : "var(--bg-hidden)",
                borderColor: isDragging
                    ? "var(--border-dragging)"
                    : item.visible ? "var(--border-visible)" : "transparent"
            }}
            whileHover={{ scale: isDragging ? 1.02 : 1.01 }}
            className={cn(
                "group relative flex items-center justify-between p-4 mb-3 rounded-xl border transition-colors duration-200",
                // CSS variables for framer-motion to interpolate
                "[--bg-dragging:var(--color-white)] dark:[--bg-dragging:var(--color-zinc-800)]",
                "[--bg-visible:var(--color-white)] dark:[--bg-visible:var(--color-zinc-900)]",
                "[--bg-hidden:var(--color-zinc-50)] dark:[--bg-hidden:var(--color-zinc-900)]/30",
                "[--border-dragging:var(--color-primary)]/50",
                "[--border-visible:var(--color-zinc-200)] dark:[--border-visible:var(--color-zinc-800)]",
                
                isDragging ? "shadow-2xl ring-2 ring-primary/20" : "",
                !isDragging && item.visible ? "shadow-sm" : "",
                !isDragging && !item.visible ? "opacity-60 grayscale-[0.5]" : ""
            )}
        >
            <div className="flex items-center gap-4">
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="cursor-grab active:cursor-grabbing p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="flex items-center gap-4">
                    <motion.div 
                        className={cn(
                            "p-2.5 rounded-xl border shadow-sm",
                            item.visible 
                                ? "bg-linear-to-br from-primary/10 to-primary/5 border-primary/20 text-primary" 
                                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                        )}
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                    >
                        <Icon className="h-5 w-5" />
                    </motion.div>
                    <div className="flex flex-col">
                        <span className={cn(
                            "font-semibold text-sm transition-colors",
                            item.visible ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {item.visible ? "Widoczny w menu" : "Ukryty"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Switch 
                    checked={item.visible} 
                    onCheckedChange={() => onToggle(item.id)}
                    className="data-[state=checked]:bg-primary"
                />
            </div>
        </motion.div>
    );
}

function PhonePreview({ items }: { items: MobileMenuItem[] }) {
    const visibleItems = items.filter(i => i.visible);
    
    return (
        <div className="sticky top-8">
            <div className="relative mx-auto border-zinc-800 dark:border-zinc-800 bg-zinc-900 border-14 rounded-4xl h-[600px] w-[300px] shadow-xl">
                <div className="w-[148px] h-[18px] bg-zinc-800 top-0 rounded-b-2xl left-1/2 -translate-x-1/2 absolute"></div>
                <div className="h-8 w-[3px] bg-zinc-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-zinc-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                <div className="h-[46px] w-[3px] bg-zinc-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                <div className="h-16 w-[3px] bg-zinc-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                
                <div className="rounded-4xl overflow-hidden w-full h-full bg-white dark:bg-zinc-950 relative flex flex-col">
                    {/* Mock Content */}
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
                        <div className="h-32 rounded-2xl bg-linear-to-br from-primary/20 to-purple-500/20 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <div className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        </div>
                    </div>

                    {/* Bottom Navigation Bar */}
                    <div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-2 py-2 pb-6">
                        <div className="flex justify-around items-end h-[50px]">
                            <AnimatePresence mode="popLayout">
                                {visibleItems.slice(0, 5).map((item) => {
                                    const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                                    return (
                                        <motion.div 
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            className="flex flex-col items-center gap-1 p-1 w-1/5"
                                        >
                                            <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-[9px] font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[50px]">
                                                {item.label}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-center mt-6 text-sm text-muted-foreground">
                Podgląd na żywo
            </div>
        </div>
    );
}

export function MobileMenuSettings({ initialConfig }: { initialConfig?: MobileMenuItem[] | null }) {
    const [items, setItems] = useState<MobileMenuItem[]>(() => {
        if (!initialConfig || initialConfig.length === 0) return DEFAULT_ITEMS;
        
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
        <div className="grid gap-8 xl:grid-cols-12 items-start">
            <div className="xl:col-span-7 space-y-6">
                <Card className="border-none shadow-none bg-transparent p-0">
                    <CardHeader className="px-0 pt-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-600">
                                    Menu Mobilne
                                </CardTitle>
                                <CardDescription className="text-base mt-1">
                                    Zarządzaj wyglądem dolnego paska nawigacji w aplikacji mobilnej.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 space-y-6">
                        <AnimatePresence>
                            {visibleCount > 5 && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: -20 }}
                                    animate={{ opacity: 1, height: "auto", y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -20 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex items-start gap-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 p-4 rounded-xl text-sm border border-amber-500/20">
                                        <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold">Zalecana liczba elementów to 4-5</p>
                                            <p className="opacity-90">Wybrano {visibleCount} elementów. Na mniejszych ekranach mogą być trudne do kliknięcia.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl p-2 border border-zinc-100 dark:border-zinc-800/50">
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
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{visibleCount}</span> aktywnych elementów
                            </div>
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                size="lg"
                                className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="animate-spin mr-2">⟳</span> Zapisywanie...
                                    </>
                                ) : (
                                    <>
                                        Zapisz zmiany
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="hidden xl:block xl:col-span-5">
                <div className="sticky top-8 flex flex-col items-center">
                    <div className="mb-6 text-center">
                        <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-primary" />
                            Podgląd aplikacji
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Tak będzie wyglądać menu na urządzeniu użytkownika
                        </p>
                    </div>
                    <PhonePreview items={items} />
                </div>
            </div>
        </div>
    );
}
