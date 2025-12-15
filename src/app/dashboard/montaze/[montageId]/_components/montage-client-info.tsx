"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateMontageClientInfo } from "../../actions";
import { cn } from "@/lib/utils";

interface MontageClientInfoProps {
    montageId: string;
    initialContent: string | null;
}

export function MontageClientInfo({ montageId, initialContent }: MontageClientInfoProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(initialContent || "");
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        startTransition(async () => {
            await updateMontageClientInfo(montageId, content);
            setIsEditing(false);
            router.refresh();
        });
    };

    const handleCancel = () => {
        setContent(initialContent || "");
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="p-6 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold leading-none tracking-tight">Info od klienta</h3>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={pending}>
                                <X className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={pending}>
                                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <Textarea 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        className="min-h-[100px]"
                        placeholder="Wpisz informacje od klienta..."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm group relative">
            <div className="p-6 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold leading-none tracking-tight">Info od klienta</h3>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[20px]">
                    {content || "Brak informacji od klienta."}
                </div>
            </div>
        </div>
    );
}
