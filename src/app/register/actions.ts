'use server';

import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

const registerSchema = z
	.object({
		email: z.string().min(1, 'Podaj e-mail').email('Nieprawidłowy e-mail').transform((value) => value.toLowerCase()),
		name: z.string().trim().min(1, 'Podaj imię i nazwisko'),
		password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
		confirmPassword: z.string().min(1, 'Powtórz hasło'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Hasła nie są identyczne',
		path: ['confirmPassword'],
	});

export type RegisterFormState = {
	errors?: string;
};

export async function registerAction(_: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
	const parseResult = registerSchema.safeParse({
		email: formData.get('email'),
		name: formData.get('name'),
		password: formData.get('password'),
		confirmPassword: formData.get('confirmPassword'),
	});

	if (!parseResult.success) {
		return { errors: parseResult.error.issues[0]?.message ?? 'Nieprawidłowe dane' };
	}

	const { email, name, password } = parseResult.data;

	const [{ totalUsers }] = await db
		.select({ totalUsers: sql<number>`count(*)` })
		.from(users);

	if (totalUsers >= 1) {
		return { errors: 'Rejestracja jest tymczasowo niedostępna. Skontaktuj się z administratorem.' };
	}

	const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
	if (existingUser) {
		return { errors: 'Użytkownik o podanym e-mailu już istnieje' };
	}

	const passwordHash = await hashPassword(password);

	const userId = randomUUID();

	await db.insert(users).values({
		id: userId,
		email,
		name,
		passwordHash,
		roles: ['admin'],
	});

	await createSession(userId);

	redirect('/dashboard');
}
