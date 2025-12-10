import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/session';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

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

    const systemLogoUrl = await getAppSetting(appSettingKeys.systemLogoUrl);
    const logoSrc = systemLogoUrl || "/logo.png";

	return (
		<main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader className="flex flex-col items-center gap-4">
                    <div className="relative h-16 w-16">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
                    </div>
					<CardTitle className="text-center text-2xl font-semibold">Panel firmy</CardTitle>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
			</Card>
		</main>
	);
}
