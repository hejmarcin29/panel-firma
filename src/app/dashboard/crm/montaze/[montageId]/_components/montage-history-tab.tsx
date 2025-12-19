"use client";

import { 
    User, 
    Bot, 
    Mail, 
    MessageSquare, 
    FileText, 
    CheckCircle2, 
    Info,
    Pencil,
    Trash2,
    PlusCircle,
    LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Montage } from "../../types";

type SystemLog = {
    id: string;
    action: string;
    details: string | null;
    createdAt: number | Date;
    userId: string | null;
};

const ACTION_ICONS: Record<string, LucideIcon> = {
    'create_montage': PlusCircle,
    'create_lead': PlusCircle,
    'update_montage_status': CheckCircle2,
    'checklist_completed': CheckCircle2,
    'checklist_uncompleted': CheckCircle2,
    'sms_sent': MessageSquare,
    'email_sent': Mail,
    'update_montage_details': Pencil,
    'update_measurement': FileText,
    'update_materials': FileText,
    'add_note': FileText,
    'delete_montage': Trash2,
    'default': Info
};

const ACTION_COLORS: Record<string, string> = {
    'create_montage': 'bg-green-100 text-green-600',
    'create_lead': 'bg-green-100 text-green-600',
    'update_montage_status': 'bg-blue-100 text-blue-600',
    'checklist_completed': 'bg-emerald-100 text-emerald-600',
    'checklist_uncompleted': 'bg-orange-100 text-orange-600',
    'sms_sent': 'bg-purple-100 text-purple-600',
    'email_sent': 'bg-indigo-100 text-indigo-600',
    'update_montage_details': 'bg-amber-100 text-amber-600',
    'delete_montage': 'bg-red-100 text-red-600',
    'default': 'bg-gray-100 text-gray-600'
};

export function MontageHistoryTab({ montage, logs = [] }: { montage: Montage; logs?: SystemLog[] }) {
  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
      const date = log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Nieznana data';
      if (!acc[date]) {
          acc[date] = [];
      }
      acc[date].push(log);
      return acc;
  }, {} as Record<string, SystemLog[]>);

  return (
    <div className="flex flex-col h-[600px] py-4">
      <div className="flex-1 overflow-y-auto pr-4">
        {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Info className="h-12 w-12 mb-4 opacity-20" />
                <p>Brak historii zdarzeń.</p>
            </div>
        )}
        
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border before:to-transparent">
            {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date} className="relative">
                    <div className="sticky top-0 z-10 mb-4 flex items-center justify-center">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm border">
                            {date}
                        </span>
                    </div>
                    
                    <div className="space-y-6">
                        {dayLogs.map((log) => {
                            const Icon = ACTION_ICONS[log.action] || ACTION_ICONS['default'];
                            const colorClass = ACTION_COLORS[log.action] || ACTION_COLORS['default'];
                            const isSystem = !log.userId; // Simple heuristic, or check if userId is 'system'

                            // Clean up details text
                            let detailsText = log.details || '';
                            detailsText = detailsText.replace(`Zaktualizowano status realizacji dla montażu ${montage.id}: `, '');
                            detailsText = detailsText.replace(` [${montage.id}]`, '');
                            detailsText = detailsText.replace(montage.id, montage.displayId ? `${montage.displayId} (${montage.clientName})` : montage.clientName);

                            return (
                                <div key={log.id} className="relative flex items-start gap-4 md:gap-8 group">
                                    {/* Icon Bubble */}
                                    <div className={cn(
                                        "absolute left-0 md:left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border shadow-sm transition-transform group-hover:scale-110 bg-background z-10",
                                        colorClass.replace('bg-', 'text-') // Use text color for icon, white bg
                                    )}>
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", colorClass)}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className="ml-12 md:ml-0 md:w-1/2 md:pr-12 md:text-right md:group-even:ml-[50%] md:group-even:pl-12 md:group-even:pr-0 md:group-even:text-left w-full">
                                        <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                                            <div className="flex flex-col gap-1">
                                                <div className={cn(
                                                    "flex items-center gap-2 text-xs text-muted-foreground mb-1",
                                                    "md:justify-end md:group-even:justify-start"
                                                )}>
                                                    <span className="font-mono">
                                                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        {isSystem ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                                        {isSystem ? "System" : "Użytkownik"}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-sm font-medium leading-none">
                                                    {detailsText}
                                                </p>
                                                
                                                {/* Optional: Action Type Badge */}
                                                <div className={cn(
                                                    "mt-2 flex",
                                                    "md:justify-end md:group-even:justify-start"
                                                )}>
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                                                        {log.action.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
