'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { updateR2Config } from '../actions';

type Props = {
	initialAccountId: string;
	initialAccessKeyId: string;
	initialSecretAccessKey: string;
	initialBucketName: string;
	initialEndpoint: string;
	initialApiToken: string;
};

type ResultState = {
	type: 'success' | 'error';
	message: string;
} | null;

export function R2ConfigForm({
	initialAccountId,
	initialAccessKeyId,
	initialSecretAccessKey,
	initialBucketName,
	initialEndpoint,
	initialApiToken,
}: Props) {
	const router = useRouter();
	const [accountId, setAccountId] = useState(initialAccountId);
	const [accessKeyId, setAccessKeyId] = useState(initialAccessKeyId);
	const [secretAccessKey, setSecretAccessKey] = useState(initialSecretAccessKey);
	const [bucketName, setBucketName] = useState(initialBucketName);
	const [endpoint, setEndpoint] = useState(initialEndpoint);
	const [apiToken, setApiToken] = useState(initialApiToken);
	const [result, setResult] = useState<ResultState>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setAccountId(initialAccountId);
	}, [initialAccountId]);

	useEffect(() => {
		setAccessKeyId(initialAccessKeyId);
	}, [initialAccessKeyId]);

	useEffect(() => {
		setSecretAccessKey(initialSecretAccessKey);
	}, [initialSecretAccessKey]);

	useEffect(() => {
		setBucketName(initialBucketName);
	}, [initialBucketName]);

	useEffect(() => {
		setEndpoint(initialEndpoint);
	}, [initialEndpoint]);

	useEffect(() => {
		setApiToken(initialApiToken);
	}, [initialApiToken]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		const nextAccountId = String(formData.get('r2-account-id') ?? '').trim();
		const nextAccessKeyId = String(formData.get('r2-access-key-id') ?? '').trim();
		const nextSecretAccessKey = String(formData.get('r2-secret-access-key') ?? '').trim();
		const nextBucketName = String(formData.get('r2-bucket-name') ?? '').trim();
		const nextEndpoint = String(formData.get('r2-endpoint') ?? '').trim();
		const nextApiToken = String(formData.get('r2-api-token') ?? '').trim();

		startTransition(() => {
			updateR2Config({
				accountId: nextAccountId,
				accessKeyId: nextAccessKeyId,
				secretAccessKey: nextSecretAccessKey,
				bucketName: nextBucketName,
				endpoint: nextEndpoint,
				apiToken: nextApiToken,
			})
				.then(() => {
					setResult({ type: 'success', message: 'Konfiguracja Cloudflare R2 zostala zapisana.' });
					setAccountId(nextAccountId);
					setAccessKeyId(nextAccessKeyId);
					setSecretAccessKey(nextSecretAccessKey);
					setBucketName(nextBucketName);
					setEndpoint(nextEndpoint);
					setApiToken(nextApiToken);
					router.refresh();
				})
				.catch((error) => {
					const message = error instanceof Error ? error.message : 'Nie udalo sie zapisac konfiguracji R2.';
					setResult({ type: 'error', message });
				});
		});
	};

	const handleReset = () => {
		setAccountId(initialAccountId);
		setAccessKeyId(initialAccessKeyId);
		setSecretAccessKey(initialSecretAccessKey);
		setBucketName(initialBucketName);
		setEndpoint(initialEndpoint);
		setApiToken(initialApiToken);
		setResult(null);
	};

	const isPristine =
		accountId === initialAccountId &&
		accessKeyId === initialAccessKeyId &&
		secretAccessKey === initialSecretAccessKey &&
		bucketName === initialBucketName &&
		endpoint === initialEndpoint &&
		apiToken === initialApiToken;

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="r2-account-id">Account ID</Label>
					<Input
						id="r2-account-id"
						name="r2-account-id"
						type="text"
						autoComplete="off"
						spellCheck={false}
						value={accountId}
						onChange={(event) => setAccountId(event.target.value)}
						disabled={isPending}
						placeholder="np. 85fcbaaf0..."
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="r2-access-key-id">Access Key ID</Label>
					<Input
						id="r2-access-key-id"
						name="r2-access-key-id"
						type="text"
						autoComplete="off"
						spellCheck={false}
						value={accessKeyId}
						onChange={(event) => setAccessKeyId(event.target.value)}
						disabled={isPending}
						placeholder="Wklej identyfikator klucza"
					/>
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="r2-secret-access-key">Secret Access Key</Label>
					<Input
						id="r2-secret-access-key"
						name="r2-secret-access-key"
						type="password"
						autoComplete="off"
						spellCheck={false}
						value={secretAccessKey}
						onChange={(event) => setSecretAccessKey(event.target.value)}
						disabled={isPending}
						placeholder="Sekretny klucz dostepowy"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="r2-bucket-name">Bucket</Label>
					<Input
						id="r2-bucket-name"
						name="r2-bucket-name"
						type="text"
						autoComplete="off"
						spellCheck={false}
						value={bucketName}
						onChange={(event) => setBucketName(event.target.value)}
						disabled={isPending}
						placeholder="Nazwa bucketa"
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="r2-endpoint">Endpoint (S3)</Label>
				<Input
					id="r2-endpoint"
					name="r2-endpoint"
					type="url"
					autoComplete="off"
					spellCheck={false}
					value={endpoint}
					onChange={(event) => setEndpoint(event.target.value)}
					disabled={isPending}
					placeholder="https://...r2.cloudflarestorage.com"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="r2-api-token">API Token (opcjonalnie)</Label>
				<Input
					id="r2-api-token"
					name="r2-api-token"
					type="password"
					autoComplete="off"
					spellCheck={false}
					value={apiToken}
					onChange={(event) => setApiToken(event.target.value)}
					disabled={isPending}
					placeholder="Token do API Cloudflare"
				/>
				<p className="text-xs text-muted-foreground">
					Token wykorzystasz przy wywolaniach REST do Cloudflare (nie jest wymagany dla S3 SDK).
				</p>
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
					disabled={isPending || isPristine}
				>
					Przywroc
				</Button>
			</div>
		</form>
	);
}
