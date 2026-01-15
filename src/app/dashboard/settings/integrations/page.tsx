import { Separator } from '@/components/ui/separator';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { InPostSettingsForm } from './_components/inpost-settings-form';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
    const [orgId, token, geowidgetToken, geowidgetConfig, sandbox] = await Promise.all([
        getAppSetting(appSettingKeys.inpostOrgId),
        getAppSetting(appSettingKeys.inpostToken),
        getAppSetting(appSettingKeys.inpostGeowidgetToken),
        getAppSetting(appSettingKeys.inpostGeowidgetConfig),
        getAppSetting(appSettingKeys.inpostSandbox),
    ]);

    const initialSettings = {
        orgId: orgId || '',
        token: token || '',
        geowidgetToken: geowidgetToken || '',
        geowidgetConfig: geowidgetConfig || '',
        sandbox: sandbox === 'true',
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Integracje</h3>
                <p className="text-sm text-muted-foreground">
                    Zarządzaj połączeniami z zewnętrznymi serwisami.
                </p>
            </div>
            <Separator />
            
            <div className="grid gap-6">
                <InPostSettingsForm initialSettings={initialSettings} />
            </div>

            <div className="flex h-[150px] flex-col items-center justify-center rounded-lg border border-dashed text-center mt-8">
                <p className="text-sm text-muted-foreground">
                    Inne integracje (np. Google Calendar, SMS API) pojawią się tutaj w przyszłości.
                </p>
            </div>
        </div>
    );
}
