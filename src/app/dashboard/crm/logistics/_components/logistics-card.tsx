'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { MapPin, Calendar, Truck, Package, CheckCircle2, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { updateCargoChecklist, updateLogisticsStatus, updateLogisticsNotes } from '../actions';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Montage } from "../../montaze/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LogisticsCard({ montage }: { montage: any }) {
    const [notes, setNotes] = useState(montage.logisticsNotes || '');
    const quote = montage.quotes?.[0];
    const items = quote?.items || [];
    const checklist = montage.cargoChecklist || {};

    const handleCheck = async (itemId: string, checked: boolean) => {
        try {
            await updateCargoChecklist(montage.id, itemId, checked);
        } catch (error) {
            console.error(error);
            toast.error("Błąd zapisu");
        }
    };

    const handleStatusChange = async () => {
        const nextStatus = montage.logisticsStatus === 'loaded' ? 'delivered' : 'loaded';
        try {
            await updateLogisticsStatus(montage.id, nextStatus);
            toast.success(`Status zmieniony na: ${nextStatus}`);
        } catch (error) {
            console.error(error);
            toast.error("Błąd zmiany statusu");
        }
    };

    const handleNotesBlur = async () => {
        if (notes !== montage.logisticsNotes) {
            try {
                await updateLogisticsNotes(montage.id, notes);
                toast.success("Notatka zapisana");
            } catch (error) {
                console.error(error);
                toast.error("Błąd zapisu notatki");
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allChecked = items.length > 0 && items.every((item: any) => checklist[item.id]?.picked);
    const progress = items.length > 0 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? Math.round((items.filter((item: any) => checklist[item.id]?.picked).length / items.length) * 100)
        : 0;

    return (
        <Card className={cn("border-l-4", 
            montage.logisticsStatus === 'delivered' ? "border-l-green-500 opacity-75" : 
            montage.logisticsStatus === 'loaded' ? "border-l-blue-500" : "border-l-orange-500"
        )}>
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono">{montage.displayId}</Badge>
                            <Badge variant={montage.materialClaimType === 'installer_pickup' ? 'secondary' : 'default'}>
                                {montage.materialClaimType === 'installer_pickup' ? 'Odbiór własny' : 'Dostawa firmowa'}
                            </Badge>
                            {montage.logisticsStatus === 'loaded' && <Badge className="bg-blue-500">Załadowane</Badge>}
                            {montage.logisticsStatus === 'delivered' && <Badge className="bg-green-500">Dostarczone</Badge>}
                        </div>
                        <h3 className="font-bold text-lg">{montage.clientName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(montage.address || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                            >
                                {montage.address}, {montage.installationCity}
                            </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium text-foreground">
                                {montage.scheduledInstallationAt ? format(new Date(montage.scheduledInstallationAt), "EEEE, d MMMM HH:mm", { locale: pl }) : "Brak daty"}
                            </span>
                        </div>
                        {montage.installer && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                <User className="w-4 h-4" />
                                {montage.installer.name}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold text-muted-foreground/20">
                            {progress}%
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pb-3">
                <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Package className="w-4 h-4" />
                            Lista towarów (z wyceny)
                        </div>
                        {items.length > 0 ? (
                            <div className="grid gap-2">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {items.map((item: any) => (
                                    <div key={item.id} className="flex items-start gap-3 p-2 bg-background rounded border hover:bg-accent/50 transition-colors">
                                        <Checkbox 
                                            id={`item-${item.id}`}
                                            checked={checklist[item.id]?.picked || false}
                                            onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                                        />
                                        <div className="grid gap-0.5 leading-none">
                                            <label 
                                                htmlFor={`item-${item.id}`}
                                                className={cn("text-sm font-medium cursor-pointer", checklist[item.id]?.picked && "line-through text-muted-foreground")}
                                            >
                                                {item.name}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Ilość: {item.quantity} {item.unit}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Brak zaakceptowanej wyceny lub brak pozycji.</p>
                        )}
                    </div>

                    <div>
                        <Textarea 
                            placeholder="Notatki logistyczne (np. kod do bramy, uwagi do załadunku)..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleNotesBlur}
                            className="min-h-[80px] text-sm"
                        />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 flex justify-end gap-2">
                {montage.logisticsStatus !== 'delivered' && (
                    <Button 
                        onClick={handleStatusChange}
                        disabled={!allChecked && items.length > 0}
                        variant={allChecked ? "default" : "secondary"}
                        className="w-full md:w-auto"
                    >
                        {montage.logisticsStatus === 'loaded' ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Oznacz jako Dostarczone
                            </>
                        ) : (
                            <>
                                <Truck className="mr-2 h-4 w-4" />
                                Oznacz jako Załadowane
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
