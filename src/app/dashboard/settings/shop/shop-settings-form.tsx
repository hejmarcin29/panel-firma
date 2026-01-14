'use client';

import { updateShopConfig, updateTpayConfig, uploadShopImage, ShopConfig, TpayConfig } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Globe, Search, BarChart3, CreditCard, LayoutTemplate, SquareEqual, Calculator } from 'lucide-react';
import { SingleImageUpload } from '@/components/common/single-image-upload';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ShopSettingsForm({ initialConfig, initialTpayConfig, availableProducts }: { 
    initialConfig: ShopConfig, 
    initialTpayConfig: TpayConfig,
    availableProducts: { id: string, name: string, price: string | null }[]
}) {
    const [config, setConfig] = useState(initialConfig);
    const [tpayConfig] = useState(initialTpayConfig);

    const handleImageUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'system/branding');
        return await uploadShopImage(formData);
    };

    async function handleSave(formData: FormData) {
        try {
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
                welcomeEmailTemplate: config.welcomeEmailTemplate, // Keep existing if not in form

                // Header
                headerLogo: formData.get('headerLogo') as string,
                headerShowSearch: formData.get('headerShowSearch') === 'on',
                headerShowUser: formData.get('headerShowUser') === 'on',
                
                // Branding
                primaryColor: formData.get('primaryColor') as string,

                // Prices
                showGrossPrices: formData.get('showGrossPrices') === 'on',
                vatRate: parseInt(formData.get('vatRate') as string) || 23,

                // Calculator Rates
                calculatorRates: {
                    glue_herringbone: {
                        labor: parseFloat(formData.get('calc_glue_herringbone_labor') as string) || 65,
                        chemistry: parseFloat(formData.get('calc_glue_herringbone_chemistry') as string) || 25,
                    },
                    click_herringbone: {
                        labor: parseFloat(formData.get('calc_click_herringbone_labor') as string) || 45,
                        chemistry: parseFloat(formData.get('calc_click_herringbone_chemistry') as string) || 5,
                    },
                    glue_plank: {
                        labor: parseFloat(formData.get('calc_glue_plank_labor') as string) || 55,
                        chemistry: parseFloat(formData.get('calc_glue_plank_chemistry') as string) || 25,
                    },
                    click_plank: {
                        labor: parseFloat(formData.get('calc_click_plank_labor') as string) || 35,
                        chemistry: parseFloat(formData.get('calc_click_plank_chemistry') as string) || 5,
                    },
                }
            };

            await updateShopConfig(newShopConfig);

            // Save Tpay Config
            const newTpayConfig: TpayConfig = {
                clientId: formData.get('tpayClientId') as string,
                clientSecret: formData.get('tpayClientSecret') as string,
                isSandbox: formData.get('tpayIsSandbox') === 'on',
            };

            await updateTpayConfig(newTpayConfig);
            toast.success("Ustawienia zapisane");
        } catch (error) {
            console.error(error);
            toast.error("Błąd podczas zapisywania ustawień");
        }
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
            
            <form action={handleSave}>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general">Ogólne</TabsTrigger>
                        <TabsTrigger value="design">Design</TabsTrigger>
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
                                    <BarChart3 className="h-5 w-5" /> Parametry Handlowe
                                </CardTitle>
                                <CardDescription>Ceny próbek, zasady VAT i pomiarów.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/40">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Włącz Ceny Brutto</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatycznie doliczaj VAT do cen z kartoteki (Netto) w sklepie.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="vatRate">Stawka VAT %</Label>
                                            <Input 
                                                id="vatRate"
                                                type="number" 
                                                name="vatRate" 
                                                defaultValue={config.vatRate || 23} 
                                                className="h-8 w-16"
                                                placeholder="%"
                                            />
                                        </div>
                                         <Switch 
                                            name="showGrossPrices" 
                                            defaultChecked={config.showGrossPrices !== false} 
                                        />
                                    </div>
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="h-5 w-5" /> Kalkulator Ofertowy (Marketing)
                                </CardTitle>
                                <CardDescription>
                                    Stawki używane TYLKO do wyświetlania szacunkowych cen w sklepie (tzw. kalkulator błyskawiczny). 
                                    Nie wpływają na rzeczywiste wyceny w CRM.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Jodełka Klejona */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4">
                                    <div className="md:col-span-1">
                                        <h4 className="font-semibold text-sm">Jodełka - Klejona</h4>
                                        <p className="text-xs text-muted-foreground">Najdroższa opcja (Parkiet)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_glue_herringbone_labor">Robocizna (zł/m²)</Label>
                                        <Input 
                                            id="calc_glue_herringbone_labor" 
                                            name="calc_glue_herringbone_labor" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.glue_herringbone.labor} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_glue_herringbone_chemistry">Chemia (zł/m²)</Label>
                                        <Input 
                                            id="calc_glue_herringbone_chemistry" 
                                            name="calc_glue_herringbone_chemistry" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.glue_herringbone.chemistry} 
                                        />
                                    </div>
                                </div>

                                {/* Jodełka Klik */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4">
                                    <div className="md:col-span-1">
                                        <h4 className="font-semibold text-sm">Jodełka - Pływająca</h4>
                                        <p className="text-xs text-muted-foreground">Opcja pośrednia (Vinyl Click)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_click_herringbone_labor">Robocizna (zł/m²)</Label>
                                        <Input 
                                            id="calc_click_herringbone_labor" 
                                            name="calc_click_herringbone_labor" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.click_herringbone.labor} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_click_herringbone_chemistry">Chemia/Podkład (zł/m²)</Label>
                                        <Input 
                                            id="calc_click_herringbone_chemistry" 
                                            name="calc_click_herringbone_chemistry" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.click_herringbone.chemistry} 
                                        />
                                    </div>
                                </div>

                                {/* Deska Klejona */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4">
                                    <div className="md:col-span-1">
                                        <h4 className="font-semibold text-sm">Deska - Klejona</h4>
                                        <p className="text-xs text-muted-foreground">Dla podłóg warstwowych</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_glue_plank_labor">Robocizna (zł/m²)</Label>
                                        <Input 
                                            id="calc_glue_plank_labor" 
                                            name="calc_glue_plank_labor" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.glue_plank.labor} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_glue_plank_chemistry">Chemia (zł/m²)</Label>
                                        <Input 
                                            id="calc_glue_plank_chemistry" 
                                            name="calc_glue_plank_chemistry" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.glue_plank.chemistry} 
                                        />
                                    </div>
                                </div>

                                {/* Deska Klik */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="md:col-span-1">
                                        <h4 className="font-semibold text-sm">Deska - Pływająca</h4>
                                        <p className="text-xs text-muted-foreground">Najtańsza opcja (Panele)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_click_plank_labor">Robocizna (zł/m²)</Label>
                                        <Input 
                                            id="calc_click_plank_labor" 
                                            name="calc_click_plank_labor" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.click_plank.labor} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="calc_click_plank_chemistry">Podkład (zł/m²)</Label>
                                        <Input 
                                            id="calc_click_plank_chemistry" 
                                            name="calc_click_plank_chemistry" 
                                            type="number" 
                                            defaultValue={config.calculatorRates?.click_plank.chemistry} 
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: DESIGN */}
                    <TabsContent value="design" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutTemplate className="h-5 w-5" /> Hero Section (Baner)
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
                                <div className="space-y-4 pt-4 border-t">
                                    <Label>Zdjęcie w tle (Hero Image)</Label>
                                    <SingleImageUpload 
                                        value={config.heroImage}
                                        onChange={(url) => setConfig(prev => ({ ...prev, heroImage: url || undefined }))}
                                        onUpload={handleImageUpload}
                                        aspectRatio="video"
                                        label="Zmień zdjęcie tła"
                                    />
                                    <input type="hidden" name="heroImage" value={config.heroImage || ''} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LayoutTemplate className="h-5 w-5" /> Kolorystyka
                                </CardTitle>
                                <CardDescription>Dostosuj paletę barw sklepu.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="primaryColor">Kolor Główny (Primary)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                id="primaryColor" 
                                                name="primaryColor" 
                                                type="color"
                                                className="w-12 h-10 p-1 cursor-pointer"
                                                value={config.primaryColor || "#b02417"} 
                                                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                                            />
                                            <Input 
                                                type="text"
                                                value={config.primaryColor || "#b02417"}
                                                className="flex-1"
                                                placeholder="#b02417"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <SquareEqual className="h-5 w-5" /> Konfiguracja Nagłówka
                                </CardTitle>
                                <CardDescription>Dostosuj wygląd i funkcje górnego paska nawigacji.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4 border-b pb-4">
                                     <Label>Logo w nagłówku</Label>
                                     <SingleImageUpload 
                                        value={config.headerLogo}
                                        onChange={(url) => setConfig(prev => ({ ...prev, headerLogo: url || undefined }))}
                                        onUpload={handleImageUpload}
                                        aspectRatio="auto"
                                        label="Zmień logo"
                                    />
                                    <input type="hidden" name="headerLogo" value={config.headerLogo || ''} />
                                </div>
                                
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Ikona Wyszukiwania</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Pokaż lupkę pozwalającą na szukanie produktów.
                                        </p>
                                    </div>
                                    <Switch 
                                        name="headerShowSearch" 
                                        defaultChecked={config.headerShowSearch !== false} 
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Ikona Konta Użytkownika</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Link do logowania/rejestracji klienta.
                                        </p>
                                    </div>
                                    <Switch 
                                        name="headerShowUser" 
                                        defaultChecked={config.headerShowUser !== false} 
                                    />
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
                                <div className="space-y-4 border-b pb-4">
                                     <Label>Logo dla Google (Organization)</Label>
                                     <SingleImageUpload 
                                        value={config.organizationLogo}
                                        onChange={(url) => setConfig(prev => ({ ...prev, organizationLogo: url || undefined }))}
                                        onUpload={handleImageUpload}
                                        aspectRatio="square"
                                        label="Zmień logo organizacji"
                                    />
                                    <input type="hidden" name="organizationLogo" value={config.organizationLogo || ''} />
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
