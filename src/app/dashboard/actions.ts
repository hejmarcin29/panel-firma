'use server';

import { redirect } from 'next/navigation';

import { signOut } from '@/lib/auth/session';
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function logoutAction() {
	await signOut();
	redirect('/login');
}

export interface DashboardWidgetConfig {
    id: string;
    type: string;
}

export interface DashboardLayoutConfig {
    columns: {
        [key: string]: DashboardWidgetConfig[];
    };
}

export async function updateDashboardLayout(layout: DashboardLayoutConfig) {
    const user = await requireUser();
    
    await db.update(users)
        .set({ dashboardConfig: JSON.stringify(layout) })
        .where(eq(users.id, user.id));

    revalidatePath('/dashboard');
}
