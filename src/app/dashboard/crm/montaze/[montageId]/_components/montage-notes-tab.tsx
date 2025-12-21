"use client";

import { Send, Paperclip, User, Lock } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { addMontageNote } from "../../actions";
import { type MontageDetailsData } from "../actions";
import type { Montage } from "../../types";
import { type UserRole } from '@/lib/db/schema';
import { cn } from "@/lib/utils";

export function MontageNotesTab({ montage, userRoles = [] }: { montage: Montage; userRoles?: UserRole[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [isInternal, setIsInternal] = useState(false);

  const isAdmin = userRoles.includes('admin');
  const isInstaller = userRoles.includes('installer') && !isAdmin;

  const { mutate, isPending } = useMutation({
    mutationKey: ['addMontageNote', montage.id],
    mutationFn: async (formData: FormData) => {
        return await addMontageNote(formData);
    },
    onMutate: async (formData) => {
        await queryClient.cancelQueries({ queryKey: ['montage', montage.id] });
        const previousData = queryClient.getQueryData(['montage', montage.id]);

        const content = formData.get('content') as string;
        const isInternalNote = formData.get('isInternal') === 'true';

        queryClient.setQueryData(['montage', montage.id], (old: MontageDetailsData | undefined) => {
            if (!old) return old;
            
            const newNote = {
                id: 'temp-' + Date.now(),
                content: content,
                createdAt: new Date().toISOString(), // Use ISO string for consistency
                author: { name: 'Ty' },
                isInternal: isInternalNote,
                attachments: []
            };

            return {
                ...old,
                montage: {
                    ...old.montage,
                    notes: [newNote, ...old.montage.notes]
                }
            };
        });

        return { previousData };
    },
    onError: (err, newTodo, context) => {
        queryClient.setQueryData(['montage', montage.id], context?.previousData);
        toast.error("Nie udało się dodać notatki");
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['montage', montage.id] });
        router.refresh(); // Keep server components in sync if any
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.get("content")) return;
    
    if (isInternal) {
        formData.append('isInternal', 'true');
    }

    mutate(formData);
    formRef.current?.reset();
    setIsInternal(false);
  };

  const notes = [...montage.notes]
    .filter(note => {
        if (isInstaller) {
            return !note.isInternal;
        }
        return true;
    })
    .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
    });

  return (
    <div className="flex flex-col h-[600px] py-4">
      <div className="flex-1 overflow-y-auto space-y-4 pr-4 mb-4">
        {notes.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
                Brak notatek. Rozpocznij dyskusję poniżej.
            </div>
        )}
        {notes.map((note) => (
            <div key={note.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                <AvatarFallback>
                    {note.author?.name?.slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{note.author?.name || "Użytkownik"}</span>
                    <span className="text-xs text-muted-foreground">
                    {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                    </span>
                    {note.isInternal && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-200">
                            <Lock className="h-3 w-3" />
                            Ukryta
                        </span>
                    )}
                </div>
                <div className={cn(
                    "rounded-lg p-3 text-sm whitespace-pre-wrap",
                    note.isInternal ? "bg-amber-50 border border-amber-100" : "bg-muted"
                )}>
                    {note.content}
                </div>
                {note.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                        {note.attachments.map(att => (
                            <a 
                                key={att.id} 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                                <Paperclip className="h-3 w-3" />
                                {att.title || "Załącznik"}
                            </a>
                        ))}
                    </div>
                )}
                </div>
            </div>
        ))}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2 border-t pt-4">
        <input type="hidden" name="montageId" value={montage.id} />
        
        <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
                <Textarea
                name="content"
                placeholder="Napisz notatkę..."
                className="min-h-20 resize-none pr-12"
                disabled={isPending}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        formRef.current?.requestSubmit();
                    }
                }}
                />
                <div className="absolute bottom-2 right-2">
                    <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => document.getElementById('note-attachment')?.click()}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <input 
                        type="file" 
                        id="note-attachment" 
                        name="attachment" 
                        className="hidden" 
                    />
                </div>
            </div>
            <Button type="submit" disabled={isPending}>
            <Send className="h-4 w-4" />
            </Button>
        </div>
        
        {isAdmin && (
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="internal-note" 
                    checked={isInternal} 
                    onCheckedChange={(checked) => setIsInternal(checked as boolean)} 
                />
                <Label htmlFor="internal-note" className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer">
                    <Lock className="h-3 w-3" />
                    Notatka ukryta (tylko dla biura)
                </Label>
            </div>
        )}
      </form>
    </div>
  );
}
