import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { 
    LayoutDashboard, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    Briefcase, 
    ShoppingCart,
    ListTodo,
    CalendarDays
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

export default async function DashboardV2Page() {
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
        <div className="min-h-screen bg-background p-6 space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dzień dobry, {user.name || 'Użytkowniku'}</h1>
                    <p className="text-muted-foreground mt-1">Oto Twoje centrum dowodzenia na dziś.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Wróć do klasycznego widoku
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Command Center - Actionable Items */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                            Pilne Zadania
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.urgentTasksCount}</div>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80">
                            Wymagają natychmiastowej uwagi
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Aktywne Montaże
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeMontages}</div>
                        <p className="text-xs text-muted-foreground">
                            W toku realizacji
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Nowe Zamówienia
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Oczekują na weryfikację
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Dzisiejsza Data
                        </CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleDateString('pl-PL', { weekday: 'long' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                
                {/* Left Column - Urgent Actions (Span 2) */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Urgent Tasks Section */}
                    <Card className="h-full border-l-4 border-l-amber-500 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-amber-500" />
                                Priorytetowe Zadania
                            </CardTitle>
                            <CardDescription>Zadania oznaczone jako pilne lub ważne</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-4">
                                    {urgentTasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                                            <p>Wszystko zrobione!</p>
                                        </div>
                                    ) : (
                                        urgentTasks.map(task => (
                                            <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
                                                <div className={cn(
                                                    "mt-1 h-2 w-2 rounded-full shrink-0",
                                                    task.priority === 'urgent' ? "bg-red-500" : "bg-amber-500"
                                                )} />
                                                <div className="flex-1 space-y-1">
                                                    <p className="font-medium leading-none">{task.content}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {task.priority === 'urgent' ? 'PILNE' : 'WAŻNE'} • Utworzono {new Date(task.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href="/dashboard/todo">Zobacz</Link>
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Recent Orders Section */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-blue-500" />
                                Zamówienia do weryfikacji
                            </CardTitle>
                            <CardDescription>Ostatnie zamówienia wymagające przeglądu</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Brak nowych zamówień do weryfikacji.</p>
                                ) : (
                                    recentOrders.map(order => (
                                        <div key={order.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                                            <div>
                                                <p className="font-medium">{order.reference}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.billingName} • {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant="secondary">{order.status}</Badge>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/dashboard/orders/${order.id}`}>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Montages & Alerts */}
                <div className="space-y-6">
                    <Card className="h-full border-l-4 border-l-red-500 shadow-sm bg-red-50/30 dark:bg-red-900/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                Montaże - Alerty
                            </CardTitle>
                            <CardDescription>Zlecenia wymagające uwagi</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {urgentMontages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Brak alertów montażowych.</p>
                                ) : (
                                    urgentMontages.map(montage => (
                                        <Link key={montage.id} href={`/dashboard/montaze/${montage.id}`} className="block">
                                            <div className="p-3 rounded-md bg-background border shadow-sm hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-sm">{montage.clientName}</span>
                                                    <Badge variant="outline" className="text-[10px]">{montage.status}</Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {montage.scheduledInstallationAt 
                                                        ? `Termin: ${new Date(montage.scheduledInstallationAt).toLocaleDateString()}`
                                                        : 'Brak terminu (stare zlecenie)'
                                                    }
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/dashboard/montaze">Przejdź do montaży</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
