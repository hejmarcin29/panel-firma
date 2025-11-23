import { Suspense } from 'react';

import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listMontageObjects, type GalleryObject } from '@/lib/r2/storage';
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

function formatFileCount(count: number): string {
	if (count === 1) {
		return '1 plik';
	}

	if (count >= 2 && count <= 4) {
		return `${count} pliki`;
	}

	return `${count} plików`;
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

type GalleryCategory = {
	key: string;
	label: string;
	items: GalleryObject[];
	latest: Date | null;
	latestTimestamp: number;
	fullPath: string;
};

function groupByCategory(objects: GalleryObject[]): GalleryCategory[] {
	const grouped = new Map<string, GalleryCategory>();

	for (const object of objects) {
		const segments = object.folder.split('/').filter(Boolean);
		const categoryKey = segments[segments.length - 1] ?? 'inne';
		const label = formatCategoryLabel(categoryKey);
		const lastModifiedTimestamp = object.lastModified ? object.lastModified.getTime() : 0;
		const existing = grouped.get(categoryKey);

		if (existing) {
			existing.items.push(object);
			if (lastModifiedTimestamp > existing.latestTimestamp) {
				existing.latestTimestamp = lastModifiedTimestamp;
				existing.latest = object.lastModified ?? existing.latest;
			}
		} else {
			grouped.set(categoryKey, {
				key: categoryKey,
				label,
				items: [object],
				latest: object.lastModified ?? null,
				latestTimestamp: lastModifiedTimestamp,
				fullPath: object.folder,
			});
		}
	}

	const categories = Array.from(grouped.values());

	categories.sort((a, b) => {
		if (b.latestTimestamp !== a.latestTimestamp) {
			return b.latestTimestamp - a.latestTimestamp;
		}

		return a.label.localeCompare(b.label, 'pl', { sensitivity: 'base' });
	});

	return categories;
}

type GalleryContentProps = {
	selectedFolderKey?: string;
};

async function GalleryContent({ selectedFolderKey }: GalleryContentProps) {
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

	if (!selectedFolderKey) {
		return (
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{categories.map((category) => (
					<Card key={category.key} className="transition-colors hover:border-primary/70">
						<CardHeader className="space-y-1 px-4 py-3">
							<CardTitle className="text-base">{category.label}</CardTitle>
							<CardDescription className="text-xs text-muted-foreground">
								{formatFileCount(category.items.length)}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 px-4 pb-4 pt-0">
							<div className="flex items-center justify-between text-[11px] text-muted-foreground">
								<span>Ostatnia aktualizacja</span>
								<span>{formatDate(category.latest)}</span>
							</div>
							<Link
								href={`?folder=${encodeURIComponent(category.key)}`}
								className="inline-flex items-center text-xs font-medium text-primary hover:underline"
							>
								Otwórz folder
							</Link>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const selectedCategory = categories.find((category) => category.key === selectedFolderKey);

	if (!selectedCategory) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Nie znaleziono folderu</CardTitle>
					<CardDescription>
						Wybrany folder nie istnieje. Wróć do listy i wybierz inny katalog z montaży.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Link href="/dashboard/montaze/galeria" className="text-xs font-medium text-primary hover:underline">
						Powrót do listy folderów
					</Link>
				</CardContent>
			</Card>
		);
	}

	const items = [...selectedCategory.items].sort((a, b) => {
		const timeA = a.lastModified ? a.lastModified.getTime() : 0;
		const timeB = b.lastModified ? b.lastModified.getTime() : 0;
		return timeB - timeA;
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Link href="/dashboard/montaze/galeria" className="text-xs font-medium text-primary hover:underline">
					← Powrót do folderów
				</Link>
				<span className="text-[11px] text-muted-foreground">{formatFileCount(items.length)}</span>
			</div>
			<header className="space-y-1">
				<h2 className="text-lg font-semibold text-foreground">{selectedCategory.label}</h2>
				<p className="text-xs text-muted-foreground">
					Ostatnia aktualizacja: {formatDate(selectedCategory.latest)}
				</p>
			</header>
			<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{items.map((object) => {
					const isImage = isImageKey(object.name);

					return (
						<Card key={object.key} className="overflow-hidden group transition-all hover:shadow-md">
							{isImage ? (
								<div className="relative aspect-video w-full bg-muted overflow-hidden">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={object.previewUrl}
										alt={object.name}
										loading="lazy"
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								</div>
							) : (
								<div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
									<span className="font-medium">{object.name.split('.').pop()?.toUpperCase() || 'PLIK'}</span>
								</div>
							)}
							<CardContent className="space-y-2 p-4">
								<div className="space-y-1">
									<h3 className="text-sm font-medium text-foreground truncate" title={object.name}>
										{object.name}
									</h3>
								</div>
								<div className="flex flex-wrap justify-between text-xs text-muted-foreground">
									<span>{formatBytes(object.size)}</span>
									<span>{formatDate(object.lastModified)}</span>
								</div>
								<div className="flex items-center gap-3 text-xs pt-2">
									<Link
										href={object.previewUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-primary hover:underline"
									>
										Podgląd
									</Link>
									<Link
										href={object.url}
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-primary hover:underline"
									>
										Pobierz
									</Link>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}

type MontageGalleryPageProps = {
	searchParams?: {
		folder?: string;
	};
};

export default function MontageGalleryPage({ searchParams }: MontageGalleryPageProps) {
	const folderParam = typeof searchParams?.folder === 'string' ? searchParams.folder : undefined;

	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold">Galeria montaży</h1>
				<p className="text-sm text-muted-foreground">
					Przeglądaj wszystkie pliki przesłane do Cloudflare R2 podczas obsługi montaży. Pliki są grupowane według klienta.
				</p>
			</header>
			<Suspense
				fallback={
					<Card>
						<CardHeader>
							<CardTitle>Ładowanie galerii</CardTitle>
							<CardDescription>Odbieramy listę plików z R2...</CardDescription>
						</CardHeader>
					</Card>
				}
			>
				<GalleryContent selectedFolderKey={folderParam} />
			</Suspense>
		</div>
	);
}
