'use client';

import { updateShopConfig, updateTpayConfig, uploadShopImage, searchProductsForConfig, ShopConfig, TpayConfig } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Globe, Search, BarChart3, CreditCard, LayoutTemplate, SquareEqual, Calculator, Smartphone, Plus, X, ShieldCheck, Bell } from 'lucide-react';
import { SingleImageUpload } from '@/components/common/single-image-upload';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { useEffect } from 'react';

export default function ShopSettingsForm({ initialConfig, initialTpayConfig, availableProducts, floorPatterns }: { 
    initialConfig: ShopConfig, 
    initialTpayConfig: TpayConfig,
    availableProducts: { id: string, name: string, price: string | null }[],
    floorPatterns: { id: string, name: string, slug: string | null }[]
}) {
    const [config, setConfig] = useState(initialConfig);
    const [tpayConfig] = useState(initialTpayConfig);

    // Bestseller Search Logic
    const [bestsellerSearch, setBestsellerSearch] = useState('');
    const [debouncedSearch] = useDebounce(bestsellerSearch, 500);
    const [foundProducts, setFoundProducts] = useState<{id: string, name: string}[]>([]);
    
    // Loaded names for currently selected IDs (for display)
    const [selectedProductNames, setSelectedProductNames] = useState<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        if (initialConfig.bestsellerIds) {
            initialConfig.bestsellerIds.forEach(id => {
                const found = availableProducts.find(p => p.id === id);
                if (found) map[id] = found.name;
            });
        }
        return map;
    });

    useEffect(() => {
        if (debouncedSearch.length > 2) {
            searchProductsForConfig(debouncedSearch).then(res => {
                setFoundProducts(res);
            });
        }
    }, [debouncedSearch]);


    const handleImageUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'system/branding');
        return await uploadShopImage(formData);
    };

    async function handleSave(formData: FormData) {
        try {
            // Collect waste rates
            const wasteRates: Record<string, { simple: number; complex: number }> = {};
            
            // Default waste rates
            wasteRates['default'] = {
                simple: parseFloat(formData.get('waste_default_simple') as string) || 5,
                complex: parseFloat(formData.get('waste_default_complex') as string) || 10,
            };

            // Pattern-specific waste rates
            floorPatterns.forEach(pattern => {
                if (pattern.slug) {
                    wasteRates[pattern.slug] = {
                        simple: parseFloat(formData.get(`waste_${pattern.slug}_simple`) as string) || 5,
                        complex: parseFloat(formData.get(`waste_${pattern.slug}_complex`) as string) || 10,
                    };
                }
            });

            // Save Shop Config
            const newShopConfig: ShopConfig = {
                // Announcement Bar
                announcementMessage: formData.get('announcementMessage') as string,
                isAnnouncementVisible: formData.get('isAnnouncementVisible') === 'on',
                
                // General
                isShopEnabled: formData.get('isShopEnabled') === 'on',
                samplePrice: Math.round(parseFloat(formData.get('samplePrice') as string) * 100),
                sampleShippingCost: Math.round(parseFloat(formData.get('sampleShippingCost') as string) * 100),
                palletShippingCost: Math.round(parseFloat(formData.get('palletShippingCost') as string) * 100), // Nowe pole
                heroHeadline: formData.get('heroHeadline') as string,
                heroSubheadline: formData.get('heroSubheadline') as string,
                heroImage: formData.get('heroImage') as string,
                measurementProductId: formData.get('measurementProductId') as string,
                
                // Bestsellers
                bestsellerIds: (() => {
                    try {
                        const raw = formData.get('bestsellerIds') as string;
                        return raw ? JSON.parse(raw) : [];
                    } catch { return []; }
                })(),

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
                },
                
                // Waste Rates
                wasteRates: wasteRates,

                // Turnstile
                turnstileSiteKey: formData.get('turnstileSiteKey') as string,
                turnstileSecretKey: formData.get('turnstileSecretKey') as string,
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
                    <TabsContent value="general" forceMount={true} className="space-y-4 mt-4 data-[state=inactive]:hidden">
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

                        <Card className="border-l-4 border-l-violet-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-violet-500" /> Komunikacja z Klientem
                                </CardTitle>
                                <CardDescription>
                                    Skonfiguruj automatyczne powiadomienia email (potwierdzenia, wysyłka, statusy).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm text-muted-foreground">
                                        Szablony wiadomości (Email/SMS) dla sklepu i montaży są zarządzane w centralnym module powiadomień.
                                    </p>
                                    <Button variant="outline" asChild className="border-violet-200 hover:bg-violet-50 hover:text-violet-700 whitespace-nowrap">
                                        <a href="/dashboard/settings?tab=notifications">Zarządzaj Powiadomieniami ↗</a>
                                    </Button>
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
                                    <div className="space-y-2">
                                        <Label htmlFor="palletShippingCost">Koszt wysyłki paletowej (PLN brutto)</Label>
                                        <Input 
                                            id="palletShippingCost" 
                                            name="palletShippingCost" 
                                            type="number" 
                                            step="0.01" 
                                            defaultValue={config.palletShippingCost ? (config.palletShippingCost / 100).toFixed(2) : "0"} 
                                            placeholder="np. 150.00"
                                        />
                                        <p className="text-xs text-muted-foreground w-full col-span-2">Doliczany do zamówień produkcyjnych.</p>
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
                                    <Smartphone className="h-5 w-5" /> Mobile Menu (Bestsellery)
                                </CardTitle>
                                <CardDescription>
                                    Wybierz produkty, które będą promowane jako &quot;Bestsellery&quot; w menu mobilnym, gdy użytkownik nie ma jeszcze historii przeglądania.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Wyszukaj i dodaj produkt</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Wpisz nazwę produktu..."
                                            className="pl-9"
                                            value={bestsellerSearch}
                                            onChange={(e) => setBestsellerSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    {/* Search Results */}
                                    {foundProducts.length > 0 && (
                                        <div className="border rounded-md mt-2 max-h-40 overflow-y-auto bg-white shadow-sm z-10">
                                            {foundProducts.map(fp => (
                                                <div 
                                                    key={fp.id} 
                                                    className="p-2 hover:bg-slate-50 cursor-pointer text-sm flex justify-between items-center"
                                                    onClick={() => {
                                                        const current = config.bestsellerIds || [];
                                                        if (!current.includes(fp.id)) {
                                                            const newIds = [...current, fp.id];
                                                            setConfig({...config, bestsellerIds: newIds});
                                                            setSelectedProductNames({...selectedProductNames, [fp.id]: fp.name});
                                                            setBestsellerSearch('');
                                                            setFoundProducts([]);
                                                        }
                                                    }}
                                                >
                                                    <span>{fp.name}</span>
                                                    <Plus className="h-4 w-4 text-blue-600" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Chips */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {config.bestsellerIds && config.bestsellerIds.length > 0 ? (
                                            config.bestsellerIds.map(id => (
                                                <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                                    {selectedProductNames[id] || availableProducts.find(p=>p.id===id)?.name || id}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-4 w-4 ml-1 rounded-full hover:bg-slate-200"
                                                        onClick={(e) => {
                                                            e.preventDefault(); // Prevent form submit
                                                            const newIds = config.bestsellerIds!.filter(pid => pid !== id);
                                                            setConfig({...config, bestsellerIds: newIds});
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground italic">
                                                Brak wybranych produktów. System wyświetli 5 ostatnio dodanych.
                                            </div>
                                        )}
                                    </div>
                                    <input type="hidden" name="bestsellerIds" value={JSON.stringify(config.bestsellerIds || [])} />
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

                        <Card>                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5" /> Cloudflare Turnstile (Anty-spam)
                                </CardTitle>
                                <CardDescription>Zabezpieczenie formularzy przed botami.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="turnstileSiteKey">Site Key</Label>
                                        <Input 
                                            id="turnstileSiteKey" 
                                            name="turnstileSiteKey" 
                                            defaultValue={config.turnstileSiteKey} 
                                            placeholder="0x4AAAAAA..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="turnstileSecretKey">Secret Key</Label>
                                        <Input 
                                            id="turnstileSecretKey" 
                                            name="turnstileSecretKey" 
                                            defaultValue={config.turnstileSecretKey} 
                                            type="password"
                                            placeholder="0x4AAAAAA..."
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                        <Card>                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="h-5 w-5" /> Domyślne Zapasy (Odpad)
                                </CardTitle>
                                <CardDescription>
                                    Ustaw sugerowane wartości zapasu dla kalkulatora w zależności od wzoru podłogi.
                                    System automatycznie podpowie te wartości klientowi.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Default / Fallback */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4">
                                    <div className="md:col-span-1">
                                        <h4 className="font-semibold text-sm">Domyślne (Inne)</h4>
                                        <p className="text-xs text-muted-foreground">Używane, gdy produkt nie ma zdefiniowanego wzoru.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="waste_default_simple">Proste (%)</Label>
                                        <Input 
                                            id="waste_default_simple" 
                                            name="waste_default_simple" 
                                            type="number" 
                                            min="0"
                                            max="100"
                                            defaultValue={config.wasteRates?.default?.simple ?? 5} 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="waste_default_complex">Skosy / Trudne (%)</Label>
                                        <Input 
                                            id="waste_default_complex" 
                                            name="waste_default_complex" 
                                            type="number" 
                                            min="0"
                                            max="100"
                                            defaultValue={config.wasteRates?.default?.complex ?? 10} 
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Patterns */}
                                {floorPatterns.map((pattern) => (
                                    pattern.slug && (
                                        <div key={pattern.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4 last:border-0">
                                            <div className="md:col-span-1">
                                                <h4 className="font-semibold text-sm">{pattern.name}</h4>
                                                <p className="text-xs text-muted-foreground">Slug: {pattern.slug}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`waste_${pattern.slug}_simple`}>Proste (%)</Label>
                                                <Input 
                                                    id={`waste_${pattern.slug}_simple`} 
                                                    name={`waste_${pattern.slug}_simple`} 
                                                    type="number" 
                                                    min="0"
                                                    max="100"
                                                    defaultValue={config.wasteRates?.[pattern.slug]?.simple ?? 5} 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor={`waste_${pattern.slug}_complex`}>Skosy / Trudne (%)</Label>
                                                <Input 
                                                    id={`waste_${pattern.slug}_complex`} 
                                                    name={`waste_${pattern.slug}_complex`} 
                                                    type="number" 
                                                    min="0"
                                                    max="100"
                                                    defaultValue={config.wasteRates?.[pattern.slug]?.complex ?? 10} 
                                                />
                                            </div>
                                        </div>
                                    )
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: DESIGN */}
                    <TabsContent value="design" forceMount={true} className="space-y-4 mt-4 data-[state=inactive]:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <SquareEqual className="h-5 w-5" /> Pasek Ogłoszeń (Top Bar)
                                </CardTitle>
                                <CardDescription>Czerwony pasek na samej górze strony.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/40">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Pokaż pasek</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Włącz lub wyłącz widoczność paska informacyjnego.
                                        </p>
                                    </div>
                                    <Switch 
                                        name="isAnnouncementVisible" 
                                        defaultChecked={config.isAnnouncementVisible !== false} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="announcementMessage">Treść komunikatu</Label>
                                    <Input 
                                        id="announcementMessage" 
                                        name="announcementMessage" 
                                        defaultValue={config.announcementMessage} 
                                        placeholder="np. Darmowa dostawa od 2000 zł"
                                    />
                                </div>
                            </CardContent>
                        </Card>

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
                                        aspectRatio="auto"
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
                    <TabsContent value="payments" forceMount={true} className="space-y-4 mt-4 data-[state=inactive]:hidden">
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
                    <TabsContent value="seo" forceMount={true} className="space-y-4 mt-4 data-[state=inactive]:hidden">
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
