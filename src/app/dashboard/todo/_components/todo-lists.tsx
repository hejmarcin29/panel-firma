"use client";

import { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2, MoreVertical, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  createTask, 
  toggleTaskCompletion, 
  updateTaskContent, 
  deleteTask,
  createColumn,
  deleteColumn,
  updateColumnTitle
} from "../actions";
import { useRouter } from "next/navigation";
import { SwipeableTaskItem } from "../../zadania/_components/swipeable-task-item";

// Types based on schema
interface Task {
    id: string;
    content: string;
    description?: string | null;
    completed: boolean;
    columnId: string;
    orderIndex: number;
}

interface Column {
    id: string;
    title: string;
    orderIndex: number;
    tasks: Task[];
}

interface TodoListsProps {
    initialColumns: Column[];
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

export function TodoLists({ initialColumns }: TodoListsProps) {
    const [columns, setColumns] = useState<Column[]>(initialColumns);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [newTaskInput, setNewTaskInput] = useState<{ [key: string]: string }>({});
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingColumnTitle, setEditingColumnTitle] = useState("");
    const router = useRouter();

    // Handlers
    const handleToggleTask = async (taskId: string, completed: boolean) => {
        // Optimistic update
        setColumns(prev => prev.map(col => ({
            ...col,
            tasks: col.tasks.map(t => t.id === taskId ? { ...t, completed } : t)
        })));

        try {
            await toggleTaskCompletion(taskId, completed);
        } catch {
            toast.error("Failed to update task");
            router.refresh();
        }
    };

    const handleOpenTask = (task: Task) => {
        setSelectedTask(task);
        setIsSheetOpen(true);
    };

    const handleSaveTaskDetails = async (taskId: string, content: string, description: string) => {
        // Optimistic update
        setColumns(prev => prev.map(col => ({
            ...col,
            tasks: col.tasks.map(t => t.id === taskId ? { ...t, content, description } : t)
        })));
        
        // Update selected task as well so the sheet reflects changes
        if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask({ ...selectedTask, content, description });
        }

        try {
            await updateTaskContent(taskId, content, description);
            toast.success("Zapisano zmiany");
        } catch {
            toast.error("Błąd zapisu");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        setColumns(prev => prev.map(col => ({
            ...col,
            tasks: col.tasks.filter(t => t.id !== taskId)
        })));
        setIsSheetOpen(false);

        try {
            await deleteTask(taskId);
            toast.success("Usunięto zadanie");
        } catch {
            toast.error("Błąd usuwania");
            router.refresh();
        }
    };

    const handleAddTask = async (columnId: string) => {
        const content = newTaskInput[columnId]?.trim();
        if (!content) return;

        const tempId = crypto.randomUUID();
        const newTask: Task = {
            id: tempId,
            content,
            columnId,
            completed: false,
            orderIndex: 9999, // temporary
            description: ""
        };

        setColumns(prev => prev.map(col => {
            if (col.id === columnId) {
                return { ...col, tasks: [...col.tasks, newTask] };
            }
            return col;
        }));

        setNewTaskInput(prev => ({ ...prev, [columnId]: "" }));

        try {
            await createTask(columnId, content);
            router.refresh(); // Refresh to get real ID
        } catch {
            toast.error("Błąd dodawania zadania");
            router.refresh();
        }
    };

    const handleAddColumn = async () => {
        if (!newColumnTitle.trim()) return;
        
        const tempId = crypto.randomUUID();
        const newColumn: Column = {
            id: tempId,
            title: newColumnTitle,
            orderIndex: columns.length,
            tasks: []
        };

        setColumns(prev => [...prev, newColumn]);
        setNewColumnTitle("");
        setIsAddingColumn(false);

        try {
            await createColumn(newColumnTitle);
            router.refresh();
        } catch {
            toast.error("Błąd dodawania listy");
            router.refresh();
        }
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (!confirm("Czy na pewno chcesz usunąć tę listę i wszystkie zadania?")) return;

        setColumns(prev => prev.filter(c => c.id !== columnId));

        try {
            await deleteColumn(columnId);
            toast.success("Usunięto listę");
        } catch {
            toast.error("Błąd usuwania listy");
            router.refresh();
        }
    };

    const handleRenameColumn = async (columnId: string) => {
        if (!editingColumnTitle.trim()) return;

        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, title: editingColumnTitle } : c));
        setEditingColumnId(null);

        try {
            await updateColumnTitle(columnId, editingColumnTitle);
        } catch {
            toast.error("Błąd zmiany nazwy");
            router.refresh();
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto pb-20">
            <Accordion type="multiple" className="w-full space-y-4" defaultValue={columns.map(c => c.id)}>
                {columns.map((column) => (
                    <AccordionItem key={column.id} value={column.id} className="border rounded-lg bg-card px-4">
                        <div className="flex items-center justify-between py-4">
                            {editingColumnId === column.id ? (
                                <div className="flex items-center gap-2 flex-1 mr-4">
                                    <Input 
                                        value={editingColumnTitle}
                                        onChange={(e) => setEditingColumnTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRenameColumn(column.id);
                                        }}
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={() => handleRenameColumn(column.id)}>Zapisz</Button>
                                </div>
                            ) : (
                                <AccordionTrigger className="hover:no-underline py-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">{column.title}</span>
                                        <span className="text-muted-foreground text-sm font-normal">
                                            ({column.tasks.filter(t => !t.completed).length})
                                        </span>
                                    </div>
                                </AccordionTrigger>
                            )}
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                        setEditingColumnId(column.id);
                                        setEditingColumnTitle(column.title);
                                    }}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Zmień nazwę
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteColumn(column.id)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Usuń listę
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <AccordionContent className="pt-0 pb-4">
                            <motion.div 
                                className="flex flex-col gap-1"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {column.tasks.map((task) => (
                                    <motion.div key={task.id} variants={itemVariant}>
                                        <SwipeableTaskItem
                                            onComplete={() => handleToggleTask(task.id, !task.completed)}
                                            onEdit={() => handleOpenTask(task)}
                                        >
                                            <div 
                                                className={cn(
                                                    "group flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors",
                                                    task.completed && "opacity-60"
                                                )}
                                            >
                                                <Checkbox 
                                                    checked={task.completed} 
                                                    onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
                                                    className="mt-1 rounded-full w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                                />
                                                <div 
                                                    className="flex-1 cursor-pointer" 
                                                    onClick={() => handleOpenTask(task)}
                                                >
                                                    <p className={cn(
                                                        "text-base leading-tight font-medium transition-all",
                                                        task.completed && "line-through text-muted-foreground"
                                                    )}>
                                                        {task.content}
                                                    </p>
                                                    {task.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5 flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </SwipeableTaskItem>
                                    </motion.div>
                                ))}
                                
                                {/* Quick Add Input */}
                                <div className="flex items-center gap-2 mt-2 px-2">
                                    <Plus className="w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Dodaj zadanie..." 
                                        className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-2 bg-transparent placeholder:text-muted-foreground"
                                        value={newTaskInput[column.id] || ""}
                                        onChange={(e) => setNewTaskInput(prev => ({ ...prev, [column.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleAddTask(column.id);
                                            }
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {/* Add Column Section */}
            <div className="mt-6">
                {isAddingColumn ? (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-card">
                        <Input 
                            placeholder="Nazwa nowej listy..." 
                            value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddColumn();
                            }}
                            autoFocus
                        />
                        <Button onClick={handleAddColumn}>Dodaj</Button>
                        <Button variant="ghost" onClick={() => setIsAddingColumn(false)}>Anuluj</Button>
                    </div>
                ) : (
                    <Button 
                        variant="outline" 
                        className="w-full py-6 border-dashed"
                        onClick={() => setIsAddingColumn(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj nową listę
                    </Button>
                )}
            </div>

            {/* Task Detail Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 gap-0">
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle>Szczegóły zadania</SheetTitle>
                    </SheetHeader>
                    
                    {selectedTask && (
                        <>
                            <ScrollArea className="flex-1">
                                <div className="flex flex-col gap-6 p-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Treść zadania</label>
                                        <Input 
                                            value={selectedTask.content} 
                                            onChange={(e) => setSelectedTask({ ...selectedTask, content: e.target.value })}
                                            className="text-lg font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Notatki</label>
                                        <Textarea 
                                            value={selectedTask.description || ""} 
                                            onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                            className="min-h-[200px] resize-y text-base leading-relaxed"
                                            placeholder="Wpisz szczegóły, listę zakupów, linki..."
                                        />
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-6 border-t bg-background">
                                <div className="flex gap-2">
                                    <Button 
                                        variant="destructive" 
                                        className="flex-1"
                                        onClick={() => handleDeleteTask(selectedTask.id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Usuń
                                    </Button>
                                    <Button 
                                        className="flex-2"
                                        onClick={() => handleSaveTaskDetails(selectedTask.id, selectedTask.content, selectedTask.description || "")}
                                    >
                                        Zapisz zmiany
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
