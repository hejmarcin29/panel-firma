"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, ChevronRight, Briefcase, Calendar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { UserRole, InstallerProfile } from "@/lib/db/schema";

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
    if (installers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Brak ekip montażowych</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Nie dodano jeszcze żadnych montażystów. Przejdź do ustawień zespołu, aby dodać nowych pracowników.
                </p>
                <Button asChild className="mt-6" variant="outline">
                    <Link href="/dashboard/settings/team">Zarządzaj Zespołem</Link>
                </Button>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {installers.map((installer) => (
                <motion.div key={installer.id} variants={item}>
                    <InstallerCard installer={installer} />
                </motion.div>
            ))}
        </motion.div>
    );
}

function InstallerCard({ installer }: { installer: Installer }) {
    const initials = installer.name
        ? installer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : installer.email.substring(0, 2).toUpperCase();

    return (
        <Link href={`/dashboard/crm/montaze/ekipy/${installer.id}`} className="block h-full">
            <Card className="h-full hover:shadow-md transition-all duration-300 border-muted/60 hover:border-primary/20 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Badge variant={installer.isActive ? "default" : "secondary"} className={installer.isActive ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200" : ""}>
                        {installer.isActive ? "Dostępny" : "Niedostępny"}
                    </Badge>
                </div>
                
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarFallback className="bg-primary/5 text-primary font-medium text-lg">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                            {installer.name || "Bez nazwy"}
                        </CardTitle>
                        <CardDescription className="text-xs truncate max-w-[180px]">
                            {installer.email}
                        </CardDescription>
                    </div>
                </CardHeader>
                
                <CardContent className="pt-2">
                    <div className="space-y-2.5 text-sm text-muted-foreground">
                        {installer.installerProfile?.operationArea && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                                <span className="truncate">{installer.installerProfile.operationArea}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>Montażysta</span>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Zobacz grafik</span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full -mr-2 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
