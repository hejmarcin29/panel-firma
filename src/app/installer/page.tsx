import { desc, eq, and, or, isNull } from 'drizzle-orm';
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { MapPin, Navigation, ArrowRight } from "lucide-react";
import Link from 'next/link';

import { db } from '@/lib/db';
import { montages } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { getStatusLabel } from '@/lib/montaze/statuses-shared';

export const dynamic = 'force-dynamic';

export default async function InstallerPage() {
    const user = await requireUser();

    // Enforce installer role (redundant with layout but good practice)
    if (!user.roles.includes('installer') && !user.roles.includes('admin')) {
        redirect('/dashboard');
    }

    // Fetch montages assigned to this user
    const data = await db.select()
        .from(montages)
        .where(and(
            isNull(montages.deletedAt),
            or(
                eq(montages.installerId, user.id),
                eq(montages.measurerId, user.id)
            ),
            // Exclude completed or rejected for the "Focus Feed"
            // We can add a separate "History" generic view later
            // For now, let's show everything that is NOT rejection or completed
            // Actually, maybe show completed from today?
        ))
        // Order by scheduled date or creation date
        .orderBy(desc(montages.updatedAt));

    // Client-side grouping for simplicity of this prototyping phase
    // In production, we might want separate queries or smarter filtering
    const activeData = data.filter(m => 
        !['completed', 'rejected', 'on_hold', 'new_lead'].includes(m.status)
    );

    // Filter "Today" - this would ideally check scheduledInstallationAt or scheduledMeasurementAt
    // For now, let's pick the first active one as "Focus"
    const focusItem = activeData[0];
    const upcomingItems = activeData.slice(1);

    return (
        <div className="pb-20 space-y-6">
            {/* Header / Greeting */}
            <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                    {format(new Date(), 'EEEE, d MMMM', { locale: pl })}
                </span>
                <h1 className="text-2xl font-bold text-foreground">
                    Dzień dobry, {user.name?.split(" ")[0]}!
                </h1>
            </div>

            {/* FOCUS CARD (The "Now" Item) */}
            {focusItem ? (
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            PRIORYTET TERAZ
                        </h2>
                    </div>
                    
                    <Link href={`/installer/montages/${focusItem.id}`}>
                        <div className="p-5 bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden group">
                             {/* Background Pattern */}
                            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                                <Navigation className="w-48 h-48" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between min-h-[180px]">
                                <div>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/10 mb-3">
                                        {getStatusLabel(focusItem.status)}
                                    </span>
                                    <h3 className="text-2xl font-bold leading-tight mb-1 line-clamp-2">
                                        {focusItem.clientName}
                                    </h3>
                                    <div className="flex items-start gap-1.5 opacity-90 text-sm mt-2">
                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p className="line-clamp-2">
                                            {focusItem.installationAddress || focusItem.billingAddress || 'Brak adresu'}
                                            {focusItem.installationCity ? `, ${focusItem.installationCity}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                                    <div className="text-xs opacity-70">
                                            {focusItem.measurerId === user.id ? 'Pomiar' : 'Montaż'}
                                    </div>
                                    <div className="flex items-center gap-2 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                        Otwórz Zlecenie <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </section>
            ) : (
                <div className="p-8 text-center bg-white rounded-3xl border shadow-sm">
                    <p className="text-muted-foreground">Brak aktywnych zleceń na ten moment.</p>
                    <p className="text-sm text-gray-400 mt-2">Odpocznij chwilę ☕</p>
                </div>
            )}

            {/* UPCOMING LIST */}
            {upcomingItems.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                        KOLEJNE ZADANIA
                    </h2>
                    <div className="space-y-3">
                        {upcomingItems.map((item) => (
                             <Link key={item.id} href={`/installer/montages/${item.id}`} className="block">
                                <div className="p-4 bg-white rounded-2xl border shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-muted-foreground px-1.5 py-0.5 bg-muted rounded-md uppercase tracking-wide">
                                                {item.measurerId === user.id ? 'Pomiar' : 'Montaż'}
                                            </span>
                                            <span className="text-[10px] items-center px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium truncate">
                                                 {getStatusLabel(item.status)}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900 truncate">
                                            {item.clientName}
                                        </h4>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {item.installationCity || 'Lokalizacja nieznana'}
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                             </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
