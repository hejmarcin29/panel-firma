import { Suspense } from 'react';

import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listMontageObjects } from '@/lib/r2/storage';
import type { GalleryObject } from '@/lib/r2/storage';
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

function formatCategoryLabel(segment: string): string {
	const withoutSuffix = segment.replace(/_montaz$/i, '');
	const words = withoutSuffix
		.split(/[_-]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1));

	if (words.length === 0) {
		return 'Nieznany klient';
	}

	return words.join(' ');
}

function groupByCategory(objects: GalleryObject[]) {
	const grouped = new Map<
		string,
		{
			label: string;
			items: GalleryObject[];
			latest: number;
		}
	>();

	for (const object of objects) {
		const segments = object.folder.split('/').filter(Boolean);
		const categoryKey = segments[segments.length - 1] ?? 'inne';
		const label = formatCategoryLabel(categoryKey);
		const lastModified = object.lastModified ? object.lastModified.getTime() : 0;
		const existing = grouped.get(categoryKey);

		if (existing) {
			existing.items.push(object);
			existing.latest = Math.max(existing.latest, lastModified);
		} else {
			grouped.set(categoryKey, {
				label,
				items: [object],
				latest: lastModified,
			});
		}
	}

	return Array.from(grouped.entries())
		.map(([key, value]) => ({ key, ...value }))
		.sort((a, b) => {
			if (b.latest !== a.latest) {
				return b.latest - a.latest;
			}

			return a.label.localeCompare(b.label, 'pl', { sensitivity: 'base' });
		});
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

	const categories = groupByCategory(objects);

	return (
		<div className="space-y-6">
			{categories.map((category) => (
				<section key={category.key} className="space-y-3">
					<header className="flex items-baseline justify-between">
						<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							{category.label}
						</h2>
						<span className="text-[11px] text-muted-foreground">{category.items.length} plików</span>
					</header>
					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{category.items.map((object) => {
							const isImage = isImageKey(object.name);
							const relativeFolder = object.folder.split('/').slice(1, -1).join('/');

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
											{relativeFolder ? (
												<p className="text-[11px] uppercase text-muted-foreground">{relativeFolder}</p>
											) : null}
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
				</section>
			))}
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
