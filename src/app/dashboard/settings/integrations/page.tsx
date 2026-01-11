import { getTpayConfig, updateTpayConfig, TpayConfig } from '../shop/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function IntegrationsPage() {
    const tpayConfig = await getTpayConfig();

    async function saveTpayAction(formData: FormData) {
        'use server';
        
        const newConfig: TpayConfig = {
            clientId: formData.get('clientId') as string,
            clientSecret: formData.get('clientSecret') as string,
            isSandbox: formData.get('isSandbox') === 'on',
        };

        await updateTpayConfig(newConfig);
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Integracje</h3>
                <p className="text-sm text-muted-foreground">
                    Zarządzaj połączeniami z zewnętrznymi serwisami.
                </p>
            </div>
            <Separator />
            
            <form action={saveTpayAction}>
                <Card>
                    <CardHeader>
                        <CardTitle>Tpay (Płatności Online)</CardTitle>
                        <CardDescription>Konfiguracja bramki płatności dla sklepu.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Tryb Sandbox (Testowy)</Label>
                                <p className="text-sm text-muted-foreground">
                                    Włącz, aby testować płatności bez obciążania konta.
                                </p>
                            </div>
                            <Switch 
                                name="isSandbox" 
                                defaultChecked={tpayConfig.isSandbox} 
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clientId">Client ID</Label>
                            <Input 
                                id="clientId" 
                                name="clientId" 
                                type="text" 
                                defaultValue={tpayConfig.clientId} 
                                placeholder="1010..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clientSecret">Client Secret</Label>
                            <Input 
                                id="clientSecret" 
                                name="clientSecret" 
                                type="password" 
                                defaultValue={tpayConfig.clientSecret} 
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Zapisz ustawienia Tpay</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
