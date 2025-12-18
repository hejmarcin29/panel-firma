"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, PlayCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";
import { motion } from "framer-motion";

export interface MontageSimple {
    id: string;
    clientName: string;
    scheduledInstallationAt: Date | string | number | null;
    status: string;
}

interface UpcomingMontagesKPIProps {
    montages7Days: MontageSimple[];
    montages3Days: MontageSimple[];
    montagesInProgress: MontageSimple[];
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
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
};

const StatBox = ({ 
    label, 
    count, 
    icon: Icon, 
    tabValue,
    colorClass = "text-primary",
    setActiveTab
}: { 
    label: string; 
    count: number; 
    icon: LucideIcon; 
    tabValue: string;
    colorClass?: string;
    setActiveTab: (val: string) => void;
}) => (
    <DialogTrigger asChild onClick={() => setActiveTab(tabValue)}>
        <div className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors flex-1 text-center">
            <Icon className={`h-5 w-5 mb-1 ${colorClass}`} />
            <span className={`text-2xl font-bold ${count > 0 ? colorClass : "text-muted-foreground"}`}>
                {count}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {label}
            </span>
        </div>
    </DialogTrigger>
);

const MontageList = ({ items }: { items: MontageSimple[] }) => (
    <ScrollArea className="h-[50vh] pr-4">
        {items.length > 0 ? (
            <motion.div 
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {items.map((m) => (
                    <motion.div variants={item} key={m.id}>
                    <Link 
                        href={`/dashboard/crm/montaze/${m.id}`}
                        className="block p-3 rounded-md border hover:bg-accent/50 transition-colors"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{m.clientName}</span>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                                {m.scheduledInstallationAt 
                                    ? format(new Date(m.scheduledInstallationAt), "d MMM", { locale: pl }) 
                                    : "Brak daty"}
                            </span>
                        </div>
                    </Link>
                    </motion.div>
                ))}
            </motion.div>
        ) : (
            <div className="text-center py-8 text-muted-foreground">
                Brak montaży w tej kategorii.
            </div>
        )}
    </ScrollArea>
);

export function UpcomingMontagesKPI({ montages7Days, montages3Days, montagesInProgress }: UpcomingMontagesKPIProps) {
    const [activeTab, setActiveTab] = useState<string>("7days");

    return (
        <Dialog>
            <Card className="h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Harmonogram montaży
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between gap-2">
                        <StatBox 
                            label="Do 7 dni" 
                            count={montages7Days.length} 
                            icon={Calendar} 
                            tabValue="7days"
                            colorClass="text-blue-600 dark:text-blue-400"
                            setActiveTab={setActiveTab}
                        />
                        <div className="w-px bg-border my-2" />
                        <StatBox 
                            label="Do 3 dni" 
                            count={montages3Days.length} 
                            icon={Clock} 
                            tabValue="3days"
                            colorClass="text-amber-600 dark:text-amber-400"
                            setActiveTab={setActiveTab}
                        />
                        <div className="w-px bg-border my-2" />
                        <StatBox 
                            label="W trakcie" 
                            count={montagesInProgress.length} 
                            icon={PlayCircle} 
                            tabValue="inprogress"
                            colorClass="text-emerald-600 dark:text-emerald-400"
                            setActiveTab={setActiveTab}
                        />
                    </div>
                </CardContent>
            </Card>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Harmonogram montaży</DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="7days">Do 7 dni ({montages7Days.length})</TabsTrigger>
                        <TabsTrigger value="3days">Do 3 dni ({montages3Days.length})</TabsTrigger>
                        <TabsTrigger value="inprogress">W trakcie ({montagesInProgress.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="7days" className="mt-4">
                        <MontageList items={montages7Days} />
                    </TabsContent>
                    
                    <TabsContent value="3days" className="mt-4">
                        <MontageList items={montages3Days} />
                    </TabsContent>
                    
                    <TabsContent value="inprogress" className="mt-4">
                        <MontageList items={montagesInProgress} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
