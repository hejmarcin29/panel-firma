import { Separator } from '@/components/ui/separator';

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Integracje</h3>
                <p className="text-sm text-muted-foreground">
                    Zarządzaj połączeniami z zewnętrznymi serwisami.
                </p>
            </div>
            <Separator />
            
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <p className="text-sm text-muted-foreground">
                    Konfiguracja Tpay została przeniesiona do zakładki 
                    <a href="/dashboard/settings/shop" className="ml-1 font-medium text-foreground underline hover:no-underline">
                        Sklep
                    </a>
                    .
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Tu w przyszłości pojawią się inne integracje (np. Google Calendar, SMS API).
                </p>
            </div>
        </div>
    );
}
