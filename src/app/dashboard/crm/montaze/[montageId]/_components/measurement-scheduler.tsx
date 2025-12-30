"use client";

import { useState } from "react";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon, Phone, Loader2, Check, Clock, CalendarDays, Edit2, Ruler } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateMontageMeasurementDate } from "../../actions";

interface MeasurementSchedulerProps {
    montageId: string;
    currentDate: Date | null;
    clientPhone: string | null;
    onSuccess?: () => void;
    hasGoogleCalendar?: boolean;
    onStartProtocol?: () => void;
}

export function MeasurementScheduler({ montageId, currentDate, clientPhone, onSuccess, hasGoogleCalendar = false, onStartProtocol }: MeasurementSchedulerProps) {
    const [date, setDate] = useState<Date | undefined>(currentDate || undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    
    // If we have a date initially, we start in "confirmed" mode
    const [viewMode, setViewMode] = useState<'selection' | 'confirmed'>(currentDate ? 'confirmed' : 'selection');

    const handleDateSelect = async (newDate: Date | undefined) => {
        if (!newDate) return;

        setDate(newDate);
        setIsSaving(true);
        try {
            await updateMontageMeasurementDate(montageId, newDate);
            toast.success(`Zaplanowano pomiar na ${format(newDate, "dd.MM.yyyy")}`);
            setIsOpen(false);
            setViewMode('confirmed');
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error("Nie udało się zapisać daty pomiaru");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReschedule = () => {
        setViewMode('selection');
    };

    const generateGoogleCalendarLink = (date: Date) => {
        const start = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        // Assuming 1 hour duration
        const end = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
        
        const title = encodeURIComponent("Pomiar - Prime Podłogi");
        const details = encodeURIComponent(`Pomiar u klienta. Tel: ${clientPhone || 'Brak'}`);
        
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
    };

    return (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden relative min-h-[200px]">
            <AnimatePresence mode="wait">
                {viewMode === 'selection' ? (
                    <SelectionView 
                        key="selection"
                        date={date}
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                        handleDateSelect={handleDateSelect}
                        isSaving={isSaving}
                        clientPhone={clientPhone}
                    />
                ) : (
                    <ConfirmationView 
                        key="confirmed"
                        date={date!}
                        onReschedule={handleReschedule}
                        googleCalendarLink={date ? generateGoogleCalendarLink(date) : '#'}
                        hasGoogleCalendar={hasGoogleCalendar}
                        onStartProtocol={onStartProtocol}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface SelectionViewProps {
    date: Date | undefined;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    handleDateSelect: (date: Date | undefined) => void;
    isSaving: boolean;
    clientPhone: string | null;
}

function SelectionView({ date, isOpen, setIsOpen, handleDateSelect, isSaving, clientPhone }: SelectionViewProps) {
    const quickDates = [
        { label: "Jutro", value: addDays(new Date(), 1) },
        { label: "Pojutrze", value: addDays(new Date(), 2) },
        { label: "Za tydzień", value: addDays(new Date(), 7) },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 sm:p-6 space-y-6"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Umówienie Pomiaru
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Skontaktuj się z klientem i wybierz termin.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                    variant="outline" 
                    className="h-12 justify-start text-base" 
                    asChild
                >
                    <a href={`tel:${clientPhone}`}>
                        <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
                        Zadzwoń do Klienta
                    </a>
                </Button>

                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button 
                            variant={date ? "secondary" : "default"}
                            className={cn(
                                "h-12 justify-start text-base",
                                !date && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <CalendarIcon className="mr-2 h-5 w-5" />
                            )}
                            {date ? format(date, "dd.MM.yyyy", { locale: pl }) : "Wybierz datę"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b bg-muted/30">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Szybki wybór:</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {quickDates.map((qd) => (
                                    <Button
                                        key={qd.label}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7 whitespace-nowrap"
                                        onClick={() => handleDateSelect(qd.value)}
                                    >
                                        {qd.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                            locale={pl}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </motion.div>
    );
}

function ConfirmationView({ date, onReschedule, googleCalendarLink, hasGoogleCalendar, onStartProtocol }: { date: Date, onReschedule: () => void, googleCalendarLink: string, hasGoogleCalendar: boolean, onStartProtocol?: () => void }) {
    const daysLeft = differenceInCalendarDays(date, new Date());
    const isToday = daysLeft === 0;
    const isPast = daysLeft < 0;

    let daysText = "";
    if (isToday) daysText = "To już dzisiaj!";
    else if (isPast) daysText = "Termin minął";
    else if (daysLeft === 1) daysText = "Już jutro";
    else daysText = `Za ${daysLeft} dni`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden"
        >
            {/* Green accent bar on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />

            <div className="p-6 grid gap-6 md:grid-cols-[1fr_1.5fr]">
                {/* Left Column: Date Display */}
                <div className="flex flex-col items-center justify-center text-center p-4 bg-green-50/50 rounded-xl border border-green-100">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                        <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-800 uppercase tracking-wide mb-1">
                        Termin Potwierdzony
                    </span>
                    <h2 className="text-4xl font-bold text-slate-900 mb-1">
                        {format(date, "d MMM", { locale: pl })}
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        {format(date, "EEEE", { locale: pl })}
                    </p>
                    
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-sm font-medium text-slate-600 shadow-sm border">
                        <Clock className="w-3.5 h-3.5" />
                        {daysText}
                    </div>
                </div>

                {/* Right Column: Next Steps & Actions */}
                <div className="flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            ✅ Termin zapisany! Co dalej?
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm text-muted-foreground">
                                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                                <span>
                                    W dniu pomiaru ({format(date, "dd.MM")}) w tym miejscu pojawi się przycisk <span className="font-medium text-foreground">&quot;Rozpocznij Protokół&quot;</span>.
                                </span>
                            </li>
                            <li className="flex gap-3 text-sm text-muted-foreground">
                                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                                <span>
                                    Klient otrzymał automatyczne powiadomienie SMS oraz E-mail z potwierdzeniem terminu.
                                </span>
                            </li>
                            {hasGoogleCalendar && (
                                <li className="flex gap-3 text-sm text-muted-foreground">
                                    <div className="shrink-0 w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold">
                                        <CalendarDays className="w-3 h-3" />
                                    </div>
                                    <span>
                                        Wydarzenie zostało automatycznie dodane do Twojego kalendarza Google.
                                    </span>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2 border-t">
                        {(isToday || isPast) && onStartProtocol ? (
                            <Button onClick={onStartProtocol} className="bg-green-600 hover:bg-green-700 text-white">
                                <Ruler className="w-4 h-4 mr-2" />
                                Rozpocznij Protokół
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={onReschedule} className="text-muted-foreground">
                                <Edit2 className="w-3.5 h-3.5 mr-2" />
                                Zmień termin
                            </Button>
                        )}
                        
                        {!hasGoogleCalendar && (
                            <Button variant="outline" size="sm" asChild className="text-blue-600 border-blue-100 hover:bg-blue-50">
                                <a href={googleCalendarLink} target="_blank" rel="noopener noreferrer">
                                    <CalendarDays className="w-3.5 h-3.5 mr-2" />
                                    Dodaj do kalendarza
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
