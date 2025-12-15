"use client";

import { Send, Paperclip, User, Lock } from "lucide-react";
import { useTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { addMontageNote } from "../../actions";
import type { Montage } from "../../types";
import { type UserRole } from '@/lib/db/schema';
import { cn } from "@/lib/utils";

export function MontageNotesTab({ montage, userRoles = ['admin'] }: { montage: Montage; userRoles?: UserRole[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [isInternal, setIsInternal] = useState(false);

  const isAdmin = userRoles.includes('admin');
  const isInstaller = userRoles.includes('installer') && !isAdmin;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.get("content")) return;
    
    if (isInternal) {
        formData.append('isInternal', 'true');
    }

    startTransition(async () => {
      await addMontageNote(formData);
      formRef.current?.reset();
      setIsInternal(false);
      router.refresh();
    });
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
                disabled={pending}
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
            <Button type="submit" disabled={pending}>
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
