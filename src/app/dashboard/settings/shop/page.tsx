import { getShopConfig, updateShopConfig, getTpayConfig, updateTpayConfig, ShopConfig, TpayConfig } from './actions';
import { db } from '@/lib/db'; // Added
import { erpProducts } from '@/lib/db/schema'; // Added
import { eq } from 'drizzle-orm'; // Added
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added

export default async function ShopSettingsPage() {
    const config = await getShopConfig();
    const tpayConfig = await getTpayConfig();

    // Fetch products for dropdown
    const availableProducts = await db.query.erpProducts.findMany({
        where: eq(erpProducts.isShopVisible, true),
        columns: {
            id: true,
            name: true,
            price: true,
        }
    });

    async function saveAction(formData: FormData) {
        'use server';
        
        // Save Shop Config
        const newShopConfig: ShopConfig = {
            isShopEnabled: formData.get('isShopEnabled') === 'on',
            samplePrice: Math.round(parseFloat(formData.get('samplePrice') as string) * 100), // convert to grosze
            sampleShippingCost: Math.round(parseFloat(formData.get('sampleShippingCost') as string) * 100), // convert to grosze
            proformaBankName: formData.get('proformaBankName') as string,
            proformaBankAccount: formData.get('proformaBankAccount') as string,
            heroHeadline: formData.get('heroHeadline') as string,
            heroSubheadline: formData.get('heroSubheadline') as string,
            heroImage: formData.get('heroImage') as string,
            measurementProductId: formData.get('measurementProductId') as string, // Added
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

                             {/* MEASUREMENT PRODUCT CONFIG */}
                             <div className="space-y-4">
                                <h4 className="font-medium">Konfiguracja Pomiarów</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="measurementProductId">Produkt referencyjny dla usługi pomiaru</Label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Wybierz produkt, który będzie dodawany do koszyka przy płatnym zleceniu pomiaru.
                                    </p>
                                    <select 
                                        name="measurementProductId" 
                                        id="measurementProductId"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        defaultValue={config.measurementProductId || ""}
                                    >
                                        <option value="">-- Brak / Wybierz produkt --</option>
                                        {availableProducts.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.price} PLN)
                                            </option>
                                        ))}
                                    </select>
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
                        <CardHeader>                            <CardTitle>Wygląd Strony Głównej</CardTitle>
                            <CardDescription>Zarządzaj banerem powitalnym (Hero Section).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="heroHeadline">Nagłówek główny</Label>
                                <Input 
                                    id="heroHeadline" 
                                    name="heroHeadline" 
                                    defaultValue={config.heroHeadline} 
                                    placeholder="np. Twoja wymarzona podłoga"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroSubheadline">Podtytuł</Label>
                                <Input 
                                    id="heroSubheadline" 
                                    name="heroSubheadline" 
                                    defaultValue={config.heroSubheadline} 
                                    placeholder="np. Największy wybór podłóg z profesjonalnym montażem."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="heroImage">Zdjęcie w tle (URL)</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="heroImage" 
                                        name="heroImage" 
                                        defaultValue={config.heroImage} 
                                        placeholder="https://..."
                                    />
                                    {/* TODO: Add Media Picker Button */}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Wklej link do zdjęcia. Zalecane: 1920x1080px, przyciemnione.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>                            <CardTitle>Bramka płatności (Tpay)</CardTitle>
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
