'use server';

import { db } from '@/lib/db';
import { users, type UserRole } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { requireUser } from '@/lib/auth/session';
import { generatePortalToken } from '@/lib/utils';

const ERP_TEAM_PATH = '/dashboard/erp/zespol';

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

export async function getUserDetails(userId: string) {
    const user = await db.query.users.findFirst({
        where: (table, { eq }) => eq(table.id, userId),
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
            updatedAt: true,
        }
    });

    if (!user) throw new Error('Nie znaleziono użytkownika');
    return user;
}

export async function createEmployee({
    name,
    email,
    password,
    roles
}: {
    name: string;
    email: string;
    password: string;
    roles: UserRole[];
}) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień do dodawania pracowników.');
    }

    const existingUser = await db.query.users.findFirst({
        where: (table, { eq }) => eq(table.email, email),
    });

    if (existingUser) {
        throw new Error('Użytkownik z tym adresem e-mail już istnieje.');
    }

    const passwordHash = await hash(password, 12);

    await db.insert(users).values({
        id: crypto.randomUUID(),
        email,
        name,
        passwordHash,
        roles,
        isActive: true,
        referralToken: generatePortalToken(),
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath(ERP_TEAM_PATH);
}
