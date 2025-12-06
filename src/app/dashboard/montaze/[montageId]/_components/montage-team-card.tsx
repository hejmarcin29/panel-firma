"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Edit2, Check, X, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMontageTeam } from "../../actions";
import type { Montage } from "../../types";
import { type UserRole } from '@/lib/db/schema';

interface UserOption {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
}

interface MontageTeamCardProps {
    montage: Montage;
    installers: UserOption[];
    measurers: UserOption[];
    userRole?: UserRole;
}

export function MontageTeamCard({ montage, installers, measurers, userRole = 'admin' }: MontageTeamCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const [selectedInstaller, setSelectedInstaller] = useState<string>(montage.installerId || "none");
    const [selectedMeasurer, setSelectedMeasurer] = useState<string>(montage.measurerId || "none");

    const handleSave = () => {
        startTransition(async () => {
            await updateMontageTeam({
                montageId: montage.id,
                installerId: selectedInstaller === "none" ? null : selectedInstaller,
                measurerId: selectedMeasurer === "none" ? null : selectedMeasurer,
            });
            setIsEditing(false);
            router.refresh();
        });
    };

    const handleCancel = () => {
        setSelectedInstaller(montage.installerId || "none");
        setSelectedMeasurer(montage.measurerId || "none");
        setIsEditing(false);
    };

    const getInstallerName = (id: string | null) => {
        if (!id) return "Nie przypisano";
        const user = installers.find(u => u.id === id);
        return user ? (user.name || user.email) : "Nieznany";
    };

    const getMeasurerName = (id: string | null) => {
        if (!id) return "Nie przypisano";
        const user = measurers.find(u => u.id === id);
        return user ? (user.name || user.email) : "Nieznany";
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zespół Realizacyjny</CardTitle>
                {userRole === 'admin' && !isEditing && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                )}
                {isEditing && (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={pending}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={handleCancel} disabled={pending}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Montażysta</Label>
                    {isEditing ? (
                        <Select value={selectedInstaller} onValueChange={setSelectedInstaller}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz montażystę" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Brak</SelectItem>
                                {installers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || user.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{getInstallerName(montage.installerId || null)}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Pomiarowiec</Label>
                    {isEditing ? (
                        <Select value={selectedMeasurer} onValueChange={setSelectedMeasurer}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz pomiarowca" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Brak</SelectItem>
                                {measurers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || user.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{getMeasurerName(montage.measurerId || null)}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
