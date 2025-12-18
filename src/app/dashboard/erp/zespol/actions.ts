'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function getTeamMembers() {
    const team = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
        columns: {
            id: true,
            name: true,
            email: true,
            roles: true,
            isActive: true,
            installerProfile: true,
            architectProfile: true,
            partnerProfile: true,
            createdAt: true,
        }
    });

    return team;
}
