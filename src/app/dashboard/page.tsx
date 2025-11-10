import { requireUser } from '@/lib/auth/session';

export default async function DashboardPage() {
	const user = await requireUser();

	return (
		<section className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold tracking-tight">Witaj, {user.name ?? user.email}</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Tutaj wkrótce pojawi się dashboard zarządzania dropshippingiem.
				</p>
			</div>
			<div className="rounded-lg border bg-background p-6 shadow-sm">
				<h2 className="text-xl font-medium">Następne kroki</h2>
				<ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
					<li>Dodaj widoki zamówień oraz timeline statusów.</li>
					<li>Skonfiguruj integracje z WooCommerce, wfirma oraz Alior Bank.</li>
					<li>Przygotuj moduł powiadomień e-mail dla klientów i hurtowni.</li>
				</ul>
			</div>
		</section>
	);
}
