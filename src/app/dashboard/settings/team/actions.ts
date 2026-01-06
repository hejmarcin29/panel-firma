'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { hash } from 'bcryptjs';

import { db } from '@/lib/db';
import { users, montages, commissions, products, type UserRole, type InstallerProfile, type ArchitectProfile, type PartnerProfile } from '@/lib/db/schema';
import { requireUser, impersonateUser } from '@/lib/auth/session';
import { generatePortalToken } from '@/lib/utils';

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

export async function updateArchitectAssignedProducts(userId: string, productIds: number[]) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) throw new Error('User not found');

    const currentProfile = user.architectProfile || {};
    const newProfile = {
        ...currentProfile,
        assignedProductIds: productIds
    };

    await db.update(users)
        .set({ architectProfile: newProfile, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath(`/dashboard/settings/team/${userId}`);
}

export async function updatePartnerProfile(userId: string, profile: PartnerProfile) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    await db.update(users)
        .set({ partnerProfile: profile, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath(TEAM_SETTINGS_PATH);
}

export async function updateEmployeeCredentials(userId: string, data: { name?: string; email?: string; password?: string }) {
    const currentUser = await requireUser();
    
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    const updateData: { name?: string; email?: string; passwordHash?: string; updatedAt: Date } = {
        updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) {
        updateData.passwordHash = await hash(data.password, 12);
    }

    await db.update(users)
        .set(updateData)
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


export interface CategoryWithProducts {
    id: number;
    name: string;
    products: {
        id: number;
        name: string;
        sku: string;
    }[];
}

export async function getOfferConfigurationData() {
    await requireUser();
    
    // Fetch all published products
    const allProducts = await db.query.products.findMany({
        where: (table, { isNull, eq, and }) => and(
            isNull(table.deletedAt),
            eq(table.status, 'publish')
        ),
        columns: {
            id: true,
            name: true,
            sku: true,
            categories: true,
        },
        orderBy: (table, { asc }) => [asc(table.name)],
    });

    const categoryMap = new Map<number, CategoryWithProducts>();

    allProducts.forEach(product => {
        if (Array.isArray(product.categories)) {
            product.categories.forEach((cat: { id: number; name: string }) => {
                if (!categoryMap.has(cat.id)) {
                    categoryMap.set(cat.id, {
                        id: cat.id,
                        name: cat.name,
                        products: []
                    });
                }
                
                const categoryEntry = categoryMap.get(cat.id)!;
                categoryEntry.products.push({
                    id: product.id,
                    name: product.name,
                    sku: product.sku || '',
                });
            });
        }
    });

    // Sort categories by name
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}


export async function getUser(userId: string) {
    const currentUser = await requireUser();
    
    // Only admin can see other users detailed info, or the user themselves (handled by session mainly, but here restricted to admin for management)
    if (!currentUser.roles.includes('admin')) {
        throw new Error('Brak uprawnień.');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new Error('Użytkownik nie znaleziony');
    }

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
