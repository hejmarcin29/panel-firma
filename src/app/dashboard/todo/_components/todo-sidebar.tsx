"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, List, Star, Home, AlertCircle, Briefcase, ShoppingCart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { createColumn } from "../actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface Task {
  completed: boolean;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface TodoSidebarProps {
  columns: Column[];
  className?: string;
}

export function TodoSidebar({ columns, className }: TodoSidebarProps) {
  const pathname = usePathname();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createColumn(newListName);
      setNewListName("");
      setIsCreateDialogOpen(false);
      toast.success("Lista utworzona");
    } catch {
      toast.error("Błąd tworzenia listy");
    }
  };

  // Helper to get icon based on title (simple heuristic)
  const getIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("pilne")) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (lower.includes("ważne")) return <Star className="h-4 w-4 text-yellow-500" />;
    if (lower.includes("dom")) return <Home className="h-4 w-4 text-blue-500" />;
    if (lower.includes("zakupy")) return <ShoppingCart className="h-4 w-4 text-emerald-500" />;
    if (lower.includes("praca") || lower.includes("firma")) return <Briefcase className="h-4 w-4 text-purple-500" />;
    return <List className="h-4 w-4" />;
  };

  return (
    <div className={cn("flex flex-col h-full border-r bg-card", className)}>
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg tracking-tight">Twoje Listy</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {columns.map((column) => {
            const isActive = pathname === `/dashboard/todo/${column.id}`;
            const taskCount = column.tasks?.filter((t) => !t.completed).length || 0;
            
            return (
              <Link
                key={column.id}
                href={`/dashboard/todo/${column.id}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  {getIcon(column.title)}
                  <span className="truncate">{column.title}</span>
                </div>
                {taskCount > 0 && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isActive ? "bg-primary/20" : "bg-muted"
                  )}>
                    {taskCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t pb-24 md:pb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" />
              Nowa lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Utwórz nową listę</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Nazwa listy..." 
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateList}>Utwórz</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
