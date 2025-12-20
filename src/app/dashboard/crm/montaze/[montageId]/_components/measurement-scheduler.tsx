"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon, Phone, ChevronRight, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

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
}

export function MeasurementScheduler({ montageId, currentDate, clientPhone, onSuccess }: MeasurementSchedulerProps) {
    const [date, setDate] = useState<Date | undefined>(currentDate || undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleDateSelect = async (newDate: Date | undefined) => {
        // Don't allow deselecting via calendar click if it's already selected (unless we want to allow clearing)
        // But usually calendar click toggles. Let's assume we want to set it.
        if (!newDate) return;

        setDate(newDate);
        setIsSaving(true);
        try {
            await updateMontageMeasurementDate(montageId, newDate);
            toast.success(`Zaplanowano pomiar na ${format(newDate, "dd.MM.yyyy")}`);
            setIsOpen(false);
            // We don't auto-redirect here, user can click the button below
        } catch (error) {
            toast.error("Nie udało się zapisać daty pomiaru");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const quickDates = [
        { label: "Jutro", value: addDays(new Date(), 1) },
        { label: "Pojutrze", value: addDays(new Date(), 2) },
        { label: "Za tydzień", value: addDays(new Date(), 7) },
    ];

    return (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            Umówienie Pomiaru
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {currentDate 
                                ? `Zaplanowano na: ${format(currentDate, "EEEE, dd MMMM yyyy", { locale: pl })}`
                                : "Skontaktuj się z klientem i wybierz termin."}
                        </p>
                    </div>
                    {currentDate && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Zaplanowano
                        </div>
                    )}
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
                                variant={currentDate ? "secondary" : "default"}
                                className={cn(
                                    "h-12 justify-start text-base",
                                    !currentDate && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <CalendarIcon className="mr-2 h-5 w-5" />
                                )}
                                {currentDate ? "Zmień Termin" : "Wybierz Termin"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3 border-b bg-muted/30">
                                <div className="text-xs font-medium text-muted-foreground mb-2">Szybki wybór:</div>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {quickDates.map((qd) => (
                                        <Button
                                            key={qd.label}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs whitespace-nowrap"
                                            onClick={() => handleDateSelect(qd.value)}
                                            disabled={isSaving}
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
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || isSaving}
                                initialFocus
                                locale={pl}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            
            {currentDate && (
                <div className="bg-muted/30 p-3 border-t flex justify-end">
                    <Button variant="ghost" size="sm" onClick={onSuccess} className="text-muted-foreground hover:text-foreground">
                        Przejdź do formularza pomiaru <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
