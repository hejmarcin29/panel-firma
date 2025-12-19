'use server';

import { db } from '@/lib/db';
import { users, montages, commissions, partnerCommissions, partnerPayouts, type UserRole } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { requireUser, impersonateUser } from '@/lib/auth/session';
import { generatePortalToken } from '@/lib/utils';

const ERP_TEAM_PATH = '/dashboard/erp/zespol';

export async function impersonateUserAction(userId: string) {
    await impersonateUser(userId);
}

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

export async function changeUserPassword(userId: string, newPassword: string) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień do zmiany hasła.');
    }

    if (newPassword.length < 6) {
        throw new Error('Hasło musi mieć co najmniej 6 znaków.');
    }

    const passwordHash = await hash(newPassword, 12);

    await db.update(users)
        .set({ 
            passwordHash, 
            updatedAt: new Date() 
        })
        .where(eq(users.id, userId));

    revalidatePath(ERP_TEAM_PATH);
    revalidatePath(`${ERP_TEAM_PATH}/${userId}`);
}

export async function getUserFinancials(userId: string, roles: string[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};

    if (roles.includes('architect')) {
        data.architectCommissions = await db.query.commissions.findMany({
            where: eq(commissions.architectId, userId),
            with: { montage: true },
            orderBy: [desc(commissions.createdAt)],
            limit: 50
        });
    }

    if (roles.includes('partner')) {
        data.partnerCommissions = await db.query.partnerCommissions.findMany({
            where: eq(partnerCommissions.partnerId, userId),
            with: { montage: true },
            orderBy: [desc(partnerCommissions.createdAt)],
            limit: 50
        });
        data.partnerPayouts = await db.query.partnerPayouts.findMany({
            where: eq(partnerPayouts.partnerId, userId),
            orderBy: [desc(partnerPayouts.createdAt)],
            limit: 20
        });
    }

    if (roles.includes('installer')) {
        data.installerMontages = await db.query.montages.findMany({
            where: eq(montages.installerId, userId),
            orderBy: [desc(montages.createdAt)],
            limit: 20
        });
    }
    
    if (roles.includes('measurer')) {
        data.measurerMontages = await db.query.montages.findMany({
            where: eq(montages.measurerId, userId),
            orderBy: [desc(montages.createdAt)],
            limit: 20
        });
    }

    return data;
}
