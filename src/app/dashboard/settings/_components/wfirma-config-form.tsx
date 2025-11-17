'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { updateWfirmaConfig } from '../actions';

type Props = {
	initialLogin: string;
	initialApiKey: string;
	initialTenant: string;
};

type ResultState = {
	type: 'success' | 'error';
	message: string;
} | null;

export function WfirmaConfigForm({ initialLogin, initialApiKey, initialTenant }: Props) {
	const router = useRouter();
	const [login, setLogin] = useState(initialLogin);
	const [apiKey, setApiKey] = useState(initialApiKey);
	const [tenant, setTenant] = useState(initialTenant);
	const [result, setResult] = useState<ResultState>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setLogin(initialLogin);
	}, [initialLogin]);

	useEffect(() => {
		setApiKey(initialApiKey);
	}, [initialApiKey]);

	useEffect(() => {
		setTenant(initialTenant);
	}, [initialTenant]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const nextLogin = String(formData.get('wfirma-login') ?? '').trim();
		const nextApiKey = String(formData.get('wfirma-api-key') ?? '').trim();
		const nextTenant = String(formData.get('wfirma-tenant') ?? '').trim();

		startTransition(() => {
			updateWfirmaConfig({ login: nextLogin, apiKey: nextApiKey, tenant: nextTenant })
				.then(() => {
					setResult({ type: 'success', message: 'Konfiguracja wFirma zostala zapisana.' });
					setLogin(nextLogin);
					setApiKey(nextApiKey);
					setTenant(nextTenant);
					router.refresh();
				})
				.catch((error) => {
					const message = error instanceof Error ? error.message : 'Nie udalo sie zapisac konfiguracji wFirma.';
					setResult({ type: 'error', message });
				});
		});
	};

	const handleReset = () => {
		setLogin(initialLogin);
		setApiKey(initialApiKey);
		setTenant(initialTenant);
		setResult(null);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="wfirma-login">Login lub e-mail</Label>
					<Input
						id="wfirma-login"
						name="wfirma-login"
						type="text"
						autoComplete="off"
						spellCheck={false}
						value={login}
						onChange={(event) => setLogin(event.target.value)}
						disabled={isPending}
						placeholder="np. owner@example.com"
					/>
				</div>
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
			</div>
			<div className="space-y-2">
				<Label htmlFor="wfirma-api-key">Klucz API</Label>
				<Input
					id="wfirma-api-key"
					name="wfirma-api-key"
					type="password"
					autoComplete="off"
					spellCheck={false}
					value={apiKey}
					onChange={(event) => setApiKey(event.target.value)}
					disabled={isPending}
					placeholder="Wklej klucz API z panelu wFirma"
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
					disabled={isPending || (login === initialLogin && apiKey === initialApiKey && tenant === initialTenant)}
				>
					Przywroc
				</Button>
			</div>
		</form>
	);
}
