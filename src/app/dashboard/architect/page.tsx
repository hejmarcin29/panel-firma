import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { montages, commissions } from '@/lib/db/schema';
import { eq, and, not, desc, sum, sql, isNull } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { ArrowUpRight, DollarSign, Wallet, ArrowRight, User, ShoppingBag, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ArchitectDashboardPage() {
    const user = await requireUser();

    // 1. Fetch Stats
    // Active Projects
    const activeProjects = await db.query.montages.findMany({
        where: and(
            eq(montages.architectId, user.id),
            isNull(montages.deletedAt),
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
                <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-between h-[320px] group hover:border-zinc-300 transition-colors shadow-sm">
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

                {/* 2. Showroom Card (Unified Style) */}
                <div className="md:col-span-1 relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-between h-[320px] group hover:border-zinc-300 transition-colors shadow-sm">
                     {/* Background Gradient Accent */}
                     <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-violet-50 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-zinc-200 backdrop-blur-sm">
                            <ShoppingBag className="h-4 w-4 text-violet-600" />
                            <span className="text-xs font-medium text-zinc-600">Showroom</span>
                        </div>
                        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-violet-50 text-violet-600">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto">
                         <h3 className="text-2xl font-bold text-zinc-900 mb-2">Showroom Premium</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                            Odkryj nowe kolekcje 2026 i stwórz moodboard dla klienta.
                        </p>
                        <Button className="w-full bg-violet-600 text-white hover:bg-violet-700 rounded-xl h-11 shadow-sm" asChild>
                            <Link href="/dashboard/showroom">
                                Zobacz nowości
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 3. Active Projects List (Unified Header) */}
                <div className="md:col-span-2 rounded-3xl bg-white border border-zinc-200 p-6 min-h-[320px] shadow-sm group hover:border-zinc-300 transition-colors">
                     <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-zinc-200 backdrop-blur-sm w-fit">
                            <FolderOpen className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-zinc-600">Aktywne Projekty</span>
                        </div>
                        <Button variant="ghost" className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full h-8 px-3 text-xs" asChild>
                             <Link href="/dashboard/architect/projects">
                                Wszystkie <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {activeProjects.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-zinc-200 rounded-2xl">
                                <p className="text-zinc-500">Brak aktywnych projektów</p>
                            </div>
                        ) : (
                            activeProjects.map(project => (
                                <Link key={project.id} href={`/dashboard/crm/montaze/${project.id}`} className="block">
                                    <div className="group/item flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 hover:bg-white hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-zinc-500 font-medium border border-zinc-200 shadow-sm text-sm">
                                                {project.clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-zinc-900 font-medium group-hover/item:text-blue-600 transition-colors text-sm">
                                                    {project.clientName}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">
                                                    <span className="flex items-center gap-1">
                                                        {project.installationCity || 'Brak lokalizacji'}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                                    <span className="flex items-center gap-1 text-blue-600">
                                                        {project.status ? project.status.replace('_', ' ') : 'Nowy'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 group-hover/item:text-zinc-900 rounded-full">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* 4. Clients (Replaces Guardian) */}
                <div className="md:col-span-1 relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-between min-h-[320px] group hover:border-zinc-300 transition-colors shadow-sm">
                     {/* Background Gradient Accent */}
                     <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-orange-50 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />

                     <div className="relative z-10 flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-zinc-200 backdrop-blur-sm">
                            <User className="h-4 w-4 text-orange-600" />
                            <span className="text-xs font-medium text-zinc-600">Moi Klienci</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-start mt-auto">
                         <h3 className="text-2xl font-bold text-zinc-900 mb-2">Baza Kontaktów</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                            Szybki dostęp do wizytówek Twoich klientów i historii współpracy.
                        </p>
                        <Button className="w-full bg-orange-600 text-white hover:bg-orange-700 rounded-xl h-11 shadow-sm" asChild>
                            <Link href="/dashboard/architect/customers">
                                Lista Klientów
                            </Link>
                        </Button>
                    </div>
                </div>



            </div>
        </div>
    );
}

