'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { hash } from 'bcryptjs';

import { db } from '@/lib/db';
import { users, montages, commissions, type UserRole, type InstallerProfile, type ArchitectProfile } from '@/lib/db/schema';
import { requireUser, impersonateUser } from '@/lib/auth/session';

const TEAM_SETTINGS_PATH = '/dashboard/settings/team';

export async function impersonateUserAction(userId: string) {
    await impersonateUser(userId);
}

export async function getInstallerMontages(installerId: string) {
    await requireUser();
    
    return db.query.montages.findMany({
        where: eq(montages.installerId, installerId),
        orderBy: [desc(montages.createdAt)],
        limit: 20,
    });
}

export async function updateInstallerProfile(userId: string, profile: InstallerProfile) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    await db.update(users)
        .set({ installerProfile: profile, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath(TEAM_SETTINGS_PATH);
}

export async function updateArchitectProfile(userId: string, profile: ArchitectProfile) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    await db.update(users)
        .set({ architectProfile: profile, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath(TEAM_SETTINGS_PATH);
}

export async function getArchitectCommissions(architectId: string) {
    await requireUser();
    
    return db.query.commissions.findMany({
        where: eq(commissions.architectId, architectId),
        with: {
            montage: true,
        },
        orderBy: [desc(commissions.createdAt)],
    });
}

export async function getTeamMembers() {
    await requireUser();
    
    return db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        roles: users.roles,
        isActive: users.isActive,
        createdAt: users.createdAt,
        installerProfile: users.installerProfile,
        architectProfile: users.architectProfile,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
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
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath(TEAM_SETTINGS_PATH);
}

export async function toggleEmployeeStatus(userId: string, isActive: boolean) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    if (currentUser.id === userId) {
        throw new Error('Nie możesz zmienić statusu własnego konta.');
    }

    await db.update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath(TEAM_SETTINGS_PATH);
}

export async function updateEmployeeRoles(userId: string, roles: UserRole[]) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    if (currentUser.id === userId) {
        throw new Error('Nie możesz zmienić roli własnego konta.');
    }

    await db.update(users)
        .set({ roles, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath(TEAM_SETTINGS_PATH);
}
