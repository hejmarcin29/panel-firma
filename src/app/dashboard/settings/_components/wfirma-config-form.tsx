'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { testWfirmaConnection, updateWfirmaConfig } from '../actions';

type Props = {
	initialTenant: string;
	initialAppKey: string;
	initialAppSecret: string;
	initialAccessKey: string;
	initialAccessSecret: string;
};

type ResultState = {
	type: 'success' | 'error';
	message: string;
} | null;

export function WfirmaConfigForm({ initialTenant, initialAppKey, initialAppSecret, initialAccessKey, initialAccessSecret }: Props) {
	const router = useRouter();
	const [tenant, setTenant] = useState(initialTenant);
	const [appKey, setAppKey] = useState(initialAppKey);
	const [appSecret, setAppSecret] = useState(initialAppSecret);
	const [accessKey, setAccessKey] = useState(initialAccessKey);
	const [accessSecret, setAccessSecret] = useState(initialAccessSecret);
	const [result, setResult] = useState<ResultState>(null);
	const [isPending, startTransition] = useTransition();
	const [isTesting, startTesting] = useTransition();

	useEffect(() => {
		setTenant(initialTenant);
	}, [initialTenant]);

	useEffect(() => {
		setAppKey(initialAppKey);
	}, [initialAppKey]);

	useEffect(() => {
		setAppSecret(initialAppSecret);
	}, [initialAppSecret]);

	useEffect(() => {
		setAccessKey(initialAccessKey);
	}, [initialAccessKey]);

	useEffect(() => {
		setAccessSecret(initialAccessSecret);
	}, [initialAccessSecret]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const nextTenant = String(formData.get('wfirma-tenant') ?? '').trim();
		const nextAppKey = String(formData.get('wfirma-app-key') ?? '').trim();
		const nextAppSecret = String(formData.get('wfirma-app-secret') ?? '').trim();
		const nextAccessKey = String(formData.get('wfirma-access-key') ?? '').trim();
		const nextAccessSecret = String(formData.get('wfirma-access-secret') ?? '').trim();

		startTransition(() => {
			updateWfirmaConfig({ tenant: nextTenant, appKey: nextAppKey, appSecret: nextAppSecret, accessKey: nextAccessKey, accessSecret: nextAccessSecret })
				.then(() => {
					setResult({ type: 'success', message: 'Konfiguracja wFirma zostala zapisana.' });
					setTenant(nextTenant);
					setAppKey(nextAppKey);
					setAppSecret(nextAppSecret);
					setAccessKey(nextAccessKey);
					setAccessSecret(nextAccessSecret);
					router.refresh();
				})
				.catch((error) => {
					const message = error instanceof Error ? error.message : 'Nie udalo sie zapisac konfiguracji wFirma.';
					setResult({ type: 'error', message });
				});
		});
	};

	const handleReset = () => {
		setTenant(initialTenant);
		setAppKey(initialAppKey);
		setAppSecret(initialAppSecret);
		setAccessKey(initialAccessKey);
		setAccessSecret(initialAccessSecret);
		setResult(null);
	};

	const handleTest = () => {
		startTesting(() => {
			testWfirmaConnection()
				.then((message) => {
					setResult({ type: 'success', message });
				})
				.catch((error) => {
					const message = error instanceof Error ? error.message : 'Nie udalo sie przetestowac polaczenia.';
					setResult({ type: 'error', message });
				});
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="wfirma-tenant">Tenant (subdomena)</Label>
					<Input
						id="wfirma-tenant"
						name="wfirma-tenant"
						type="text"
						autoComplete="off"
						spellCheck={false}
						value={tenant}
						onChange={(event) => setTenant(event.target.value)}
						disabled={isPending}
						placeholder="np. nazwa"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="wfirma-app-key">App key</Label>
					<Input
						id="wfirma-app-key"
						name="wfirma-app-key"
						type="text"
						autoComplete="off"
						spellCheck={false}
						value={appKey}
						onChange={(event) => setAppKey(event.target.value)}
						disabled={isPending}
						placeholder="Wklej klucz aplikacji"
					/>
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="wfirma-app-secret">Secret key</Label>
					<Input
						id="wfirma-app-secret"
						name="wfirma-app-secret"
						type="password"
						autoComplete="off"
						spellCheck={false}
						value={appSecret}
						onChange={(event) => setAppSecret(event.target.value)}
						disabled={isPending}
						placeholder="Sekretny klucz aplikacji"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="wfirma-access-key">Access key</Label>
					<Input
						id="wfirma-access-key"
						name="wfirma-access-key"
						type="text"
						autoComplete="off"
						spellCheck={false}
						value={accessKey}
						onChange={(event) => setAccessKey(event.target.value)}
						disabled={isPending}
						placeholder="Klucz dostepowy"
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="wfirma-access-secret">Access secret</Label>
				<Input
					id="wfirma-access-secret"
					name="wfirma-access-secret"
					type="password"
					autoComplete="off"
					spellCheck={false}
					value={accessSecret}
					onChange={(event) => setAccessSecret(event.target.value)}
					disabled={isPending}
					placeholder="Sekretny klucz dostepowy"
				/>
			</div>
			{result && (
				<p className={result.type === 'error' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
					{result.message}
				</p>
			)}
			<div className="flex flex-wrap gap-2">
				<Button type="submit" disabled={isPending}>
					{isPending ? 'Zapisuje...' : 'Zapisz ustawienia'}
				</Button>
				<Button
					type="button"
					variant="secondary"
					onClick={handleReset}
					disabled={
						isPending ||
						(
							tenant === initialTenant &&
							appKey === initialAppKey &&
							appSecret === initialAppSecret &&
							accessKey === initialAccessKey &&
							accessSecret === initialAccessSecret
						)
					}
				>
					Przywroc
				</Button>
				<Button type="button" variant="outline" onClick={handleTest} disabled={isPending || isTesting}>
					{isTesting ? 'Sprawdzanie...' : 'Sprawdz polaczenie'}
				</Button>
			</div>
		</form>
	);
}
