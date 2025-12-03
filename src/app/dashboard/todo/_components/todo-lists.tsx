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
import { 
  Plus, 
  FileText, 
  Trash2, 
  MoreVertical, 
  Pencil, 
  Paperclip, 
  Star,
  X,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetClose
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
  updateColumnTitle,
  updateTaskPriority,
  uploadTaskAttachment
} from "../actions";
import { useRouter } from "next/navigation";
import { SwipeableTaskItem } from "../../zadania/_components/swipeable-task-item";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

// Types based on schema
interface TaskAttachment {
    id: string;
    fileUrl: string;
    fileName: string;
    fileType: string | null;
}

interface Task {
    id: string;
    content: string;
    description?: string | null;
    completed: boolean;
    columnId: string;
    orderIndex: number;
    createdAt: Date;
    dueDate?: Date | null;
    reminderAt?: Date | null;
    priority: string;
    attachments?: TaskAttachment[];
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
    const [showCompletedMap, setShowCompletedMap] = useState<Record<string, boolean>>({});
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
            description: "",
            createdAt: new Date(),
            priority: 'normal'
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
                                {(() => {
                                    const activeTasks = column.tasks.filter(t => !t.completed);
                                    const completedTasks = column.tasks.filter(t => t.completed);
                                    const showCompleted = showCompletedMap[column.id] ?? false;

                                    return (
                                        <>
                                            {activeTasks.map((task) => (
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
                                                                <div className="flex flex-wrap gap-2 mt-1 items-center">
                                                                    {task.priority === 'urgent' && (
                                                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Pilne</Badge>
                                                                    )}
                                                                    {task.priority === 'important' && (
                                                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-200">Ważne</Badge>
                                                                    )}
                                                                    {task.description && (
                                                                        <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
                                                                            <FileText className="w-3 h-3" />
                                                                            {task.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </SwipeableTaskItem>
                                                </motion.div>
                                            ))}

                                            {completedTasks.length > 0 && (
                                                <div className="mt-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-muted-foreground text-xs w-full justify-start h-8"
                                                        onClick={() => setShowCompletedMap(prev => ({ ...prev, [column.id]: !prev[column.id] }))}
                                                    >
                                                        {showCompleted ? "Ukryj" : "Pokaż"} zakończone ({completedTasks.length})
                                                    </Button>
                                                    
                                                    {showCompleted && completedTasks.map((task) => (
                                                        <motion.div key={task.id} variants={itemVariant}>
                                                            <SwipeableTaskItem
                                                                onComplete={() => handleToggleTask(task.id, !task.completed)}
                                                                onEdit={() => handleOpenTask(task)}
                                                            >
                                                                <div 
                                                                    className={cn(
                                                                        "group flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors opacity-60"
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
                                                                        <p className="text-base leading-tight font-medium transition-all line-through text-muted-foreground">
                                                                            {task.content}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-2 mt-1 items-center">
                                                                            {task.priority === 'urgent' && (
                                                                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Pilne</Badge>
                                                                            )}
                                                                            {task.priority === 'important' && (
                                                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-200">Ważne</Badge>
                                                                            )}
                                                                            {task.description && (
                                                                                <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
                                                                                    <FileText className="w-3 h-3" />
                                                                                    {task.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </SwipeableTaskItem>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                
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
                <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 gap-0 bg-background border-l">
                    {selectedTask && (
                        <>
                            {/* Custom Header */}
                            <div className="px-4 py-3 border-b flex items-center justify-between bg-background/95 backdrop-blur z-10">
                                <div className="flex items-center gap-2">
                                    <SheetClose asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 -ml-2">
                                            <X className="h-6 w-6" />
                                        </Button>
                                    </SheetClose>
                                    <span className="font-semibold text-lg truncate max-w-[200px]">
                                        {columns.find(c => c.id === selectedTask.columnId)?.title || "Zadanie"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10"
                                        onClick={() => {
                                            const newPriority = selectedTask.priority === 'important' ? 'normal' : 'important';
                                            setSelectedTask({ ...selectedTask, priority: newPriority });
                                            setColumns(prev => prev.map(col => ({
                                                ...col,
                                                tasks: col.tasks.map(t => t.id === selectedTask.id ? { ...t, priority: newPriority } : t)
                                            })));
                                            updateTaskPriority(selectedTask.id, newPriority);
                                        }}
                                    >
                                        <Star className={cn("h-6 w-6 transition-colors", 
                                            selectedTask.priority === 'important' ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                                        )} />
                                    </Button>
                                </div>
                            </div>
                            
                            <ScrollArea className="flex-1">
                                <div className="flex flex-col p-6 gap-6">
                                    {/* Task Title Section */}
                                    <div className="flex items-start gap-4">
                                        <Checkbox 
                                            checked={selectedTask.completed}
                                            onCheckedChange={(checked) => {
                                                handleToggleTask(selectedTask.id, !!checked);
                                                setSelectedTask({ ...selectedTask, completed: !!checked });
                                            }}
                                            className="mt-1.5 h-6 w-6 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                        <Input 
                                            value={selectedTask.content} 
                                            onChange={(e) => setSelectedTask({ ...selectedTask, content: e.target.value })}
                                            className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent shadow-none"
                                        />
                                    </div>

                                    {/* Priority Selection - Buttons instead of Dropdown */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priorytet</span>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant={selectedTask.priority === 'normal' ? 'secondary' : 'outline'} 
                                                size="sm"
                                                onClick={() => {
                                                    const newPriority = 'normal';
                                                    setSelectedTask({ ...selectedTask, priority: newPriority });
                                                    setColumns(prev => prev.map(col => ({
                                                        ...col,
                                                        tasks: col.tasks.map(t => t.id === selectedTask.id ? { ...t, priority: newPriority } : t)
                                                    })));
                                                    updateTaskPriority(selectedTask.id, newPriority);
                                                }}
                                                className="flex-1"
                                            >
                                                Normalny
                                            </Button>
                                            <Button 
                                                variant={selectedTask.priority === 'important' ? 'secondary' : 'outline'} 
                                                size="sm"
                                                onClick={() => {
                                                    const newPriority = 'important';
                                                    setSelectedTask({ ...selectedTask, priority: newPriority });
                                                    setColumns(prev => prev.map(col => ({
                                                        ...col,
                                                        tasks: col.tasks.map(t => t.id === selectedTask.id ? { ...t, priority: newPriority } : t)
                                                    })));
                                                    updateTaskPriority(selectedTask.id, newPriority);
                                                }}
                                                className={cn("flex-1", selectedTask.priority === 'important' && "bg-amber-100 text-amber-900 hover:bg-amber-200")}
                                            >
                                                Ważne
                                            </Button>
                                            <Button 
                                                variant={selectedTask.priority === 'urgent' ? 'secondary' : 'outline'} 
                                                size="sm"
                                                onClick={() => {
                                                    const newPriority = 'urgent';
                                                    setSelectedTask({ ...selectedTask, priority: newPriority });
                                                    setColumns(prev => prev.map(col => ({
                                                        ...col,
                                                        tasks: col.tasks.map(t => t.id === selectedTask.id ? { ...t, priority: newPriority } : t)
                                                    })));
                                                    updateTaskPriority(selectedTask.id, newPriority);
                                                }}
                                                className={cn("flex-1", selectedTask.priority === 'urgent' && "bg-red-100 text-red-900 hover:bg-red-200")}
                                            >
                                                Pilne
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="h-px bg-border my-2" />
                                    
                                    {/* File Upload */}
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            id="file-upload" 
                                            className="hidden" 
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const formData = new FormData();
                                                    formData.append('taskId', selectedTask.id);
                                                    formData.append('file', file);
                                                    toast.promise(uploadTaskAttachment(formData), {
                                                        loading: 'Wysyłanie pliku...',
                                                        success: 'Plik dodany',
                                                        error: 'Błąd wysyłania pliku'
                                                    });
                                                }
                                            }}
                                        />
                                        <Button 
                                            variant="outline" 
                                            className="justify-start px-4 h-12 gap-3 font-normal w-full"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                                            Dodaj załącznik
                                        </Button>
                                    </div>

                                    {/* Attachments List */}
                                    {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                                        <div className="flex flex-col gap-2 pl-1">
                                            {selectedTask.attachments.map((att) => (
                                                <div key={att.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                    <a 
                                                        href={att.fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:underline truncate flex-1"
                                                    >
                                                        {att.fileName}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="h-px bg-border my-2" />

                                    {/* Notes Section */}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notatki</span>
                                        <Textarea 
                                            value={selectedTask.description || ""} 
                                            onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                                            className="min-h-[150px] resize-none border p-3 text-base leading-relaxed focus-visible:ring-1 bg-transparent shadow-sm placeholder:text-muted-foreground/70"
                                            placeholder="Dodaj szczegóły zadania..."
                                        />
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Utworzono {new Date(selectedTask.createdAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDeleteTask(selectedTask.id)}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                        <Button 
                                            size="sm"
                                            className="h-10 px-6"
                                            onClick={() => handleSaveTaskDetails(selectedTask.id, selectedTask.content, selectedTask.description || "")}
                                        >
                                            Zapisz
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
