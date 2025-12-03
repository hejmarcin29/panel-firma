"use client";

import { MapPin, Phone, Mail, Calendar, Edit2, Ruler } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { updateMontageContactDetails } from "../../actions";
import type { Montage } from "../../types";

import { formatScheduleRange } from "../../utils";

export function MontageClientCard({ montage }: { montage: Montage }) {
  const [isEditing, setIsEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      await updateMontageContactDetails({
        montageId: montage.id,
        clientName: montage.clientName, // Required by type but not editable here for now
        contactEmail: formData.get("contactEmail") as string,
        contactPhone: formData.get("contactPhone") as string,
        billingAddress: formData.get("billingAddress") as string,
        installationAddress: formData.get("installationAddress") as string,
        billingCity: formData.get("billingCity") as string,
        installationCity: formData.get("installationCity") as string,
        scheduledInstallationDate: formData.get("scheduledInstallationAt") as string,
        scheduledInstallationEndDate: formData.get("scheduledInstallationEndAt") as string,
      });
      setIsEditing(false);
      router.refresh();
    });
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    (montage.installationAddress || "") + " " + (montage.installationCity || "")
  )}`;

  const scheduledDate = montage.scheduledInstallationAt
    ? new Date(montage.scheduledInstallationAt as string | number | Date).toISOString().split("T")[0]
    : "";
  const scheduledEndDate = montage.scheduledInstallationEndAt
    ? new Date(montage.scheduledInstallationEndAt as string | number | Date).toISOString().split("T")[0]
    : "";

  const formattedDate = formatScheduleRange(montage.scheduledInstallationAt, montage.scheduledInstallationEndAt);
  const forecastedDate = montage.forecastedInstallationDate 
    ? new Date(montage.forecastedInstallationDate as string | number | Date).toLocaleDateString('pl-PL')
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Dane Klienta</CardTitle>
        <Sheet open={isEditing} onOpenChange={setIsEditing}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edytuj dane klienta</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  defaultValue={montage.contactPhone || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  defaultValue={montage.contactEmail || ""}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="installationAddress">Adres montażu</Label>
                <Input
                  id="installationAddress"
                  name="installationAddress"
                  defaultValue={montage.installationAddress || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installationCity">Miasto montażu</Label>
                <Input
                  id="installationCity"
                  name="installationCity"
                  defaultValue={montage.installationCity || ""}
                />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduledInstallationAt">Data montażu (od)</Label>
                    <Input
                    id="scheduledInstallationAt"
                    name="scheduledInstallationAt"
                    type="date"
                    defaultValue={scheduledDate}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="scheduledInstallationEndAt">Data montażu (do)</Label>
                    <Input
                    id="scheduledInstallationEndAt"
                    name="scheduledInstallationEndAt"
                    type="date"
                    defaultValue={scheduledEndDate}
                    />
                </div>
               </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
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
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
