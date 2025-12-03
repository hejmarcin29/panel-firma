import { db } from '@/lib/db';
import { appSettings, integrationLogs } from '@/lib/db/schema';
import { desc, inArray } from 'drizzle-orm';
import { appSettingKeys } from '@/lib/settings';
import { WooSettingsForm } from './_components/woo-settings-form';
import { IntegrationLogs } from './_components/integration-logs';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

async function getSettings() {
	const keys = [
		appSettingKeys.wooConsumerKey,
		appSettingKeys.wooConsumerSecret,
		appSettingKeys.wooWebhookSecret,
		appSettingKeys.wooUrl,
	];

	const settings = await db
		.select()
		.from(appSettings)
		.where(inArray(appSettings.key, keys));

	const settingsMap = settings.reduce((acc, curr) => {
		acc[curr.key] = curr.value;
		return acc;
	}, {} as Record<string, string>);

	return {
		consumerKey: settingsMap[appSettingKeys.wooConsumerKey] || '',
		consumerSecret: settingsMap[appSettingKeys.wooConsumerSecret] || '',
		webhookSecret: settingsMap[appSettingKeys.wooWebhookSecret] || '',
		wooUrl: settingsMap[appSettingKeys.wooUrl] || '',
	};
}

async function getLogs() {
	return await db
		.select()
		.from(integrationLogs)
		.orderBy(desc(integrationLogs.createdAt))
		.limit(50);
}

export default async function IntegrationsPage() {
	await requireUser();
	const settings = await getSettings();
	const logs = await getLogs();

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Integracje</h2>
				<p className="text-muted-foreground">
					Zarządzaj połączeniami z zewnętrznymi systemami.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-6">
					<WooSettingsForm initialSettings={settings} />
                    
                    {/* Status Card could go here */}
                    <div className="p-4 border rounded-lg bg-card">
                        <h3 className="font-medium mb-2">Status Połączenia</h3>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${settings.consumerKey ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-sm text-muted-foreground">
                                {settings.consumerKey ? 'Skonfigurowano' : 'Brak konfiguracji'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Webhook URL: <code className="bg-muted px-1 py-0.5 rounded">/api/woocommerce/webhook</code>
                        </p>
                    </div>
				</div>
				
				<div>
					<IntegrationLogs logs={logs} />
				</div>
			</div>
		</div>
	);
}
