import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { 
    LayoutDashboard, 
    AlertCircle, 
    Briefcase, 
    ShoppingCart,
    ListTodo,
    CalendarDays,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
	montages,
    manualOrders,
    boardTasks,
} from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const user = await requireUser();
    const sevenDaysAgo = subDays(new Date(), 7);

    // 1. Fetch Urgent Data for Command Center
    
    // Montages needing attention (delayed or upcoming soon without date)
    const urgentMontages = await db.query.montages.findMany({
        where: (table, { or, and, lt }) => or(
            // Status is lead or before_measurement and created more than 7 days ago
            and(
                or(eq(table.status, 'lead'), eq(table.status, 'before_measurement')),
                lt(table.createdAt, sevenDaysAgo)
            ),
            // Or scheduled date is in the past and not completed
            and(
                lt(table.scheduledInstallationAt, new Date()),
                eq(table.status, 'before_installation')
            )
        ),
        limit: 5,
        orderBy: desc(montages.updatedAt)
    });

    // Urgent Tasks (Priority 'urgent' or 'important')
    const urgentTasks = await db.query.boardTasks.findMany({
        where: (table, { and, or, eq }) => and(
            eq(table.completed, false),
            or(eq(table.priority, 'urgent'), eq(table.priority, 'important'))
        ),
        limit: 5,
        orderBy: desc(boardTasks.createdAt)
    });

    // Recent Orders needing review
    const recentOrders = await db.query.manualOrders.findMany({
        where: (table, { eq }) => eq(table.requiresReview, true),
        limit: 5,
        orderBy: desc(manualOrders.createdAt)
    });

    // Stats for Bento Grid
    const stats = {
        activeMontages: (await db.query.montages.findMany({ where: (t, { ne }) => ne(t.status, 'completed') })).length,
        pendingOrders: (await db.query.manualOrders.findMany({ where: (t, { eq }) => eq(t.status, 'Nowe') })).length,
        urgentTasksCount: urgentTasks.length,
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Witaj, {user.name || 'Użytkowniku'}.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-card border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground" asChild>
                        <Link href="/dashboard/v2">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Stary Dashboard
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Command Center - Actionable Items */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pilne Zadania
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-foreground">{stats.urgentTasksCount}</div>
                        <p className="text-xs text-orange-500/80 flex items-center mt-1">
                            Wymagają uwagi <ArrowUpRight className="h-3 w-3 ml-1" />
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Aktywne Montaże
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-foreground">{stats.activeMontages}</div>
                        <p className="text-xs text-blue-500/80 flex items-center mt-1">
                            W realizacji <ArrowUpRight className="h-3 w-3 ml-1" />
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Nowe Zamówienia
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-foreground">{stats.pendingOrders}</div>
                        <p className="text-xs text-emerald-500/80 flex items-center mt-1">
                            Do weryfikacji <ArrowUpRight className="h-3 w-3 ml-1" />
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Dzisiaj
                        </CardTitle>
                        <CalendarDays className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl font-bold text-foreground truncate">
                            {new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                        </div>
                        <p className="text-xs text-purple-500/80 mt-1 truncate">
                            {new Date().toLocaleDateString('pl-PL', { weekday: 'long' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column - Urgent Actions (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Urgent Tasks Section */}
                    <Card className="bg-card border-border shadow-none h-full">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-foreground">
                                        <ListTodo className="h-5 w-5 text-orange-500" />
                                        Priorytety
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">Zadania oznaczone jako pilne lub ważne</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent" asChild>
                                    <Link href="/dashboard/todo">Wszystkie</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-3">
                                    {urgentTasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                                            <p>Wszystko zrobione!</p>
                                        </div>
                                    ) : (
                                        urgentTasks.map(task => (
                                            <div key={task.id} className="group flex items-start gap-3 p-3 rounded-lg bg-accent/50 border border-border/50 hover:border-border transition-colors">
                                                <div className={cn(
                                                    "mt-1.5 h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px]",
                                                    task.priority === 'urgent' ? "bg-orange-500 shadow-orange-500/50" : "bg-yellow-500 shadow-yellow-500/50"
                                                )} />
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-medium leading-none text-foreground group-hover:text-primary transition-colors">{task.content}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {task.priority === 'urgent' ? 'PILNE' : 'WAŻNE'} • {new Date(task.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" asChild>
                                                    <Link href="/dashboard/todo">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Recent Orders Section */}
                    <Card className="bg-card border-border shadow-none">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-foreground">
                                        <ShoppingCart className="h-5 w-5 text-emerald-500" />
                                        Zamówienia
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">Ostatnie zamówienia do weryfikacji</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent" asChild>
                                    <Link href="/dashboard/orders">Wszystkie</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {recentOrders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Brak nowych zamówień do weryfikacji.</p>
                                ) : (
                                    recentOrders.map(order => (
                                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border/50">
                                            <div>
                                                <p className="font-medium text-foreground">{order.reference}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.billingName} • {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="bg-card border-border text-muted-foreground">
                                                    {order.status}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" asChild>
                                                    <Link href={`/dashboard/orders/${order.id}`}>
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Montages & Alerts */}
                <div className="space-y-6">
                    <Card className="bg-card border-border shadow-none h-full">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                Alerty Montażowe
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">Zlecenia wymagające uwagi</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {urgentMontages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Brak alertów montażowych.</p>
                                ) : (
                                    urgentMontages.map(montage => (
                                        <Link key={montage.id} href={`/dashboard/crm/montaze/${montage.id}`} className="block group">
                                            <div className="p-3 rounded-lg bg-accent/50 border border-border/50 group-hover:border-red-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{montage.clientName}</span>
                                                    <Badge variant="outline" className="text-[10px] bg-card border-border text-muted-foreground">
                                                        {montage.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {montage.scheduledInstallationAt 
                                                        ? <span className="text-red-400">Termin: {new Date(montage.scheduledInstallationAt).toLocaleDateString()}</span>
                                                        : <span className="text-orange-400">Brak terminu (stare zlecenie)</span>
                                                    }
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 pt-4 border-t border-border/50">
                                <Button variant="outline" className="w-full bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground" asChild>
                                    <Link href="/dashboard/crm/montaze">Przejdź do montaży</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
