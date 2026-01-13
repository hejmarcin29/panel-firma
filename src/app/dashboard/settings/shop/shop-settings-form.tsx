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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Globe, Search, BarChart3, CreditCard, LayoutTemplate } from 'lucide-react';

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
            // General
            isShopEnabled: formData.get('isShopEnabled') === 'on',
            samplePrice: Math.round(parseFloat(formData.get('samplePrice') as string) * 100),
            sampleShippingCost: Math.round(parseFloat(formData.get('sampleShippingCost') as string) * 100),
            heroHeadline: formData.get('heroHeadline') as string,
            heroSubheadline: formData.get('heroSubheadline') as string,
            heroImage: formData.get('heroImage') as string,
            measurementProductId: formData.get('measurementProductId') as string,
            
            // Payment
            proformaBankName: formData.get('proformaBankName') as string,
            proformaBankAccount: formData.get('proformaBankAccount') as string,
            
            // SEO & Company
            organizationLogo: formData.get('organizationLogo') as string,
            contactPhone: formData.get('contactPhone') as string,
            contactEmail: formData.get('contactEmail') as string,
            socialFacebook: formData.get('socialFacebook') as string,
            socialInstagram: formData.get('socialInstagram') as string,
            
            // Integrations
            googleSearchConsoleId: formData.get('googleSearchConsoleId') as string,
            googleAnalyticsId: formData.get('googleAnalyticsId') as string,
            facebookPixelId: formData.get('facebookPixelId') as string,
            
            // Control
            noIndex: formData.get('noIndex') === 'on',
            welcomeEmailTemplate: config.welcomeEmailTemplate // Keep existing
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
                    Zarządzaj ustawieniami handlowymi, płatnościami oraz SEO.
                </p>
            </div>
            <Separator />
            
            <form action={saveAction}>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">Ogólne i Wygląd</TabsTrigger>
                        <TabsTrigger value="payments">Płatności</TabsTrigger>
                        <TabsTrigger value="seo">SEO i Analityka</TabsTrigger>
                    </TabsList>

                    {/* TAB: GENERAL */}
                    <TabsContent value="general" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" /> Dostępność Sklepu
                                </CardTitle>
                                <CardDescription>Główny włącznik modułu sprzedażowego.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/40">
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
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutTemplate className="h-5 w-5" /> Wygląd (Hero Section)
                                </CardTitle>
                                <CardDescription>Baner powitalny na stronie głównej sklepu.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                    <Input 
                                        id="heroImage" 
                                        name="heroImage" 
                                        defaultValue={config.heroImage} 
                                        placeholder="https://..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Parametry Handlowe</CardTitle>
                                <CardDescription>Ceny próbek i zasady pomiarów.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                <div className="pt-4 space-y-2">
                                    <Label htmlFor="measurementProductId">Produkt referencyjny dla usługi pomiaru</Label>
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: PAYMENTS */}
                    <TabsContent value="payments" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" /> Tpay (Szybkie Płatności)
                                </CardTitle>
                                <CardDescription>Konfiguracja bramki płatniczej.</CardDescription>
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
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Dane do Przelewu Tradycyjnego</CardTitle>
                                <CardDescription>Pojawiają się na proformach i w podsumowaniu.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: SEO */}
                    <TabsContent value="seo" className="space-y-4 mt-4">
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-900">
                                    <ShieldAlert className="h-5 w-5" /> Kontrola Indeksowania
                                </CardTitle>
                                <CardDescription className="text-amber-800">
                                    Decyduj, czy Google ma widzieć Twoją stronę.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-red-600 font-semibold">Blokuj Roboty (No-Index)</Label>
                                        <p className="text-sm text-gray-600">
                                            Zaznacz, jeśli chcesz <strong>UKRYĆ</strong> sklep przed wyszukiwarkami (np. w trakcie prac).
                                        </p>
                                    </div>
                                    <Switch 
                                        name="noIndex" 
                                        defaultChecked={config.noIndex} 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5" /> Dane Firmowe (Organization Schema)
                                </CardTitle>
                                <CardDescription>Te dane pomagają Google zrozumieć strukturę Twojej firmy.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="organizationLogo">Logo dla Google (URL)</Label>
                                    <Input 
                                        id="organizationLogo" 
                                        name="organizationLogo" 
                                        defaultValue={config.organizationLogo} 
                                        placeholder="https://... (najlepiej kwadratowe)"
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">Oficjalny Telefon</Label>
                                        <Input 
                                            id="contactPhone" 
                                            name="contactPhone" 
                                            defaultValue={config.contactPhone} 
                                            placeholder="+48 000 000 000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail">Oficjalny E-mail</Label>
                                        <Input 
                                            id="contactEmail" 
                                            name="contactEmail" 
                                            defaultValue={config.contactEmail} 
                                            placeholder="kontakt@domena.pl"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="socialFacebook">Facebook URL</Label>
                                        <Input 
                                            id="socialFacebook" 
                                            name="socialFacebook" 
                                            defaultValue={config.socialFacebook} 
                                            placeholder="https://facebook.com/twoja-strona"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="socialInstagram">Instagram URL</Label>
                                        <Input 
                                            id="socialInstagram" 
                                            name="socialInstagram" 
                                            defaultValue={config.socialInstagram} 
                                            placeholder="https://instagram.com/twoje-konto"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" /> Integracje Analityczne
                                </CardTitle>
                                <CardDescription>Wpisz ID usług, aby aktywować skrypty śledzące.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="googleAnalyticsId">Google Analytics 4 (GA4)</Label>
                                    <Input 
                                        id="googleAnalyticsId" 
                                        name="googleAnalyticsId" 
                                        defaultValue={config.googleAnalyticsId} 
                                        placeholder="G-XXXXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="googleSearchConsoleId">Google Search Console (Tag Weryfikacyjny)</Label>
                                    <Input 
                                        id="googleSearchConsoleId" 
                                        name="googleSearchConsoleId" 
                                        defaultValue={config.googleSearchConsoleId} 
                                        placeholder="Kod weryfikacyjny..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                                    <Input 
                                        id="facebookPixelId" 
                                        name="facebookPixelId" 
                                        defaultValue={config.facebookPixelId} 
                                        placeholder="XXXXXXXXXXXXXXX"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="flex justify-end pt-6 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 border-t z-10">
                        <Button type="submit" size="lg" className="w-full md:w-auto shadow-lg">Zapisz Ustawienia</Button>
                    </div>
                </Tabs>
            </form>
        </div>
    );
}
