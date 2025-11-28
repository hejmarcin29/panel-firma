'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { logSystemEvent } from '@/lib/logging';

const loginSchema = z.object({
	email: z.string().min(1, 'Podaj e-mail').email('Nieprawidłowy e-mail').transform((value) => value.toLowerCase()),
	password: z.string().min(1, 'Podaj hasło'),
});

export type LoginFormState = {
	errors?: string;
};

export async function loginAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
	const parseResult = loginSchema.safeParse({
		email: formData.get('email'),
		password: formData.get('password'),
	});

	if (!parseResult.success) {
		return { errors: parseResult.error.issues[0]?.message ?? 'Nieprawidłowe dane' };
	}

	const { email, password } = parseResult.data;

	const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

	if (!user) {
		return { errors: 'Nieprawidłowe dane logowania' };
	}

	const isValid = await verifyPassword(password, user.passwordHash);

	if (!isValid) {
		return { errors: 'Nieprawidłowe dane logowania' };
	}

	await createSession(user.id);
	await logSystemEvent('login', 'Użytkownik zalogował się', user.id);

	redirect('/dashboard');
}
