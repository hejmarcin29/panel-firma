'use client';

import { useState } from 'react';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    MapPin, 
    Mail, 
    Hammer, 
    Banknote, 
    History,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { UserRole, InstallerProfile } from '@/lib/db/schema';
import { EmployeeDetailsSheet } from '@/app/dashboard/settings/team/_components/employee-details-sheet';

interface Installer {
    id: string;
    name: string | null;
    email: string;
    roles: UserRole[];
    isActive: boolean;
    createdAt: Date | null;
    installerProfile: InstallerProfile | null;
}

interface InstallersListProps {
    installers: Installer[];
}

export function InstallersList({ installers }: InstallersListProps) {
    const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    if (installers.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Brak montażystów w systemie.
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {installers.map((installer) => (
                    <InstallerCard 
                        key={installer.id} 
                        installer={installer} 
                        onDetailsClick={() => {
                            setSelectedInstaller(installer);
                            setIsSheetOpen(true);
                        }}
                    />
                ))}
            </div>

            {/* Reusing the sheet from settings/team but passing the installer as member */}
            {selectedInstaller && (
                <EmployeeDetailsSheet
                    member={{
                        ...selectedInstaller,
                        createdAt: selectedInstaller.createdAt || new Date(),
                    }}
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                />
            )}
        </>
    );
}

function InstallerCard({ installer, onDetailsClick }: { installer: Installer, onDetailsClick: () => void }) {
    const profile = installer.installerProfile;
    const [isPricingOpen, setIsPricingOpen] = useState(false);

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{installer.name || installer.email}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                            <Mail className="h-3 w-3" /> {installer.email}
                        </CardDescription>
                    </div>
                    <Badge variant={installer.isActive ? "default" : "secondary"}>
                        {installer.isActive ? "Dostępny" : "Niedostępny"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 text-sm">
                {profile?.operationArea && (
                    <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" /> Obszar działania
                        </div>
                        <p className="pl-6 text-foreground/90 whitespace-pre-wrap">
                            {profile.operationArea}
                        </p>
                    </div>
                )}

                {profile?.workScope && (
                    <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2 text-muted-foreground">
                            <Hammer className="h-4 w-4" /> Zakres prac
                        </div>
                        <p className="pl-6 text-foreground/90 whitespace-pre-wrap">
                            {profile.workScope}
                        </p>
                    </div>
                )}

                {profile?.pricing && profile.pricing.length > 0 && (
                    <div className="mt-auto pt-2 border-t">
                        <Collapsible open={isPricingOpen} onOpenChange={setIsPricingOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                                    <span className="font-medium flex items-center gap-2 text-muted-foreground">
                                        <Banknote className="h-4 w-4" /> Cennik ({profile.pricing.length} poz.)
                                    </span>
                                    {isPricingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-2 space-y-1">
                                {profile.pricing.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs">
                                        <span>{item.serviceName}</span>
                                        <span className="font-medium">{item.price} zł / {item.unit}</span>
                                    </div>
                                ))}
                                {profile.pricing.length > 5 && (
                                    <div className="text-xs text-muted-foreground text-center pt-1">
                                        + {profile.pricing.length - 5} więcej...
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                )}

                <div className="pt-4 mt-auto">
                    <Button variant="outline" className="w-full" onClick={onDetailsClick}>
                        <History className="mr-2 h-4 w-4" />
                        Szczegóły i Historia
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
