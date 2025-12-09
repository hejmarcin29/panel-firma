'use server';

import { db } from '@/lib/db';
import { montages, users } from '@/lib/db/schema';
import { desc, eq, inArray, and, gte } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/session';

export type TvMontage = {
    id: string;
    clientName: string;
    city: string | null;
    status: string;
    installer: string | null;
    measurer: string | null;
    updatedAt: Date;
    priority: 'normal' | 'high';
    daysInStatus: number;
};

export type TvColumn = {
    id: string;
    title: string;
    items: TvMontage[];
    color: string;
};

export async function getTvData() {
    await requireUser();

    // Fetch all active montages + recently completed
    const allMontages = await db.query.montages.findMany({
        with: {
            installer: true,
            measurer: true,
        },
        orderBy: [desc(montages.updatedAt)],
    });

    const now = new Date();

    const mapToTvItem = (m: typeof allMontages[0]): TvMontage => {
        const daysInStatus = Math.floor((now.getTime() - new Date(m.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        
        return {
            id: m.id,
            clientName: m.clientName,
            city: m.installationCity || m.billingCity || 'Brak miasta',
            status: m.status,
            installer: m.installer?.name || null,
            measurer: m.measurer?.name || null,
            updatedAt: m.updatedAt,
            daysInStatus,
            priority: daysInStatus > 7 ? 'high' : 'normal', // Highlight if stuck for > 7 days
        };
    };

    const columns: TvColumn[] = [
        {
            id: 'leads',
            title: 'Nowe Zlecenia',
            color: 'from-blue-500/20 to-blue-600/5',
            items: allMontages
                .filter(m => m.status === 'lead')
                .map(mapToTvItem)
        },
        {
            id: 'measurements',
            title: 'Do Pomiaru',
            color: 'from-purple-500/20 to-purple-600/5',
            items: allMontages
                .filter(m => m.status === 'before_measurement')
                .map(mapToTvItem)
        },
        {
            id: 'pricing',
            title: 'Wycena / Zaliczka',
            color: 'from-yellow-500/20 to-yellow-600/5',
            items: allMontages
                .filter(m => m.status === 'before_first_payment')
                .map(mapToTvItem)
        },
        {
            id: 'installation',
            title: 'W Realizacji',
            color: 'from-orange-500/20 to-orange-600/5',
            items: allMontages
                .filter(m => ['before_installation', 'before_final_invoice'].includes(m.status))
                .map(mapToTvItem)
        },
        {
            id: 'done',
            title: 'Zakończone (Ost. 7 dni)',
            color: 'from-green-500/20 to-green-600/5',
            items: allMontages
                .filter(m => m.status === 'completed')
                .filter(m => {
                    const diff = now.getTime() - new Date(m.updatedAt).getTime();
                    return diff < 7 * 24 * 60 * 60 * 1000; // Last 7 days only
                })
                .map(mapToTvItem)
        }
    ];

    return columns;
}
