import { Suspense } from 'react';
import { CustomersView } from './_components/customers-view';
import { getCustomers } from './actions';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
	const [initialCustomers, portalEnabled] = await Promise.all([
        getCustomers(),
        getAppSetting(appSettingKeys.portalEnabled)
    ]);

	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Baza Klientów</h2>
			</div>
			<div className="hidden md:block text-muted-foreground">
				Przeglądaj i zarządzaj bazą swoich klientów. Wyszukuj po nazwie, emailu lub telefonie.
			</div>
			
			<Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
				<CustomersView initialCustomers={initialCustomers} portalEnabled={portalEnabled === 'true'} />
			</Suspense>
		</div>
	);
}
