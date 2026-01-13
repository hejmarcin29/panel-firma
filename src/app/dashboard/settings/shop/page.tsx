import { getShopConfig, updateShopConfig, getTpayConfig, updateTpayConfig, ShopConfig, TpayConfig } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function ShopSettingsPage() {
    const config = await getShopConfig();
    const tpayConfig = await getTpayConfig();

    async function saveAction(formData: FormData) {
        'use server';
        
        // Save Shop Config
        const newShopConfig: ShopConfig = {
            isShopEnabled: formData.get('isShopEnabled') === 'on',
            samplePrice: Math.round(parseFloat(formData.get('samplePrice') as string) * 100), // convert to grosze
            sampleShippingCost: Math.round(parseFloat(formData.get('sampleShippingCost') as string) * 100), // convert to grosze
            proformaBankName: formData.get('proformaBankName') as string,
            proformaBankAccount: formData.get('proformaBankAccount') as string,
        };

        // Save Tpay Config
        const newTpayConfig: TpayConfig = {
            clientId: formData.get('tpayClientId') as string,
            clientSecret: formData.get('tpayClientSecret') as string,
            isSandbox: formData.get('tpayIsSandbox') === 'on',
        };

        await updateShopConfig(newShopConfig);
        await updateTpayConfig(newTpayConfig);
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Konfiguracja Sklepu</h3>
                <p className="text-sm text-muted-foreground">
                    Zarządzaj ustawieniami handlowymi i płatnościami.
                </p>
            </div>
            <Separator />
            
            <form action={saveAction}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Główne Ustawienia</CardTitle>
                            <CardDescription>Steruj dostępnością i parametrami cenowymi.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Włącz Sklep</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Jeśli wyłączone, strona /sklep będzie pokazywać przerwę techniczną.
                                    </p>
                                </div>
                                <Switch 
                                    name="isShopEnabled" 
                                    defaultChecked={config.isShopEnabled} 
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="samplePrice">Cena za próbkę (PLN brutto)</Label>
                                    <Input 
                                        id="samplePrice" 
                                        name="samplePrice" 
                                        type="number" 
                                        step="0.01" 
                                        defaultValue={(config.samplePrice / 100).toFixed(2)} 
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sampleShippingCost">Koszt wysyłki próbek (PLN brutto)</Label>
                                    <Input 
                                        id="sampleShippingCost" 
                                        name="sampleShippingCost" 
                                        type="number" 
                                        step="0.01" 
                                        defaultValue={(config.sampleShippingCost / 100).toFixed(2)} 
                                        required
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-medium">Dane do Proformy</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="proformaBankName">Nazwa Banku</Label>
                                        <Input 
                                            id="proformaBankName" 
                                            name="proformaBankName" 
                                            placeholder="np. mBank S.A." 
                                            defaultValue={config.proformaBankName} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="proformaBankAccount">Numer Konta</Label>
                                        <Input 
                                            id="proformaBankAccount" 
                                            name="proformaBankAccount" 
                                            placeholder="00 0000 0000 0000 0000 0000 0000" 
                                            defaultValue={config.proformaBankAccount} 
                                        />
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bramka płatności (Tpay)</CardTitle>
                            <CardDescription>Konfiguracja integracji z Tpay.</CardDescription>
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
                                    name="tpayIsSandbox" 
                                    defaultChecked={tpayConfig.isSandbox} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tpayClientId">Client ID</Label>
                                <Input 
                                    id="tpayClientId" 
                                    name="tpayClientId" 
                                    type="text" 
                                    defaultValue={tpayConfig.clientId} 
                                    placeholder="1010..."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tpayClientSecret">Client Secret</Label>
                                <Input 
                                    id="tpayClientSecret" 
                                    name="tpayClientSecret" 
                                    type="password" 
                                    defaultValue={tpayConfig.clientSecret} 
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg">Zapisz wszystkie ustawienia</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
