import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/session';

import { RegisterForm } from './_components/register-form';

export const metadata: Metadata = {
	title: 'Rejestracja | Panel firmy',
	description: 'Utwórz konto aby rozpocząć pracę w panelu.',
};

export default async function RegisterPage() {
	const user = await getCurrentUser();
	if (user) {
		redirect('/dashboard');
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader>
					<CardTitle className="text-center text-2xl font-semibold">Utwórz konto</CardTitle>
				</CardHeader>
				<CardContent>
					<RegisterForm />
				</CardContent>
			</Card>
		</main>
	);
}
