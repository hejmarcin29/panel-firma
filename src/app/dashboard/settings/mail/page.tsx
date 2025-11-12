import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { getMailAccountSettings } from './actions';
import { MailSettingsForm } from '../_components/mail-settings-form';

export default async function MailSettingsPage() {
	const accounts = await getMailAccountSettings();

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold">Konfiguracja poczty</h1>
				<p className="text-sm text-muted-foreground">
					Dodaj lub edytuj skrzynki pocztowe uzywane do komunikacji z klientami.
				</p>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Jak zacząć?</CardTitle>
					<CardDescription>Do synchronizacji potrzebujemy dostepu IMAP/SMTP. W razie watpliwosci skontaktuj sie z administratorem poczty.</CardDescription>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground space-y-2">
					<p>
						Wprowadz dane serwera IMAP oraz SMTP i nadaj skrzynce opisowa nazwe. Po zapisaniu wykonamy pierwsza synchronizacje w tle.
					</p>
					<p>
						Jesli Twoj dostawca wymaga specjalnych tokenow (np. OAuth Gmaila), dodaj je w polu hasla w formie wygenerowanego hasla aplikacji.
					</p>
					<Button asChild variant="link" className="px-0">
						<Link href="/dashboard/mail">Przejdz do skrzynek</Link>
					</Button>
				</CardContent>
			</Card>

			<MailSettingsForm accounts={accounts} />
		</div>
	);
}
