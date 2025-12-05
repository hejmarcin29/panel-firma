'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc, not } from 'drizzle-orm';
import { hash } from 'bcryptjs';

import { db } from '@/lib/db';
import { users, type UserRole } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';

const TEAM_SETTINGS_PATH = '/dashboard/settings/team';

export async function getTeamMembers() {
    await requireUser();
    
    return db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function createEmployee({
    name,
    email,
    password,
    role
}: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}) {
    const currentUser = await requireUser();
    
    if (currentUser.role !== 'admin') {
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
        role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    revalidatePath(TEAM_SETTINGS_PATH);
}

export async function toggleEmployeeStatus(userId: string, isActive: boolean) {
    const currentUser = await requireUser();
    
    if (currentUser.role !== 'admin') {
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

export async function updateEmployeeRole(userId: string, role: UserRole) {
    const currentUser = await requireUser();
    
    if (currentUser.role !== 'admin') {
        throw new Error('Brak uprawnień.');
    }

    if (currentUser.id === userId) {
        throw new Error('Nie możesz zmienić roli własnego konta.');
    }

    await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId));

    revalidatePath(TEAM_SETTINGS_PATH);
}
