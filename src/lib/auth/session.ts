'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { sessions, users, type UserRole } from '@/lib/db/schema';

const SESSION_COOKIE = 'panel_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type CookieOptions = {
	maxAge?: number;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: 'lax' | 'strict' | 'none';
	path?: string;
};

type MutableCookieStore = {
	get: (name: string) => { value: string } | undefined;
	set: (name: string, value: string, options?: CookieOptions) => void;
	delete: (name: string) => void;
};

async function getCookieStore(): Promise<MutableCookieStore> {
	return (await cookies()) as unknown as MutableCookieStore;
}

const cookieConfig: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax',
	path: '/',
};

type SessionRecord = {
	id: string;
	expiresAt: number;
	user: {
		id: string;
		email: string;
		name: string | null;
		role: UserRole;
	};
};

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

async function findSession(token: string): Promise<SessionRecord | null> {
	const tokenHash = hashToken(token);

	const [row] = await db
		.select({
			sessionId: sessions.id,
			expiresAt: sessions.expiresAt,
			userId: users.id,
			email: users.email,
			name: users.name,
			role: users.role,
		})
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.tokenHash, tokenHash))
		.limit(1);

	if (!row) {
		return null;
	}

	return {
		id: row.sessionId,
		expiresAt: row.expiresAt ?? 0,
		user: {
			id: row.userId,
			email: row.email,
			name: row.name,
			role: row.role,
		},
	};
}

async function removeSessionByToken(token: string) {
	const tokenHash = hashToken(token);
	await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function createSession(userId: string) {
	const token = randomBytes(32).toString('hex');
	const tokenHash = hashToken(token);
	const expiresAt = Date.now() + SESSION_TTL_MS;

	await db.insert(sessions).values({
		id: randomUUID(),
		userId,
		tokenHash,
		expiresAt,
	});

	const cookieStore = await getCookieStore();
	cookieStore.set(SESSION_COOKIE, token, {
		...cookieConfig,
		maxAge: SESSION_TTL_MS / 1000,
	});
}

export async function getCurrentSession(): Promise<SessionRecord | null> {
	const cookieStore = await getCookieStore();
	const token = cookieStore.get(SESSION_COOKIE)?.value as string | undefined;
	if (!token) {
		return null;
	}

	const session = await findSession(token);

	if (!session) {
		cookieStore.delete(SESSION_COOKIE);
		return null;
	}

	if (session.expiresAt < Date.now()) {
		await removeSessionByToken(token);
		cookieStore.delete(SESSION_COOKIE);
		return null;
	}

	return session;
}

export async function getCurrentUser() {
	const session = await getCurrentSession();
	return session?.user ?? null;
}

export async function requireUser() {
	const user = await getCurrentUser();
	if (!user) {
		redirect('/login');
	}
	return user;
}

export async function signOut() {
	const cookieStore = await getCookieStore();
	const token = cookieStore.get(SESSION_COOKIE)?.value as string | undefined;
	if (token) {
		await removeSessionByToken(token);
	}
	cookieStore.delete(SESSION_COOKIE);
}
