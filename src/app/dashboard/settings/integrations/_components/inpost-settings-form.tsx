'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Check, Eye, EyeOff, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import { saveInPostSettings } from '../actions';

interface InPostSettingsFormProps {
    initialSettings: {
        orgId: string;
        token: string;
        geowidgetToken: string;
        geowidgetConfig: string;
        sandbox: boolean;
    };
}

export function InPostSettingsForm({ initialSettings }: InPostSettingsFormProps) {
    const [formData, setFormData] = useState({
        orgId: initialSettings.orgId,
        token: initialSettings.token,
        geowidgetToken: initialSettings.geowidgetToken,
        geowidgetConfig: initialSettings.geowidgetConfig,
        sandbox: initialSettings.sandbox,
    });

    const [showToken, setShowToken] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Map Debug Logic
    const [showMapTest, setShowMapTest] = useState(false);
    const geoWidgetRef = useRef<HTMLElement | null>(null);

    const initMap = () => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
        if (!document.head.querySelector(`link[href="${link.href}"]`)) {
            document.head.appendChild(link);
        }
    };

    useEffect(() => {
        if (!showMapTest || !geoWidgetRef.current) return;

        // Force update attributes on the web component
        geoWidgetRef.current.setAttribute("token", formData.geowidgetToken || "");
        geoWidgetRef.current.setAttribute("config", formData.geowidgetConfig || "parcelCollect");
        geoWidgetRef.current.setAttribute("language", "pl");
        
        // Listen for point selection
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const point = customEvent.detail as any;
            console.log("InPost Geowidget Selected Point:", point);
            toast.success(`Wybrano punkt: ${point?.name || point?.id}`);
        };

        const currentRef = geoWidgetRef.current;
        currentRef.addEventListener("onpointselect", handler);
        
        return () => {
            currentRef.removeEventListener("onpointselect", handler);
        };
    }, [showMapTest, formData.geowidgetToken, formData.geowidgetConfig]);

    const debouncedSave = useDebouncedCallback(async (data: typeof formData) => {
        setIsSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('orgId', data.orgId);
            formDataToSend.append('token', data.token);
            formDataToSend.append('geowidgetToken', data.geowidgetToken);
            formDataToSend.append('geowidgetConfig', data.geowidgetConfig);
            formDataToSend.append('sandbox', String(data.sandbox));

            await saveInPostSettings(formDataToSend);
        } catch {
            toast.error('Błąd zapisu ustawień InPost');
        } finally {
            setIsSaving(false);
        }
    }, 1000);

    const handleChange = (field: keyof typeof formData, value: string | boolean) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        debouncedSave(newData);
    };

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle>Konfiguracja InPost (ShipX)</CardTitle>
                        <CardDescription>
                            Wprowadź dane API ShipX, aby umożliwić generowanie etykiet.
                        </CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                        {isSaving ? (
                            <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                <Loader2 className='w-3 h-3 animate-spin' />
                                Zapisywanie...
                            </span>
                        ) : (
                            <span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isSaving}>
                                <Check className='w-3 h-3' />
                                Zapisano
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='grid gap-2'>
                    <Label htmlFor='inpost-org-id'>ID Organizacji</Label>
                    <Input
                        id='inpost-org-id'
                        value={formData.orgId}
                        onChange={(e) => handleChange('orgId', e.target.value)}
                        placeholder='np. 12345'
                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='inpost-token'>Token API</Label>
                    <div className="relative">
                        <Input
                            id='inpost-token'
                            type={showToken ? 'text' : 'password'}
                            value={formData.token}
                            onChange={(e) => handleChange('token', e.target.value)}
                            placeholder='Token dostępowy ShipX'
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='inpost-geowidget-token'>Token Geowidgetu</Label>
                    <Input
                        id='inpost-geowidget-token'
                        value={formData.geowidgetToken}
                        onChange={(e) => handleChange('geowidgetToken', e.target.value)}
                        placeholder='Token do mapy (Geowidget)'
                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='inpost-geowidget-config'>Konfiguracja Geowidgetu (config)</Label>
                    <Input
                        id='inpost-geowidget-config'
                        value={formData.geowidgetConfig}
                        onChange={(e) => handleChange('geowidgetConfig', e.target.value)}
                        placeholder='np. parcelCollect lub Twoja nazwa konfiguracji'
                    />
                    <p className='text-xs text-muted-foreground'>
                        To jest nazwa konfiguracji przekazywana jako <code>configname</code> do Geowidget v5.
                    </p>
                </div>
                <div className='flex items-center justify-between space-x-2 rounded-lg border p-4'>
                    <div className="space-y-0.5">
                        <Label htmlFor="inpost-sandbox">Tryb Sandbox (Testowy)</Label>
                        <p className="text-sm text-muted-foreground">
                            Używaj środowiska testowego InPost zamiast produkcyjnego.
                        </p>
                    </div>
                    <Switch
                        id="inpost-sandbox"
                        checked={formData.sandbox}
                        onCheckedChange={(checked) => handleChange('sandbox', checked)}
                    />
                </div>

                <div className="pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <Label>Diagnostyka Mapy (Geowidget)</Label>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowMapTest(!showMapTest)}
                        >
                            {showMapTest ? "Ukryj Mapę" : "Pokaż Mapę Testową"}
                            <MapPin className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {showMapTest && (
                        <div className="border rounded-lg overflow-hidden h-[500px] w-full bg-muted/20 relative">
                            {(!formData.geowidgetToken) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                                    <p className="text-muted-foreground">Wprowadź Token Geowidgetu aby zobaczyć mapę</p>
                                </div>
                            )}
                            {/* @ts-ignore - custom element */}
                            <inpost-geowidget
                                ref={geoWidgetRef}
                                token={formData.geowidgetToken}
                                config={formData.geowidgetConfig || "parcelCollect"}
                                language="pl"
                                onpoint="onpointselect"
                                className="w-full h-full block"
                            />
                        </div>
                    )}
                </div>
            </CardContent>
            
            <Script 
                id="inpost-geowidget-settings"
                src="https://geowidget.inpost.pl/inpost-geowidget.js"
                strategy="lazyOnload"
                onReady={initMap}
            />
        </Card>
    );
}
