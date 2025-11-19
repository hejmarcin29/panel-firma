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
	initialAccessKey: string;
	initialSecretKey: string;
};

type ResultState = {
	type: 'success' | 'error';
	message: string;
} | null;

export function WfirmaConfigForm({ initialTenant, initialAppKey, initialAccessKey, initialSecretKey }: Props) {
	const router = useRouter();
	const [tenant, setTenant] = useState(initialTenant);
	const [appKey, setAppKey] = useState(initialAppKey);
	const [accessKey, setAccessKey] = useState(initialAccessKey);
	const [secretKey, setSecretKey] = useState(initialSecretKey);
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
		setAccessKey(initialAccessKey);
	}, [initialAccessKey]);

	useEffect(() => {
		setSecretKey(initialSecretKey);
	}, [initialSecretKey]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const nextTenant = String(formData.get('wfirma-tenant') ?? '').trim();
		const nextAppKey = String(formData.get('wfirma-app-key') ?? '').trim();
		const nextAccessKey = String(formData.get('wfirma-access-key') ?? '').trim();
		const nextSecretKey = String(formData.get('wfirma-secret-key') ?? '').trim();

		startTransition(() => {
			updateWfirmaConfig({ tenant: nextTenant, appKey: nextAppKey, accessKey: nextAccessKey, secretKey: nextSecretKey })
				.then(() => {
					setResult({ type: 'success', message: 'Konfiguracja wFirma zostala zapisana.' });
					setTenant(nextTenant);
					setAppKey(nextAppKey);
					setAccessKey(nextAccessKey);
					setSecretKey(nextSecretKey);
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
		setAccessKey(initialAccessKey);
		setSecretKey(initialSecretKey);
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
						placeholder="Klucz aplikacji (appKey)"
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
						placeholder="Klucz API (accessKey)"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="wfirma-secret-key">Secret key</Label>
					<Input
						id="wfirma-secret-key"
						name="wfirma-secret-key"
						type="password"
						autoComplete="off"
						spellCheck={false}
						value={secretKey}
						onChange={(event) => setSecretKey(event.target.value)}
						disabled={isPending}
						placeholder="Sekretny klucz API (secretKey)"
					/>
				</div>
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
							accessKey === initialAccessKey &&
							secretKey === initialSecretKey
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
