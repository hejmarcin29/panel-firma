"use client";

import { MapPin, Phone, Mail, Calendar as CalendarIcon, Edit2, Ruler, Loader2, Check, Hammer, Megaphone, ExternalLink, Copy, Sparkles, Building2, FileText } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { generateCustomerToken } from "../actions";
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
import { type UserRole, type MontageSampleStatus } from '@/lib/db/schema';

export function MontageClientCard({ 
    montage, 
    userRoles = ['admin'],
    installers = [],
    portalEnabled = false,
}: { 
    montage: Montage; 
    userRoles?: UserRole[];
    installers?: { id: string; name: string | null; email: string }[];
    measurers?: { id: string; name: string | null; email: string }[];
    architects?: { id: string; name: string | null; email: string }[];
    portalEnabled?: boolean;
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
    source: montage.customer?.source || "other",
    forecastedInstallationDate: montage.forecastedInstallationDate
      ? new Date(montage.forecastedInstallationDate as string | number | Date).toISOString().split("T")[0]
      : "",
    measurementDate: montage.measurementDate
      ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
      : "",
    sampleStatus: montage.sampleStatus || "none",
    estimatedFloorArea: montage.estimatedFloorArea?.toString() || "",
    isCompany: montage.isCompany || false,
    companyName: montage.companyName || "",
    nip: montage.nip || "",
    billingAddress: montage.billingAddress || "",
    billingCity: montage.billingCity || "",
    billingPostalCode: montage.billingPostalCode || "",
    isHousingVat: montage.isHousingVat || false,
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
        source: montage.customer?.source || "other",
        forecastedInstallationDate: montage.forecastedInstallationDate
          ? new Date(montage.forecastedInstallationDate as string | number | Date).toISOString().split("T")[0]
          : "",
        measurementDate: montage.measurementDate
          ? new Date(montage.measurementDate as string | number | Date).toISOString().slice(0, 16)
          : "",
        sampleStatus: montage.sampleStatus || "none",
        estimatedFloorArea: montage.estimatedFloorArea?.toString() || "",
        isCompany: montage.isCompany || false,
        companyName: montage.companyName || "",
        nip: montage.nip || "",
        billingAddress: montage.billingAddress || "",
        billingCity: montage.billingCity || "",
        billingPostalCode: montage.billingPostalCode || "",
        isHousingVat: montage.isHousingVat || false,
    });
    setDateRange({
        from: montage.scheduledInstallationAt ? new Date(montage.scheduledInstallationAt) : undefined,
        to: montage.scheduledInstallationEndAt ? new Date(montage.scheduledInstallationEndAt) : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montage.id]);

  const debouncedSave = useDebouncedCallback(async (data: typeof formData) => {
    setIsSaving(true);
    try {
      await updateMontageContactDetails({
        montageId: montage.id,
        clientName: montage.clientName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        billingAddress: data.billingAddress,
        installationAddress: data.installationAddress,
        billingCity: data.billingCity,
        billingPostalCode: data.billingPostalCode,
        installationCity: data.installationCity,
        source: data.source,
        forecastedInstallationDate: data.forecastedInstallationDate,
        measurementDate: data.measurementDate,
        scheduledInstallationDate: data.scheduledInstallationAt,
        scheduledInstallationEndDate: data.scheduledInstallationEndAt,
        sampleStatus: data.sampleStatus,
        estimatedFloorArea: data.estimatedFloorArea ? parseFloat(data.estimatedFloorArea) : undefined,
        isCompany: data.isCompany,
        companyName: data.companyName,
        nip: data.nip,
        isHousingVat: data.isHousingVat,
      });
      router.refresh();
    } catch {
      toast.error("Błąd zapisu danych");
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
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

  const measurementDate = montage.measurementDate
    ? new Date(montage.measurementDate as string | number | Date).toLocaleDateString('pl-PL')
    : null;

  const handleInstallerStatusChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          installerStatus: value as 'none' | 'informed' | 'confirmed'
      });
      router.refresh();
  };

  const handleSampleStatusChange = async (value: string) => {
      await updateMontageRealizationStatus({
          montageId: montage.id,
          sampleStatus: value as MontageSampleStatus
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
          measurerId: newInstallerId, // Sync measurer with installer
          installerStatus: newStatus
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
        {(userRoles.includes('admin') || userRoles.includes('installer')) && (
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
                <Label htmlFor="sampleStatus">Status próbek</Label>
                <Select 
                    value={formData.sampleStatus} 
                    onValueChange={(value) => handleChange("sampleStatus", value)}
                >
                    <SelectTrigger id="sampleStatus">
                        <SelectValue placeholder="Wybierz status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Brak / Nie dotyczy</SelectItem>
                        <SelectItem value="to_send">Do wysłania</SelectItem>
                        <SelectItem value="sent">Wysłano</SelectItem>
                        <SelectItem value="delivered">Dostarczono</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="measurementDate">Data pomiaru</Label>
                <Input
                  id="measurementDate"
                  type="datetime-local"
                  value={formData.measurementDate}
                  onChange={(e) => handleChange("measurementDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedFloorArea">Szacowana powierzchnia (m²)</Label>
                <Input
                  id="estimatedFloorArea"
                  type="number"
                  step="0.01"
                  value={formData.estimatedFloorArea}
                  onChange={(e) => handleChange("estimatedFloorArea", e.target.value)}
                />
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

              <Separator />
              <div className="flex items-center space-x-2">
                <Checkbox 
                    id="isCompany" 
                    checked={formData.isCompany}
                    onCheckedChange={(checked) => handleChange("isCompany", checked as boolean)}
                />
                <Label htmlFor="isCompany">Firma (Faktura VAT)</Label>
              </div>

              {formData.isCompany && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Nazwa firmy</Label>
                        <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleChange("companyName", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nip">NIP</Label>
                        <Input
                        id="nip"
                        value={formData.nip}
                        onChange={(e) => handleChange("nip", e.target.value)}
                        />
                    </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="billingAddress">Adres do faktury</Label>
                <Input
                  id="billingAddress"
                  value={formData.billingAddress}
                  onChange={(e) => handleChange("billingAddress", e.target.value)}
                  placeholder="Ulica i numer"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label htmlFor="billingPostalCode">Kod pocztowy</Label>
                    <Input
                    id="billingPostalCode"
                    value={formData.billingPostalCode}
                    onChange={(e) => handleChange("billingPostalCode", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="billingCity">Miasto</Label>
                    <Input
                    id="billingCity"
                    value={formData.billingCity}
                    onChange={(e) => handleChange("billingCity", e.target.value)}
                    />
                </div>
              </div>

              <Separator />

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
                        <span>Wybierz termin</span>
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
      <CardContent className="space-y-6">
        {/* Section 1: Header (Address, Contact) */}
        <div className="space-y-3">
            <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="grid gap-0.5 w-full">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium leading-none">
                        {montage.installationAddress || "Brak adresu"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                        {montage.installationCity}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        {portalEnabled && (montage.customer?.referralToken ? (
                            <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 rounded-md px-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://b2b.primepodloga.pl/s/${montage.customer!.referralToken}`);
                                        toast.success('Link do portalu skopiowany');
                                    }}
                                    title="Kopiuj link do portalu klienta"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                                    asChild
                                    title="Otwórz portal klienta"
                                >
                                    <a href={`/s/${montage.customer.referralToken}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                                onClick={async () => {
                                    try {
                                        await generateCustomerToken(montage.id);
                                        toast.success('Portal klienta aktywowany');
                                    } catch {
                                        toast.error('Błąd aktywacji portalu');
                                    }
                                }}
                                title="Aktywuj portal klienta"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                            </Button>
                        ))}
                    </div>
                </div>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

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
                <div className="h-4 w-4 flex items-center justify-center">
                    <div className={cn("h-2.5 w-2.5 rounded-full", 
                        montage.sampleStatus === 'delivered' ? "bg-green-500" :
                        montage.sampleStatus === 'sent' ? "bg-blue-500" :
                        montage.sampleStatus === 'to_send' ? "bg-amber-500" :
                        montage.sampleStatus === 'returned' ? "bg-red-500" :
                        "bg-slate-300"
                    )} />
                </div>
                <Select
                    value={montage.sampleStatus || "none"}
                    onValueChange={handleSampleStatusChange}
                >
                    <SelectTrigger className="h-auto p-0 border-0 shadow-none bg-transparent text-sm hover:bg-transparent focus:ring-0 w-auto data-placeholder:text-foreground">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Brak próbek</SelectItem>
                        <SelectItem value="to_send">Próbki do wysłania</SelectItem>
                        <SelectItem value="sent">Próbki wysłane</SelectItem>
                        <SelectItem value="delivered">Próbki dostarczone</SelectItem>
                        <SelectItem value="returned">Próbki zwrócone</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Separator />

        {/* Section: Billing Data */}
        {(montage.isCompany || montage.billingAddress || montage.nip) && (
            <>
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Dane do faktury
                    </h4>
                    
                    {montage.isCompany && (
                        <div className="flex items-start gap-3">
                            <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="grid gap-0.5">
                                <p className="text-sm font-medium leading-none">
                                    {montage.companyName || "Brak nazwy firmy"}
                                </p>
                                {montage.nip && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        NIP: {montage.nip}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {(montage.billingAddress || montage.billingCity) && (
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="grid gap-0.5">
                                <p className="text-sm font-medium leading-none">
                                    {montage.billingAddress || "Brak ulicy"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {montage.billingPostalCode} {montage.billingCity}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <Separator />
            </>
        )}

        {/* Section 2: Dates (Grid) */}
        <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Terminy</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Measurement Date */}
                <div className="flex flex-col gap-1 p-2 rounded-md border bg-muted/20">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Ruler className="h-3 w-3" />
                        <span className="text-[10px] uppercase font-medium">Pomiar</span>
                    </div>
                    <span className="text-sm font-medium">
                        {measurementDate || "--.--.----"}
                    </span>
                </div>

                {/* Estimated Date */}
                <div className="flex flex-col gap-1 p-2 rounded-md border bg-muted/20">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span className="text-[10px] uppercase font-medium">Szacowany</span>
                    </div>
                    <span className="text-sm font-medium">
                        {forecastedDate || "--.--.----"}
                    </span>
                </div>

                {/* Installation Date */}
                <div className="flex flex-col gap-1 p-2 rounded-md border bg-muted/20">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Hammer className="h-3 w-3" />
                        <span className="text-[10px] uppercase font-medium">Montaż</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {formattedDate || "Nie zaplanowano"}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <Separator />

        {/* Section 3: Team (Grid/List) */}
        <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Zespół</h4>
            <div className="space-y-4">
                {/* Installer */}
                <div className="flex items-center gap-3">
                    <Hammer className="h-4 w-4 text-muted-foreground" />
                    <div className="grid gap-1 w-full">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Montażysta (Opiekun)</span>
                            <Select
                                value={montage.installerStatus}
                                onValueChange={handleInstallerStatusChange}
                                disabled={!userRoles.includes('admin')}
                            >
                                <SelectTrigger className={cn("h-5 w-[100px] text-[10px] font-medium border", getInstallerStatusColor(montage.installerStatus))}>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nie potwierdził</SelectItem>
                                    <SelectItem value="confirmed">Potwierdził</SelectItem>
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

                {/* Architect - Removed as per request */}
            </div>
        </div>

        {(montage.floorArea || montage.estimatedFloorArea) && (
            <div className="flex items-center gap-3 pt-2 border-t">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div className="grid gap-2 w-full">
                    {montage.estimatedFloorArea && (
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Szacowano:</span>
                            <span className="text-sm font-medium">{montage.estimatedFloorArea} m²</span>
                        </div>
                    )}
                    {montage.floorArea && (
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Pomiar:</span>
                            <span className="text-sm font-bold text-green-600">{montage.floorArea} m²</span>
                        </div>
                    )}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
