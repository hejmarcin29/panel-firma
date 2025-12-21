'use server';

import { asc, desc, sql, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
    montageAttachments,
    montageChecklistItems,
    montageNotes,
    montageTasks,
    systemLogs,
    quotes,
    customers,
    montages,
    users,
} from '@/lib/db/schema';
import { tryGetR2Config } from '@/lib/r2/config';
import { getMontageStatusDefinitions } from '@/lib/montaze/statuses';
import { mapMontageRow, type MontageRow } from '../utils';

export async function getMontageDetails(montageId: string) {
    const user = await requireUser();

    const allUsers = await db.query.users.findMany({
        columns: {
            id: true,
            name: true,
            email: true,
            roles: true,
        }
    });
    
    const installers = allUsers.filter(u => u.roles?.includes('installer') || u.roles?.includes('admin'));
    const measurers = installers;
    const architects = allUsers.filter(u => u.roles?.includes('architect'));

    const r2Config = await tryGetR2Config();
    const publicBaseUrl = r2Config?.publicBaseUrl ?? null;

    const statusDefinitions = await getMontageStatusDefinitions();
    const statusOptions = statusDefinitions.map(def => ({
        value: def.id,
        label: def.label,
        description: def.description
    }));

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
                with: {
                    attachments: true,
                },
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
            installer: true,
            measurer: true,
            architect: true,
            customer: true,
            quotes: {
                where: isNull(quotes.deletedAt),
                orderBy: desc(quotes.createdAt),
            },
            settlement: true,
        },
    });

    if (!montageRow) {
        return null;
    }

    const logs = await db
        .select()
        .from(systemLogs)
        .where(sql`${systemLogs.details} LIKE ${`%${montageId}%`}`)
        .orderBy(desc(systemLogs.createdAt));

    const montage = mapMontageRow(montageRow as MontageRow, publicBaseUrl);

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: {
            googleRefreshToken: true,
        }
    });
    const hasGoogleCalendar = !!currentUser?.googleRefreshToken;

    return {
        montage,
        logs,
        installers,
        measurers,
        architects,
        statusOptions,
        userRoles: user.roles,
        userId: user.id,
        hasGoogleCalendar,
    };
}

export type MontageDetailsData = Awaited<ReturnType<typeof getMontageDetails>>;

export async function generateCustomerToken(montageId: string) {
    await requireUser();

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        with: {
            customer: true,
        }
    });

    if (!montage || !montage.customer) {
        throw new Error('Nie znaleziono montażu lub klienta');
    }

    const token = randomUUID();

    await db.update(customers)
        .set({ referralToken: token })
        .where(eq(customers.id, montage.customer.id));

    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
    return token;
}
