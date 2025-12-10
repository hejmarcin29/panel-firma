"use client";

import { MapPin, Phone, Mail, Calendar as CalendarIcon, Edit2, Ruler, Loader2, Check, Hammer, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateMontageContactDetails, updateMontageRealizationStatus } from "../../actions";
import type { Montage } from "../../types";
import { type UserRole } from '@/lib/db/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatScheduleRange } from "../../utils";

export function MontageClientCard({ 
    montage, 
    userRoles = ['admin'],
    installers = [],
    measurers = []
}: { 
    montage: Montage; 
    userRoles?: UserRole[];
    installers?: { id: string; name: string | null; email: string }[];
    measurers?: { id: string; name: string | null; email: string }[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Local state for form fields
  const [formData, setFormData] = useState({
    contactPhone: montage.contactPhone || "",
    contactEmail: montage.contactEmail || "",
    installationAddress: montage.installationAddress || "",
    installationCity: montage.installationCity || "",
    scheduledInstallationAt: montage.scheduledInstallationAt 
      ? new Date(montage.scheduledInstallationAt as string | number | Date).toISOString().split("T")[0] 
      : "",
    scheduledInstallationEndAt: montage.scheduledInstallationEndAt 
      ? new Date(montage.scheduledInstallationEndAt as string | number | Date).toISOString().split("T")[0] 
      : "",
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
    to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
  });

  // Update local state when prop changes (e.g. after refresh)
  useEffect(() => {
    setFormData({
        contactPhone: montage.contactPhone || "",
        contactEmail: montage.contactEmail || "",
        installationAddress: montage.installationAddress || "",
        installationCity: montage.installationCity || "",
        scheduledInstallationAt: montage.scheduledInstallationAt 
          ? new Date(montage.scheduledInstallationAt as string | number | Date).toISOString().split("T")[0] 
          : "",
        scheduledInstallationEndAt: montage.scheduledInstallationEndAt 
          ? new Date(montage.scheduledInstallationEndAt as string | number | Date).toISOString().split("T")[0] 
          : "",
    });
    setDateRange({
        from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
        to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
    });
  }, [montage]);

  const debouncedSave = useDebouncedCallback(async (data: typeof formData) => {
    setIsSaving(true);
    try {
      await updateMontageContactDetails({
        montageId: montage.id,
        clientName: montage.clientName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        billingAddress: montage.billingAddress || "", // Preserve existing if not edited here
        installationAddress: data.installationAddress,
        billingCity: montage.billingCity || "", // Preserve existing
        installationCity: data.installationCity,
        scheduledInstallationDate: data.scheduledInstallationAt,
        scheduledInstallationEndDate: data.scheduledInstallationEndAt,
      });
      router.refresh();
    } catch {
      toast.error("Błąd zapisu danych");
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleChange = (field: keyof typeof formData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    debouncedSave(newData);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    
    const newFrom = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const newTo = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    
    const newData = { 
        ...formData, 
        scheduledInstallationAt: newFrom,
        scheduledInstallationEndAt: newTo 
    };
    setFormData(newData);
    debouncedSave(newData);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    (montage.installationAddress || "") + " " + (montage.installationCity || "")
  )}`;

  const formattedDate = formatScheduleRange(montage.scheduledInstallationAt, montage.scheduledInstallationEndAt);
  const forecastedDate = montage.forecastedInstallationDate 
    ? new Date(montage.forecastedInstallationDate as string | number | Date).toLocaleDateString('pl-PL')
    : null;

  const handleInstallerStatusChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          installerStatus: value as any
      });
      router.refresh();
  };

  const handleInstallerChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          installerId: value === 'none' ? null : value
      });
      router.refresh();
  };

  const handleMeasurerChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          measurerId: value === 'none' ? null : value
      });
      router.refresh();
  };

  const getInstallerStatusColor = (status: string) => {
      switch (status) {
          case 'none': return 'text-red-600 bg-red-50 border-red-200';
          case 'informed': return 'text-orange-600 bg-orange-50 border-orange-200';
          case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
          default: return 'text-muted-foreground';
      }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Dane Klienta</CardTitle>
        {userRoles.includes('admin') && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edytuj dane klienta</DialogTitle>
              <DialogDescription>
                Zmiany są zapisywane automatycznie.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="installationAddress">Adres montażu</Label>
                <Input
                  id="installationAddress"
                  value={formData.installationAddress}
                  onChange={(e) => handleChange("installationAddress", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installationCity">Miasto montażu</Label>
                <Input
                  id="installationCity"
                  value={formData.installationCity}
                  onChange={(e) => handleChange("installationCity", e.target.value)}
                />
              </div>
               <div className="space-y-2">
                <Label>Data montażu (zakres)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "dd.MM.yyyy", { locale: pl })} -{" "}
                            {format(dateRange.to, "dd.MM.yyyy", { locale: pl })}
                            </>
                        ) : (
                            format(dateRange.from, "dd.MM.yyyy", { locale: pl })
                        )
                        ) : (
                        <span>Wybierz datę</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={2}
                        locale={pl}
                        classNames={{
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                        }}
                    />
                    </PopoverContent>
                </Popover>
               </div>
               
               <div className="flex items-center justify-end gap-2 pt-2">
                  {isSaving ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Zapisywanie...
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Zapisano
                    </span>
                  )}
               </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="grid gap-0.5">
            <p className="text-sm font-medium leading-none">
              {montage.installationAddress || "Brak adresu"}
            </p>
            <p className="text-xs text-muted-foreground">
              {montage.installationCity}
            </p>
            {montage.installationAddress && (
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 block"
                >
                    Pokaż na mapie
                </a>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div className="grid gap-0.5">
             {montage.contactPhone ? (
                <a href={`tel:${montage.contactPhone}`} className="text-sm hover:underline">
                    {montage.contactPhone}
                </a>
             ) : (
                <span className="text-sm text-muted-foreground">Brak telefonu</span>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div className="grid gap-0.5">
             {montage.contactEmail ? (
                <a href={`mailto:${montage.contactEmail}`} className="text-sm hover:underline">
                    {montage.contactEmail}
                </a>
             ) : (
                <span className="text-sm text-muted-foreground">Brak emaila</span>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div className="grid gap-0.5">
                <span className="text-sm">
                    {formattedDate || (forecastedDate ? `Szac: ${forecastedDate}` : "Nie zaplanowano")}
                </span>
                {formattedDate && forecastedDate && (
                    <span className="text-xs text-muted-foreground">
                        (Szacowany: {forecastedDate})
                    </span>
                )}
            </div>
        </div>

        <div className="flex items-center gap-3">
            <Hammer className="h-4 w-4 text-muted-foreground" />
            <div className="grid gap-1 w-full">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Montażysta</span>
                    <Select
                        value={montage.installerStatus}
                        onValueChange={handleInstallerStatusChange}
                        disabled={!userRoles.includes('admin')}
                    >
                        <SelectTrigger className={cn("h-6 w-[130px] text-[10px] font-medium border", getInstallerStatusColor(montage.installerStatus))}>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak</SelectItem>
                            <SelectItem value="informed">Poinformowany</SelectItem>
                            <SelectItem value="confirmed">Potwierdzony</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {userRoles.includes('admin') ? (
                    <Select
                        value={montage.installerId || "none"}
                        onValueChange={handleInstallerChange}
                    >
                        <SelectTrigger className={cn("h-8 w-full text-sm", !montage.installerId ? "text-red-600 border-red-200 bg-red-50" : "text-green-600 border-green-200 bg-green-50")}>
                            <SelectValue placeholder="Wybierz montażystę" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak przypisania</SelectItem>
                            {installers.map((installer) => (
                                <SelectItem key={installer.id} value={installer.id}>
                                    {installer.name || installer.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <span className={cn("text-sm font-medium", !montage.installerId ? "text-red-600" : "text-green-600")}>
                        {montage.installer?.name || "Brak montażysty"}
                    </span>
                )}
            </div>
        </div>

        <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="grid gap-1 w-full">
                <span className="text-xs text-muted-foreground">Pomiarowiec</span>
                {userRoles.includes('admin') ? (
                    <Select
                        value={montage.measurerId || "none"}
                        onValueChange={handleMeasurerChange}
                    >
                        <SelectTrigger className={cn("h-8 w-full text-sm", !montage.measurerId ? "text-red-600 border-red-200 bg-red-50" : "text-green-600 border-green-200 bg-green-50")}>
                            <SelectValue placeholder="Wybierz pomiarowca" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak przypisania</SelectItem>
                            {measurers.map((measurer) => (
                                <SelectItem key={measurer.id} value={measurer.id}>
                                    {measurer.name || measurer.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <span className={cn("text-sm font-medium", !montage.measurerId ? "text-red-600" : "text-green-600")}>
                        {montage.measurer?.name || "Brak pomiarowca"}
                    </span>
                )}
            </div>
        </div>

        {montage.floorArea && (
            <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div className="grid gap-0.5">
                    <span className="text-sm">
                        {montage.floorArea} m²
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Powierzchnia podłogi
                    </span>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
