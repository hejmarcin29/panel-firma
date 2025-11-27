import { desc, asc } from 'drizzle-orm';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

import { getManualOrders } from './orders/actions';
import { mapMontageRow, type MontageRow } from './montaze/utils';
import { DashboardStats } from './_components/dashboard-stats';
import type { Montage } from './montaze/types';

export default async function DashboardPage() {
	const user = await requireUser();
    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    // Fetch Montages
    const montageRows = await db.query.montages.findMany({
        orderBy: desc(montages.updatedAt),
        limit: 10, // Fetch a bit more than needed for stats
        with: {
            notes: {
                orderBy: desc(montageNotes.createdAt),
                with: {
                    author: true,
                    attachments: {
                        orderBy: desc(montageAttachments.createdAt),
                        with: {
                            uploader: true,
                        },
                    },
                },
            },
            tasks: {
                orderBy: asc(montageTasks.createdAt),
            },
            checklistItems: {
                orderBy: asc(montageChecklistItems.orderIndex),
                with: {
                    attachment: {
                        with: {
                            uploader: true,
                        },
                    },
                },
            },
            attachments: {
                orderBy: desc(montageAttachments.createdAt),
                with: {
                    uploader: true,
                },
            },
        },
    });

    const montagesData: Montage[] = montageRows.map((row) => mapMontageRow(row as MontageRow, publicBaseUrl));

    // Fetch Orders
    const ordersData = await getManualOrders();

	return (
		<section className="space-y-4 p-2 md:p-6">
            <DashboardStats 
                montages={montagesData} 
                orders={ordersData} 
                userName={user.name || user.email} 
            />
		</section>
	);
}
