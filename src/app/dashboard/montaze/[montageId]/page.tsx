import { asc, desc } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';

import { MontageCard } from '../_components/montage-card';
import { statusOptions } from '../constants';
import { mapMontageRow, type MontageRow } from '../utils';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

export default async function MontageDetailsPage({ params }: MontageDetailsPageParams) {
    const { montageId } = await params;

    await requireUser();

    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const montageRow = await db.query.montages.findFirst({
        where: (table, { eq }) => eq(table.id, montageId),
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

    if (!montageRow) {
        notFound();
    }

    const montage = mapMontageRow(montageRow as MontageRow, publicBaseUrl);
    return (
        <section className="mx-auto w-full max-w-[920px] space-y-4 px-3 pb-8 sm:px-6">
            <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                    <Link href="/dashboard/montaze">Powrót</Link>
                </Button>
            </div>

            <MontageCard montage={montage} statusOptions={statusOptions} />
        </section>
    );
}
