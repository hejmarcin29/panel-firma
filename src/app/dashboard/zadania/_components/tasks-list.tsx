"use client";

import { useState } from "react";
import { MapPin, Calendar, CheckCircle2, SortAsc, SortDesc, LayoutList, ListTodo } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toggleMontageTask } from "../../montaze/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SwipeableTaskItem } from "./swipeable-task-item";

export interface Task {
    id: string;
    title: string;
    completed: boolean;
}

export interface TaskItem {
    id: string;
    clientName: string;
    installationCity: string | null;
    scheduledInstallationAt: Date | number | string | null;
    displayId: string | null;
    tasks: Task[];
    pendingTasksCount: number;
}

interface TasksListProps {
  tasksMontages: TaskItem[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function TasksList({ tasksMontages }: TasksListProps) {
    const router = useRouter();
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'clients' | 'tasks'>('clients');

    const handleToggleTask = async (taskId: string, montageId: string, currentCompleted: boolean) => {
        if (pendingIds.has(taskId)) return;

        setPendingIds(prev => new Set(prev).add(taskId));
        try {
            await toggleMontageTask({ taskId, montageId, completed: !currentCompleted });
            toast.success("Zaktualizowano status zadania");
            router.refresh();
        } catch (error) {
            toast.error("Nie udało się zaktualizować zadania");
            console.error(error);
        } finally {
            setPendingIds(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    };

    const getUrgencyColor = (dateStr: Date | number | string | null) => {
        if (!dateStr) return "text-muted-foreground";
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) return "text-destructive font-medium"; // Overdue
        if (date.getTime() === today.getTime()) return "text-orange-600 font-medium"; // Today
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        if (date <= nextWeek) return "text-yellow-600"; // Within week
        return "text-muted-foreground";
    };

    const filterTasks = (category: 'urgent' | 'today' | 'week' | 'all') => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return tasksMontages.filter(m => {
            if (!m.scheduledInstallationAt) return category === 'all';
            const date = new Date(m.scheduledInstallationAt);
            date.setHours(0, 0, 0, 0);

            if (category === 'urgent') return date < today;
            if (category === 'today') return date.getTime() === today.getTime();
            if (category === 'week') return date <= nextWeek && date >= today;
            return true;
        }).sort((a, b) => {
            const dateA = a.scheduledInstallationAt ? new Date(a.scheduledInstallationAt).getTime() : Number.MAX_SAFE_INTEGER;
            const dateB = b.scheduledInstallationAt ? new Date(b.scheduledInstallationAt).getTime() : Number.MAX_SAFE_INTEGER;
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    };

    const renderFlatList = (items: TaskItem[]) => {
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-20" />
                    <p>Brak zadań w tej kategorii</p>
                </div>
            );
        }

        // Flatten tasks
        const flatTasks = items.flatMap(montage => 
            montage.tasks.map(task => ({
                ...task,
                montage
            }))
        );

        return (
            <motion.div 
                className="space-y-2"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {flatTasks.map((item) => (
                    <motion.div key={item.id} variants={itemVariant}>
                        <SwipeableTaskItem 
                            onComplete={() => handleToggleTask(item.id, item.montage.id, item.completed)}
                            onEdit={() => router.push(`/dashboard/montaze/${item.montage.id}?tab=tasks`)}
                        >
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <Checkbox 
                                        id={`flat-${item.id}`} 
                                        checked={item.completed}
                                        onCheckedChange={() => handleToggleTask(item.id, item.montage.id, item.completed)}
                                        disabled={pendingIds.has(item.id)}
                                        className="mt-1"
                                    />
                                    <div className="space-y-1 flex-1">
                                        <label 
                                            htmlFor={`flat-${item.id}`} 
                                            className={cn(
                                                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none block",
                                                item.completed && "line-through text-muted-foreground"
                                            )}
                                        >
                                            {item.title}
                                        </label>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground/80">{item.montage.clientName}</span>
                                            <span className={cn("flex items-center", getUrgencyColor(item.montage.scheduledInstallationAt))}>
                                                <Calendar className="mr-1 h-3 w-3" />
                                                {item.montage.scheduledInstallationAt ? new Date(item.montage.scheduledInstallationAt).toLocaleDateString() : 'Brak terminu'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
                                    <Link href={`/dashboard/montaze/${item.montage.id}?tab=tasks`}>
                                        <LayoutList className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </SwipeableTaskItem>
                    </motion.div>
                ))}
            </motion.div>
        );
    };

    const renderList = (items: TaskItem[]) => {
        if (viewMode === 'tasks') {
            return renderFlatList(items);
        }

        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-20" />
                    <p>Brak zadań w tej kategorii</p>
                </div>
            );
        }

        return (
            <Accordion type="multiple" className="w-full space-y-4">
                {items.map((montage) => (
                    <AccordionItem key={montage.id} value={montage.id} className="border rounded-lg px-4 bg-card">
                        <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center gap-4 text-left w-full">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                                    {montage.displayId?.split('/').pop() || 'M'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-semibold truncate text-base">{montage.clientName}</span>
                                        <Badge variant="secondary" className="ml-2 shrink-0">
                                            {montage.pendingTasksCount} zad.
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className={cn("flex items-center", getUrgencyColor(montage.scheduledInstallationAt))}>
                                            <Calendar className="mr-1.5 h-4 w-4" />
                                            {montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt).toLocaleDateString() : 'Brak terminu'}
                                        </span>
                                        {montage.installationCity && (
                                            <span className="flex items-center text-muted-foreground">
                                                <MapPin className="mr-1.5 h-4 w-4" />
                                                {montage.installationCity}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <motion.div 
                                className="space-y-2 pl-4 pr-2"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {montage.tasks.map((task) => (
                                    <motion.div key={task.id} variants={itemVariant}>
                                        <SwipeableTaskItem
                                            onComplete={() => handleToggleTask(task.id, montage.id, task.completed)}
                                            onEdit={() => router.push(`/dashboard/montaze/${montage.id}?tab=tasks`)}
                                        >
                                            <div className="flex items-start gap-3 p-3">
                                                <Checkbox 
                                                    id={task.id} 
                                                    checked={task.completed}
                                                    onCheckedChange={() => handleToggleTask(task.id, montage.id, task.completed)}
                                                    disabled={pendingIds.has(task.id)}
                                                    className="mt-1"
                                                />
                                                <label 
                                                    htmlFor={task.id} 
                                                    className={cn(
                                                        "text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none flex-1",
                                                        task.completed && "line-through text-muted-foreground"
                                                    )}
                                                >
                                                    {task.title}
                                                </label>
                                            </div>
                                        </SwipeableTaskItem>
                                    </motion.div>
                                ))}
                                <div className="pt-4 flex justify-end">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/montaze/${montage.id}?tab=tasks`}>
                                            Przejdź do szczegółów montażu &rarr;
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Lista zadań</h2>
                <div className="flex items-center gap-2">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'clients' | 'tasks')}>
                        <ToggleGroupItem value="clients" aria-label="Widok klientów">
                            <LayoutList className="h-4 w-4 mr-2" />
                            Klienci
                        </ToggleGroupItem>
                        <ToggleGroupItem value="tasks" aria-label="Widok zadań">
                            <ListTodo className="h-4 w-4 mr-2" />
                            Zadania
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <div className="h-6 w-px bg-border mx-2" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="gap-2"
                    >
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        {sortOrder === 'asc' ? 'Od najpilniejszych' : 'Od najdalszych'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all">
                        Wszystkie
                    </TabsTrigger>
                    <TabsTrigger value="urgent" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                        Pilne / Zaległe
                    </TabsTrigger>
                    <TabsTrigger value="today" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                        Na dziś
                    </TabsTrigger>
                    <TabsTrigger value="week" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                        Ten tydzień
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                    {renderList(filterTasks('all'))}
                </TabsContent>
                <TabsContent value="urgent" className="mt-0">
                    {renderList(filterTasks('urgent'))}
                </TabsContent>
                <TabsContent value="today" className="mt-0">
                    {renderList(filterTasks('today'))}
                </TabsContent>
                <TabsContent value="week" className="mt-0">
                    {renderList(filterTasks('week'))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
