import { Suspense } from 'react';
import { R2Browser } from './_components/r2-browser';

export default function R2Page() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Przeglądarka plików R2</h1>
					<p className="text-sm text-muted-foreground">
						Przeglądaj wszystkie pliki w chmurze (Klienci, Montaże, Dokumenty).
					</p>
				</div>
			</div>

			<Suspense fallback={<div>Ładowanie przeglądarki...</div>}>
				<R2Browser />
			</Suspense>
		</div>
	);
}
