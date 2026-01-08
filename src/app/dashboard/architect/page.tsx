import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { montages, users, commissions } from '@/lib/db/schema';
import { eq, and, not, desc, sum, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { ArrowUpRight, Clock, MapPin, DollarSign, Wallet, ArrowRight, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ArchitectDashboardPage() {
    const user = await requireUser();

    // 1. Fetch Stats
    // Active Projects
    const activeProjects = await db.query.montages.findMany({
        where: and(
            eq(montages.architectId, user.id),
            not(eq(montages.status, 'completed')),
            not(eq(montages.status, 'rejected'))
        ),
        limit: 5,
        orderBy: [desc(montages.createdAt)],
        with: {
            customer: true // Ensure relation exists or just display clientName
        }
    });

    // Wallet Balance (Total Paid + Pending)
    const commissionStats = await db
        .select({
            total: sum(commissions.amount),
            count: sql<number>`count(*)`
        })
        .from(commissions)
        .where(eq(commissions.architectId, user.id));
    
    const balance = (Number(commissionStats[0]?.total ?? 0) / 100);

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
                        Cześć, {user.name?.split(' ')[0] || 'Architekcie'}!
                    </h1>
                    <p className="text-zinc-500">
                        Oto centrum dowodzenia Twoimi projektami.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-full border-zinc-200 hover:bg-zinc-50 text-zinc-700" asChild>
                        <Link href="/dashboard/showroom">
                            Otwórz Showroom
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Wallet / Balance Card (Large) */}
                <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-between h-[300px] group hover:border-zinc-300 transition-colors shadow-sm">
                    {/* Background Noise/Gradient */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                    
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-zinc-200 backdrop-blur-sm">
                            <Wallet className="h-4 w-4 text-indigo-600" />
                            <span className="text-xs font-medium text-zinc-600">Portfel Prowizji</span>
                        </div>
                        <Button variant="ghost" className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full" size="icon">
                            <ArrowUpRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="relative z-10">
                        <div className="text-sm text-zinc-500 mb-1">Całkowity obrót prowizyjny</div>
                        <div className="text-5xl md:text-6xl font-bold text-zinc-900 tracking-tighter">
                            {formatCurrency(balance)}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                                +12% w tym miesiącu
                             </span>
                             <span className="text-xs text-zinc-500">
                                Ostatnia aktualizacja: Teraz
                             </span>
                        </div>
                    </div>
                </div>

                {/* 2. Quick Action / Promo Card */}
                <div className="md:col-span-1 rounded-3xl bg-linear-to-br from-indigo-600 to-violet-700 p-6 text-white flex flex-col justify-between h-[300px] shadow-xl shadow-indigo-900/10">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Showroom Premium</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Odkryj nowe kolekcje 2026 i stwórz moodboard dla klienta w 3 minuty.
                        </p>
                    </div>
                    <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none font-semibold rounded-xl h-12" asChild>
                        <Link href="/dashboard/showroom">
                            Zobacz nowości
                        </Link>
                    </Button>
                </div>

                {/* 3. Active Projects List */}
                <div className="md:col-span-2 rounded-3xl bg-white border border-zinc-200 p-6 min-h-[300px] shadow-sm">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-zinc-900">Aktywne Projekty</h3>
                        <Link href="/dashboard/crm/montaze" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
                            Wszystkie <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {activeProjects.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-zinc-200 rounded-2xl">
                                <p className="text-zinc-500">Brak aktywnych projektów</p>
                            </div>
                        ) : (
                            activeProjects.map(project => (
                                <div key={project.id} className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 hover:bg-white hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-zinc-500 font-medium border border-zinc-200 shadow-sm">
                                            {project.clientName.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-zinc-900 font-medium group-hover:text-indigo-600 transition-colors">
                                                {project.clientName}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {project.installationCity || 'Brak lokalizacji'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {project.status ? project.status.replace('_', ' ') : 'Nowy'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Button size="icon" variant="ghost" className="text-zinc-400 group-hover:text-zinc-900 rounded-full">
                                            <ArrowRight className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 4. Contact / Assistant */}
                <div className="md:col-span-1 rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-center items-center text-center shadow-sm">
                    <div className="h-20 w-20 rounded-full bg-linear-to-tr from-zinc-200 to-zinc-100 mb-4 p-1">
                        <div className="h-full w-full rounded-full bg-zinc-50 flex items-center justify-center overflow-hidden border border-zinc-100">
                            <User className="h-8 w-8 text-zinc-400" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-1">Twój Opiekun</h3>
                    <p className="text-zinc-500 text-sm mb-6">
                        Masz pytania do wyceny? <br /> Jestem dostępny.
                    </p>
                     <Button variant="outline" className="w-full rounded-xl border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 mb-2 text-zinc-700">
                        Zadzwoń
                    </Button>
                     <Button variant="ghost" className="w-full rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50">
                        Napisz wiadomość
                    </Button>
                </div>

            </div>
        </div>
    );
}

