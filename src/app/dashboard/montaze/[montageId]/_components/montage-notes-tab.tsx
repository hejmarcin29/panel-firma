"use client";

import { Send, Paperclip, User } from "lucide-react";
import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addMontageNote } from "../../actions";
import type { Montage } from "../../types";

export function MontageNotesTab({ montage }: { montage: Montage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!formData.get("content")) return;

    startTransition(async () => {
      await addMontageNote(formData);
      formRef.current?.reset();
      router.refresh();
    });
  };

  const notes = [...montage.notes].sort((a, b) => {
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
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
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

      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 items-end border-t pt-4">
        <input type="hidden" name="montageId" value={montage.id} />
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
      </form>
    </div>
  );
}
