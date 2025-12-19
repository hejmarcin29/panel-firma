import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Poczta',
};

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

import { fetchMailAccounts, fetchMailFolders, fetchMailMessages } from './queries';
import type { MailMessageSummary } from './types';
import { MailClient } from './_components/mail-client';

export default async function MailPage() {
	const accounts = await fetchMailAccounts();

	if (accounts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Poczta firmowa</CardTitle>
					<CardDescription>Skonfiguruj pierwsze konto, aby zarzadzac korespondencja w jednym miejscu.</CardDescription>
				</CardHeader>
				<CardContent>
					<Empty className="border border-dashed">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<span className="text-2xl">📫</span>
							</EmptyMedia>
							<EmptyTitle>Brak skonfigurowanych skrzynek</EmptyTitle>
							<EmptyDescription>Dodaj konto pocztowe w ustawieniach, aby wyswietlic wiadomosci.</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button asChild>
								<Link href="/dashboard/settings/mail">Przejdz do konfiguracji</Link>
							</Button>
						</EmptyContent>
					</Empty>
				</CardContent>
			</Card>
		);
	}

	const initialAccount = accounts[0];
	const initialFolders = await fetchMailFolders(initialAccount.id);

	let initialMessages: MailMessageSummary[] = [];
	const initialFolderId = initialFolders[0]?.id ?? null;

	if (initialFolderId) {
		initialMessages = await fetchMailMessages({ accountId: initialAccount.id, folderId: initialFolderId, limit: 50 });
	}

	return <MailClient accounts={accounts} initialFolders={initialFolders} initialMessages={initialMessages} />;
}
