"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { updateMontageClientInfo } from "../../actions";
import { toast } from "sonner";

interface MontageClientInfoProps {
    montageId: string;
    initialContent: string | null;
}

export function MontageClientInfo({ montageId, initialContent }: MontageClientInfoProps) {
    const [content, setContent] = useState(initialContent || "");
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const router = useRouter();
    
    // Ref to track if the initial render has happened to avoid saving on mount
    const isMounted = useRef(false);
    const lastSavedContent = useRef(initialContent || "");

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        if (content === lastSavedContent.current) {
            return;
        }

        setStatus('saving');
        const timer = setTimeout(async () => {
            try {
                await updateMontageClientInfo(montageId, content);
                lastSavedContent.current = content;
                setStatus('saved');
                router.refresh();
                
                // Reset saved status after 2 seconds
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                console.error("Failed to save client info", error);
                toast.error("Nie udało się zapisać informacji od klienta");
                setStatus('idle');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, montageId, router]);

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold leading-none tracking-tight">Info od klienta</h3>
                    <div className="h-4 flex items-center">
                        {status === 'saving' && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Zapisywanie...
                            </span>
                        )}
                        {status === 'saved' && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Zapisano
                            </span>
                        )}
                    </div>
                </div>
                <Textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    className="min-h-[100px] resize-y"
                    placeholder="Wpisz informacje od klienta..."
                />
            </div>
        </div>
    );
}
