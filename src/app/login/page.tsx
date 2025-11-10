import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/session';

import { LoginForm } from './_components/login-form';

export const metadata: Metadata = {
	title: 'Logowanie | Panel firmy',
	description: 'Zaloguj się aby zarządzać panelem dropshippingowym.',
};

export default async function LoginPage() {
	const user = await getCurrentUser();
	if (user) {
		redirect('/dashboard');
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader>
					<CardTitle className="text-center text-2xl font-semibold">Panel firmy</CardTitle>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
			</Card>
		</main>
	);
}
