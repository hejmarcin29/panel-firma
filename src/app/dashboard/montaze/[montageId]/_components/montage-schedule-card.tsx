"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateMontageSchedule } from "../../actions";
import type { Montage } from "../../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MontageScheduleCard({ montage }: { montage: Montage }) {
  const [date, setDate] = useState<Date | undefined>(
    montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt as string | number | Date) : undefined
  );
  const [startTime, setStartTime] = useState<string>(
    montage.scheduledInstallationAt 
      ? format(new Date(montage.scheduledInstallationAt as string | number | Date), "HH:mm") 
      : "08:00"
  );
  const [duration, setDuration] = useState<string>("4"); // hours

  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!date) return;

    const [hours, minutes] = startTime.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes);

    const scheduledEndAt = new Date(scheduledAt);
    scheduledEndAt.setHours(scheduledAt.getHours() + parseInt(duration));

    startTransition(async () => {
      await updateMontageSchedule({
        montageId: montage.id,
        scheduledAt,
        scheduledEndAt,
      });
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Harmonogram</CardTitle>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
            <div className="flex flex-col space-y-2">
                <span className="text-sm text-muted-foreground">Data montażu</span>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                    <span className="text-sm text-muted-foreground">Godzina</span>
                    <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger>
                            <SelectValue placeholder="Wybierz godzinę" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 24 * 2 }).map((_, i) => {
                                const h = Math.floor(i / 2);
                                const m = i % 2 === 0 ? "00" : "30";
                                const time = `${h.toString().padStart(2, "0")}:${m}`;
                                return (
                                    <SelectItem key={time} value={time}>
                                        {time}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col space-y-2">
                    <span className="text-sm text-muted-foreground">Czas trwania (h)</span>
                     <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                            <SelectValue placeholder="Czas" />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 24, 48].map((h) => (
                                <SelectItem key={h} value={h.toString()}>
                                    {h} h
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button onClick={handleSave} disabled={isPending || !date} className="w-full">
                {isPending ? "Zapisywanie..." : "Zapisz termin"}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
