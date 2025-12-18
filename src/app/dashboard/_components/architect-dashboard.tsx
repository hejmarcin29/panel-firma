'use client';

import { motion } from 'framer-motion';
import { Plus, ArrowRight, Wallet, Building2, Hammer, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AddLeadModal } from '../montaze/_components/add-lead-modal';
import { useState } from 'react';

interface ArchitectDashboardProps {
    user: {
        name: string | null;
        id: string;
    };
    projects: {
        id: string;
        clientName: string;
        status: string;
        address: string | null;
        updatedAt: Date | null;
        scheduledInstallationAt: Date | string | null;
    }[];
    stats: {
        activeProjects: number;
        completedProjects: number;
        totalCommission: number; // Placeholder for now
    };
}

const STATUS_MAP: Record<string, { label: string; progress: number; color: string }> = {
    'lead': { label: 'Nowy temat', progress: 10, color: 'bg-blue-500' },
    'before_measurement': { label: 'Oczekiwanie na pomiar', progress: 25, color: 'bg-indigo-500' },
    'before_first_payment': { label: 'Wycena i akceptacja', progress: 40, color: 'bg-purple-500' },
    'before_installation': { label: 'Produkcja w toku', progress: 65, color: 'bg-amber-500' },
    'before_final_invoice': { label: 'Montaż zakończony', progress: 90, color: 'bg-emerald-500' },
    'completed': { label: 'Zakończony', progress: 100, color: 'bg-green-600' },
    'cancelled': { label: 'Anulowany', progress: 0, color: 'bg-gray-400' },
};

function getStatusInfo(status: string) {
    return STATUS_MAP[status] || { label: status, progress: 0, color: 'bg-gray-400' };
}

function initials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function ArchitectDashboard({ user, projects, stats }: ArchitectDashboardProps) {
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
    const firstName = user.name?.split(' ')[0] || 'Partnerze';

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
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Panel Partnera</p>
                    <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight">
                        Dzień dobry, {firstName}.
                    </h1>
                    <p className="text-lg text-muted-foreground font-light max-w-xl">
                        Oto podsumowanie Twoich projektów w realizacji.
                    </p>
                </div>
                <Button 
                    size="lg" 
                    className="rounded-full px-8 font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    onClick={() => setIsAddLeadOpen(true)}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Zgłoś nowy temat
                </Button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <motion.div variants={item}>
                    <Card className="border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Aktywne projekty</p>
                                <p className="text-3xl font-serif">{stats.activeProjects}</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Zrealizowane</p>
                                <p className="text-3xl font-serif">{stats.completedProjects}</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Portfel</p>
                                <Link href="/dashboard/wallet" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mt-1">
                                    Przejdź do rozliczeń <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Projects List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-2xl font-serif">Projekty w toku</h2>
                    <Link href="/dashboard/crm/montaze" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Zobacz wszystkie
                    </Link>
                </div>

                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-4"
                >
                    {projects.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed">
                            <p className="text-muted-foreground">Brak aktywnych projektów.</p>
                            <Button variant="link" onClick={() => setIsAddLeadOpen(true)}>
                                Dodaj pierwszy projekt
                            </Button>
                        </div>
                    ) : (
                        projects.map((project) => {
                            const statusInfo = getStatusInfo(project.status);
                            return (
                                <motion.div key={project.id} variants={item}>
                                    <Link href={`/dashboard/crm/montaze/${project.id}`}>
                                        <Card className="group hover:shadow-md transition-all duration-300 border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                            <CardContent className="p-0">
                                                <div className="flex flex-col md:flex-row">
                                                    {/* Left Status Stripe */}
                                                    <div className={`w-full md:w-2 h-2 md:h-auto ${statusInfo.color}`} />
                                                    
                                                    <div className="p-6 flex-1 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                                        <div className="flex items-start gap-4">
                                                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                                                <AvatarFallback className="bg-zinc-100 text-zinc-600 font-serif text-lg">
                                                                    {initials(project.clientName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                                                                    {project.clientName}
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                                    {project.address || 'Brak adresu'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 md:max-w-md space-y-2">
                                                            <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                                <span>{statusInfo.label}</span>
                                                                <span>{statusInfo.progress}%</span>
                                                            </div>
                                                            <Progress value={statusInfo.progress} className="h-2" />
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground min-w-[140px] justify-end">
                                                            {project.scheduledInstallationAt ? (
                                                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                                                                    <Hammer className="w-4 h-4" />
                                                                    <span>{new Date(project.scheduledInstallationAt).toLocaleDateString()}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '-'}</span>
                                                                </div>
                                                            )}
                                                            <div className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary group-hover:text-white transition-colors">
                                                                <ArrowRight className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
            </div>

            <AddLeadModal 
                open={isAddLeadOpen} 
                onOpenChange={setIsAddLeadOpen} 
            />
        </div>
    );
}
