"use client";

import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Mail, 
    MapPin, 
    Calendar, 
    Briefcase, 
    Star, 
    Edit,
    CheckCircle2,
    Clock,
    type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Types
import { users, montages, montageTasks, type InstallerProfile } from "@/lib/db/schema";

type User = typeof users.$inferSelect;
type MontageTask = typeof montageTasks.$inferSelect;
type Montage = typeof montages.$inferSelect & {
    tasks: MontageTask[];
};

interface InstallerDetailsViewProps {
    installer: User & { installerProfile: InstallerProfile | null };
    montages: Montage[];
}

export function InstallerDetailsView({ installer, montages }: InstallerDetailsViewProps) {
    const router = useRouter();

    const initials = installer.name
        ? installer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : installer.email.substring(0, 2).toUpperCase();

    const activeMontages = montages.filter(m => m.status !== 'completed' && m.status !== 'cancelled');
    const completedMontages = montages.filter(m => m.status === 'completed');
    
    // Stats
    const totalJobs = montages.length;
    const completedJobs = completedMontages.length;
    const activeJobs = activeMontages.length;
    
    // Calculate completion rate (mock logic for now)
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            {/* Header / Navbar */}
            <div className="border-b bg-background/95 backdrop-blur z-10 sticky top-0">
                <div className="flex h-16 items-center px-4 justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <span className="font-semibold text-lg truncate max-w-[200px] sm:max-w-md">
                            Profil Montażysty
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/settings/team?edit=${installer.id}`}>
                                <Edit className="h-5 w-5 text-muted-foreground" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                    
                    {/* Profile Header Card */}
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-card border rounded-xl p-6 shadow-sm">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2 w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <h1 className="text-2xl font-bold">{installer.name || "Bez nazwy"}</h1>
                                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm">{installer.email}</span>
                                    </div>
                                </div>
                                <Badge variant={installer.isActive ? "default" : "secondary"} className="w-fit px-3 py-1">
                                    {installer.isActive ? "Dostępny" : "Niedostępny"}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-4">
                                {installer.installerProfile?.operationArea && (
                                    <Badge variant="outline" className="bg-background">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {installer.installerProfile.operationArea}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="bg-background">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    Montażysta
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard 
                            label="Aktywne zlecenia" 
                            value={activeJobs} 
                            icon={Clock} 
                            color="text-blue-500" 
                            bg="bg-blue-500/10" 
                        />
                        <StatCard 
                            label="Zakończone" 
                            value={completedJobs} 
                            icon={CheckCircle2} 
                            color="text-emerald-500" 
                            bg="bg-emerald-500/10" 
                        />
                        <StatCard 
                            label="Wszystkie" 
                            value={totalJobs} 
                            icon={Briefcase} 
                            color="text-primary" 
                            bg="bg-primary/10" 
                        />
                        <StatCard 
                            label="Skuteczność" 
                            value={`${completionRate}%`} 
                            icon={Star} 
                            color="text-amber-500" 
                            bg="bg-amber-500/10" 
                        />
                    </div>

                    {/* Tabs Content */}
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 rounded-lg mb-4">
                            <TabsTrigger value="active" className="flex-1 md:flex-none rounded-md py-2">
                                W trakcie ({activeJobs})
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex-1 md:flex-none rounded-md py-2">
                                Historia ({completedJobs})
                            </TabsTrigger>
                            <TabsTrigger value="info" className="flex-1 md:flex-none rounded-md py-2">
                                Informacje
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="space-y-4">
                            {activeMontages.length > 0 ? (
                                activeMontages.map(montage => (
                                    <MontageCard key={montage.id} montage={montage} />
                                ))
                            ) : (
                                <EmptyState message="Brak aktywnych zleceń" />
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            {completedMontages.length > 0 ? (
                                completedMontages.map(montage => (
                                    <MontageCard key={montage.id} montage={montage} isHistory />
                                ))
                            ) : (
                                <EmptyState message="Brak historii zleceń" />
                            )}
                        </TabsContent>

                        <TabsContent value="info">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Szczegóły profilu</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Zakres prac</h4>
                                        <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                                            {installer.installerProfile?.workScope || "Nie zdefiniowano"}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Cennik usług</h4>
                                        {installer.installerProfile?.pricing && installer.installerProfile.pricing.length > 0 ? (
                                            <div className="border rounded-md divide-y">
                                                {installer.installerProfile.pricing.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between p-3 text-sm">
                                                        <span>{item.serviceName}</span>
                                                        <span className="font-medium">{item.price} zł / {item.unit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">Brak zdefiniowanego cennika</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string, value: string | number, icon: LucideIcon, color: string, bg: string }) {
    return (
        <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className={cn("p-2 rounded-full", bg)}>
                    <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function MontageCard({ montage, isHistory = false }: { montage: Montage, isHistory?: boolean }) {
    return (
        <Link href={`/dashboard/montaze/${montage.id}`} className="block">
            <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-semibold text-base">{montage.clientName}</h3>
                            <p className="text-sm text-muted-foreground">{montage.installationCity || "Brak adresu"}</p>
                        </div>
                        <Badge variant={isHistory ? "secondary" : "outline"}>
                            {montage.status}
                        </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {montage.scheduledInstallationAt 
                                ? format(new Date(montage.scheduledInstallationAt), "d MMM yyyy", { locale: pl })
                                : "Nie ustalono"}
                        </div>
                        {montage.tasks && (
                            <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {montage.tasks.filter((t) => t.completed).length}/{montage.tasks.length} zadań
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <div className="bg-muted/50 p-3 rounded-full mb-3">
                <Briefcase className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">{message}</p>
        </div>
    );
}
