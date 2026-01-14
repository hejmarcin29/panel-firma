'use client';

import { 
    CreditCard, 
    RefreshCcw, 
    Mail, 
    Settings, 
    User, 
    Clock, 
    CheckCircle2 
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
}

interface TimelineViewProps {
    events: TimelineEvent[];
    isAdmin?: boolean;
}


export function TimelineView({ events, isAdmin = false }: TimelineViewProps) {
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-20" />
                <p>Jeszcze brak zdarzeń na osi czasu.</p>
                <p className="text-sm">Zamówienie zostało przyjęte i oczekuje na przetworzenie.</p>
            </div>
        );
    }

    return (
        <div className="relative border-l border-gray-200 dark:border-gray-800 ml-3 space-y-8 pb-4">
            {events.map((event) => {
                const Icon = getIconForType(event.type);
                // const isLast = index === events.length - 1;
                
                return (
                    <div key={event.id} className="relative pl-8">
                        {/* Dot / Icon */}
                        <div className="absolute -left-3.5 mt-1.5 flex h-7 w-7 items-center justify-center rounded-full border bg-white dark:bg-gray-950 shadow-sm">
                            <Icon className="h-4 w-4 text-primary" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {format(new Date(event.createdAt), "d MMM, HH:mm", { locale: pl })}
                                </span>
                                {isAdmin && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">
                                        {event.type}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-none">
                                {event.title}
                            </h3>
                            {event.metadata && (renderMetadata(event.metadata))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function getIconForType(type: string) {
    switch (type) {
        case 'payment': return CreditCard;
        case 'status_change': return RefreshCcw;
        case 'email': return Mail;
        case 'customer_action': return User;
        case 'system': return Settings;
        default: return CheckCircle2;
    }
}

function renderMetadata(metadata: Record<string, unknown> | null) {
    // Simple rendering of crucial metadata if needed
    // e.g. amount for payments, previous status for changes
    if (!metadata || typeof metadata !== 'object') return null;

    return (
        <div className="mt-1 text-sm text-gray-500">
            {!!metadata.description && <p>{metadata.description as string}</p>}
            {!!metadata.amount && <p>Kwota: {metadata.amount as string | number} PLN</p>}
            {!!metadata.oldStatus && !!metadata.newStatus && (
                <p className="text-xs">Zmiana statusu z <span className="font-mono">{metadata.oldStatus as string}</span> na <span className="font-mono">{metadata.newStatus as string}</span></p>
            )}
            {/* If there are other interesting fields, we can add them here */}
        </div>
    );
}
