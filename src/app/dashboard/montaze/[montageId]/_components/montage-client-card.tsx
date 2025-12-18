"use client";

import { MapPin, Phone, Mail, Calendar as CalendarIcon, Edit2, Ruler, Loader2, Check, Hammer, User, Megaphone, ExternalLink, Copy, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { formatScheduleRange } from "../../utils";
import { customerSources } from "@/lib/db/schema";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type UserRole } from '@/lib/db/schema';

export function MontageClientCard({ 
    montage, 
    userRoles = ['admin'],
    installers = [],
    measurers = [],
    architects = [],
}: { 
    montage: Montage; 
    userRoles?: UserRole[];
    installers?: { id: string; name: string | null; email: string }[];
    measurers?: { id: string; name: string | null; email: string }[];
    architects?: { id: string; name: string | null; email: string }[];
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
    scheduledSkirtingInstallationAt: montage.scheduledSkirtingInstallationAt 
      ? new Date(montage.scheduledSkirtingInstallationAt as string | number | Date).toISOString().split("T")[0] 
      : "",
    scheduledSkirtingInstallationEndAt: montage.scheduledSkirtingInstallationEndAt 
      ? new Date(montage.scheduledSkirtingInstallationEndAt as string | number | Date).toISOString().split("T")[0] 
      : "",
    source: montage.customer?.source || "other",
    forecastedInstallationDate: montage.forecastedInstallationDate
      ? new Date(montage.forecastedInstallationDate as string | number | Date).toISOString().split("T")[0]
      : "",
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
    to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
  });

  const [skirtingDateRange, setSkirtingDateRange] = useState<DateRange | undefined>({
    from: montage.scheduledSkirtingInstallationAt ? new Date(montage.scheduledSkirtingInstallationAt) : undefined,
    to: montage.scheduledSkirtingInstallationEndAt ? new Date(montage.scheduledSkirtingInstallationEndAt) : undefined,
  });

  const [isSkirtingSeparate, setIsSkirtingSeparate] = useState(!!montage.scheduledSkirtingInstallationAt);

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
        scheduledSkirtingInstallationAt: montage.scheduledSkirtingInstallationAt 
          ? new Date(montage.scheduledSkirtingInstallationAt as string | number | Date).toISOString().split("T")[0] 
          : "",
        scheduledSkirtingInstallationEndAt: montage.scheduledSkirtingInstallationEndAt 
          ? new Date(montage.scheduledSkirtingInstallationEndAt as string | number | Date).toISOString().split("T")[0] 
          : "",
        source: montage.customer?.source || "other",
        forecastedInstallationDate: montage.forecastedInstallationDate
          ? new Date(montage.forecastedInstallationDate as string | number | Date).toISOString().split("T")[0]
          : "",
    });
    setDateRange({
        from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
        to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
    });
    setSkirtingDateRange({
        from: montage.scheduledSkirtingInstallationAt ? new Date(montage.scheduledSkirtingInstallationAt) : undefined,
        to: montage.scheduledSkirtingInstallationEndAt ? new Date(montage.scheduledSkirtingInstallationEndAt) : undefined,
    });
    setIsSkirtingSeparate(!!montage.scheduledSkirtingInstallationAt);
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
        source: data.source,
        forecastedInstallationDate: data.forecastedInstallationDate,
        scheduledInstallationDate: data.scheduledInstallationAt,
        scheduledInstallationEndDate: data.scheduledInstallationEndAt,
        scheduledSkirtingInstallationDate: data.scheduledSkirtingInstallationAt,
        scheduledSkirtingInstallationEndDate: data.scheduledSkirtingInstallationEndAt,
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

  const handleSkirtingDateRangeChange = (range: DateRange | undefined) => {
    setSkirtingDateRange(range);
    
    const newFrom = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const newTo = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    
    const newData = { 
        ...formData, 
        scheduledSkirtingInstallationAt: newFrom,
        scheduledSkirtingInstallationEndAt: newTo 
    };
    setFormData(newData);
    debouncedSave(newData);
  };

  const toggleSkirtingSeparate = (checked: boolean) => {
      setIsSkirtingSeparate(checked);
      if (!checked) {
          // Clear skirting dates if disabled
          setSkirtingDateRange(undefined);
          const newData = { 
            ...formData, 
            scheduledSkirtingInstallationAt: "",
            scheduledSkirtingInstallationEndAt: "" 
        };
        setFormData(newData);
        debouncedSave(newData);
      }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    (montage.installationAddress || "") + " " + (montage.installationCity || "")
  )}`;

  const formattedDate = formatScheduleRange(montage.scheduledInstallationAt, montage.scheduledInstallationEndAt);
  const formattedSkirtingDate = formatScheduleRange(montage.scheduledSkirtingInstallationAt, montage.scheduledSkirtingInstallationEndAt);
  
  const forecastedDate = montage.forecastedInstallationDate 
    ? new Date(montage.forecastedInstallationDate as string | number | Date).toLocaleDateString('pl-PL')
    : null;

  const handleInstallerStatusChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          installerStatus: value as 'none' | 'informed' | 'confirmed'
      });
      router.refresh();
  };

  const handleInstallerChange = async (value: string) => {
      const newInstallerId = value === 'none' ? null : value;
      // Logic: If installer assigned -> default to 'informed' (yellow/orange). If removed -> 'none' (red).
      const newStatus = newInstallerId ? 'informed' : 'none';

      await updateMontageRealizationStatus({
          montageId: montage.id,
          installerId: newInstallerId,
          installerStatus: newStatus
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

  const handleArchitectChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          architectId: value === 'none' ? null : value
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
                <Label htmlFor="source">Źródło leada</Label>
                <Select 
                    value={formData.source} 
                    onValueChange={(value) => handleChange("source", value)}
                >
                    <SelectTrigger id="source">
                        <SelectValue placeholder="Wybierz źródło" />
                    </SelectTrigger>
                    <SelectContent>
                        {customerSources.map((source) => (
                            <SelectItem key={source} value={source}>
                                {source === 'internet' ? 'Internet' :
                                 source === 'social_media' ? 'Social Media' :
                                 source === 'recommendation' ? 'Polecenie' :
                                 source === 'architect' ? 'Architekt' :
                                 source === 'event' ? 'Wydarzenie' :
                                 source === 'drive_by' ? 'Ruch uliczny' :
                                 'Inne'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="forecastedInstallationDate">Szacowany termin montażu</Label>
                <Input
                  id="forecastedInstallationDate"
                  type="date"
                  value={formData.forecastedInstallationDate}
                  onChange={(e) => handleChange("forecastedInstallationDate", e.target.value)}
                />
              </div>
              <Separator />
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

               <Separator />
               <div className="flex items-center justify-between">
                   <Label htmlFor="separateSkirting">Montaż listew w osobnym terminie</Label>
                   <Switch 
                        id="separateSkirting" 
                        checked={isSkirtingSeparate}
                        onCheckedChange={toggleSkirtingSeparate}
                   />
               </div>

               {isSkirtingSeparate && (
                   <div className="space-y-2">
                    <Label>Data montażu listew (zakres)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !skirtingDateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {skirtingDateRange?.from ? (
                            skirtingDateRange.to ? (
                                <>
                                {format(skirtingDateRange.from, "dd.MM.yyyy", { locale: pl })} -{" "}
                                {format(skirtingDateRange.to, "dd.MM.yyyy", { locale: pl })}
                                </>
                            ) : (
                                format(skirtingDateRange.from, "dd.MM.yyyy", { locale: pl })
                            )
                            ) : (
                            <span>Wybierz datę</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={skirtingDateRange}
                            onSelect={handleSkirtingDateRangeChange}
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
               )}
               
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

        {montage.customer?.referralToken && (
            <div className="pt-1">
                <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-amber-900 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-amber-500" /> Portal Klienta
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <Input 
                            readOnly 
                            value={`https://b2b.primepodloga.pl/s/${montage.customer.referralToken}`}
                            className="h-7 bg-white border-amber-200 font-mono text-[10px] text-amber-900 focus-visible:ring-amber-500 px-2"
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7 shrink-0 border-amber-200 hover:bg-amber-100 hover:text-amber-900"
                            onClick={() => {
                                navigator.clipboard.writeText(`https://b2b.primepodloga.pl/s/${montage.customer!.referralToken}`);
                                toast.success('Link skopiowany');
                            }}
                            title="Kopiuj link"
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 shrink-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
                            asChild
                            title="Otwórz portal"
                        >
                            <a href={`/s/${montage.customer.referralToken}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {montage.customer?.source && (
            <div className="flex items-center gap-3">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                    {montage.customer.source === 'internet' ? 'Internet' :
                     montage.customer.source === 'social_media' ? 'Social Media' :
                     montage.customer.source === 'recommendation' ? 'Polecenie' :
                     montage.customer.source === 'architect' ? 'Architekt' :
                     montage.customer.source === 'event' ? 'Wydarzenie' :
                     montage.customer.source === 'drive_by' ? 'Ruch uliczny' :
                     montage.customer.source === 'other' ? 'Inne' :
                     montage.customer.source}
                </span>
            </div>
        )}

        <div className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div className="grid gap-0.5">
                <span className="text-sm">
                    {formattedDate || (forecastedDate ? `Szac: ${forecastedDate}` : "Nie zaplanowano")}
                </span>
                {formattedSkirtingDate && (
                    <span className="text-xs text-amber-600 font-medium">
                        Listwy: {formattedSkirtingDate}
                    </span>
                )}
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
                    <span className="text-xs text-muted-foreground">Montażysta potwierdził</span>
                    <Select
                        value={montage.installerStatus}
                        onValueChange={handleInstallerStatusChange}
                        disabled={!userRoles.includes('admin')}
                    >
                        <SelectTrigger className={cn("h-6 w-[130px] text-[10px] font-medium border", getInstallerStatusColor(montage.installerStatus))}>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nie</SelectItem>
                            <SelectItem value="confirmed">Tak</SelectItem>
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

        {(!userRoles.includes('installer') || userRoles.includes('admin')) && (
        <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="grid gap-1 w-full">
                <span className="text-xs text-muted-foreground">Architekt</span>
                {userRoles.includes('admin') ? (
                    <Select
                        value={montage.architectId || "none"}
                        onValueChange={handleArchitectChange}
                    >
                        <SelectTrigger className={cn("h-8 w-full text-sm", !montage.architectId ? "text-red-600 border-red-200 bg-red-50" : "text-purple-600 border-purple-200 bg-purple-50")}>
                            <SelectValue placeholder="Wybierz architekta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Brak przypisania</SelectItem>
                            {architects.map((architect) => (
                                <SelectItem key={architect.id} value={architect.id}>
                                    {architect.name || architect.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <span className={cn("text-sm font-medium", !montage.architectId ? "text-red-600" : "text-purple-600")}>
                        {montage.architect?.name || "Brak architekta"}
                    </span>
                )}
            </div>
        </div>
        )}

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
