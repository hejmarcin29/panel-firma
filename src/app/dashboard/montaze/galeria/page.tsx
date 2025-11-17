import { Suspense } from 'react';

import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listMontageObjects } from '@/lib/r2/storage';
import { tryGetR2Config } from '@/lib/r2/config';

function formatBytes(bytes: number): string {
	const thresholds = [
		{ unit: 'GB', value: 1024 ** 3 },
		{ unit: 'MB', value: 1024 ** 2 },
		{ unit: 'KB', value: 1024 },
	];

	for (const threshold of thresholds) {
		if (bytes >= threshold.value) {
			return `${(bytes / threshold.value).toFixed(1)} ${threshold.unit}`;
		}
	}

	return `${bytes} B`;
}

function formatDate(value: Date | null): string {
	if (!value) {
		return 'brak danych';
	}

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(value);
}

function isImageKey(key: string): boolean {
	return /\.(png|jpe?g|gif|bmp|webp|avif)$/i.test(key);
}

async function GalleryContent() {
	const config = await tryGetR2Config();

	if (!config) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Brak konfiguracji R2</CardTitle>
					<CardDescription>
						Uzupełnij konfigurację Cloudflare R2 w ustawieniach, aby wyświetlić galerię montaży.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const objects = await listMontageObjects();

	if (objects.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Brak załączników</CardTitle>
					<CardDescription>
						Dodaj pliki do montaży, aby zobaczyć je w galerii. Każdy plik trafia do katalogu przypisanego do klienta.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
			{objects.map((object) => {
				const isImage = isImageKey(object.name);

				return (
					<Card key={object.key} className="overflow-hidden">
						{isImage ? (
							<div className="relative h-56 w-full bg-muted">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={object.previewUrl}
									alt={object.name}
									loading="lazy"
									className="h-full w-full object-cover"
								/>
							</div>
						) : (
							<div className="flex h-56 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
								<span>{object.name}</span>
							</div>
						)}
						<CardContent className="space-y-2 p-4">
							<div className="space-y-1">
								<h3 className="text-sm font-semibold text-foreground">{object.name}</h3>
								<p className="text-xs text-muted-foreground">{object.folder}</p>
							</div>
							<div className="flex flex-wrap justify-between text-xs text-muted-foreground">
								<span>{formatBytes(object.size)}</span>
								<span>{formatDate(object.lastModified)}</span>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<Link
									href={object.previewUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									Podgląd
								</Link>
								<Link
									href={object.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									Pobierz
								</Link>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export default function MontageGalleryPage() {
	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold">Galeria montaży</h1>
				<p className="text-sm text-muted-foreground">
					Przeglądaj wszystkie pliki przesłane do Cloudflare R2 podczas obsługi montaży. Pliki są grupowane według klienta.
				</p>
			</header>
			<Suspense fallback={
				<Card>
					<CardHeader>
						<CardTitle>Ładowanie galerii</CardTitle>
						<CardDescription>Odbieramy listę plików z R2...</CardDescription>
					</CardHeader>
				</Card>
			}>
				<GalleryContent />
			</Suspense>
		</div>
	);
}
