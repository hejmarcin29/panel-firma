import { getShopConfig, updateShopConfig, ShopConfig } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function ShopSettingsPage() {
    const config = await getShopConfig();

    async function saveAction(formData: FormData) {
        'use server';
        
        const newConfig: ShopConfig = {
            isShopEnabled: formData.get('isShopEnabled') === 'on',
            samplePrice: Math.round(parseFloat(formData.get('samplePrice') as string) * 100), // convert to grosze
            sampleShippingCost: Math.round(parseFloat(formData.get('sampleShippingCost') as string) * 100), // convert to grosze
            proformaBankName: formData.get('proformaBankName') as string,
            proformaBankAccount: formData.get('proformaBankAccount') as string,
        };

        await updateShopConfig(newConfig);
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Konfiguracja Sklepu</h3>
                <p className="text-sm text-muted-foreground">
                    Zarządzaj ustawieniami handlowymi modułu sprzedażowego.
                </p>
            </div>
            <Separator />
            
            <form action={saveAction}>
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
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Zapisz zmiany</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
