'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Loader2, Save, Moon, Sun, Laptop, Calendar, LogOut, User, CreditCard, Car, Phone, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { updateInstallerProfile } from '../actions';
import type { InstallerProfile } from '@/lib/db/schema';

interface InstallerSettingsViewProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        installerProfile: InstallerProfile | null;
        googleRefreshToken?: string | null;
    };
}

export function InstallerSettingsView({ user }: InstallerSettingsViewProps) {
    const { theme, setTheme } = useTheme();
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        phone: user.installerProfile?.phone || '',
        carPlate: user.installerProfile?.carPlate || '',
        nip: user.installerProfile?.nip || '',
        bankAccount: user.installerProfile?.bankAccount || '',
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateInstallerProfile(formData);
            toast.success('Zapisano ustawienia');
        } catch {
            toast.error('Błąd zapisu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoogleConnect = () => {
        window.location.href = '/api/auth/google/connect';
    };

    return (
        <div className="max-w-md mx-auto pb-20 space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Ustawienia</h1>
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Zapisz
                </Button>
            </div>

            {/* 1. WYGLĄD */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Wygląd aplikacji</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={theme === "light" ? "default" : "outline"}
                            className="flex flex-col items-center justify-center h-20 gap-2"
                            onClick={() => setTheme("light")}
                        >
                            <Sun className="h-6 w-6" />
                            <span className="text-xs">Jasny</span>
                        </Button>
                        <Button
                            variant={theme === "dark" ? "default" : "outline"}
                            className="flex flex-col items-center justify-center h-20 gap-2"
                            onClick={() => setTheme("dark")}
                        >
                            <Moon className="h-6 w-6" />
                            <span className="text-xs">Ciemny</span>
                        </Button>
                        <Button
                            variant={theme === "system" ? "default" : "outline"}
                            className="flex flex-col items-center justify-center h-20 gap-2"
                            onClick={() => setTheme("system")}
                        >
                            <Laptop className="h-6 w-6" />
                            <span className="text-xs">System</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 2. DANE OGÓLNE */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Twoje Dane</CardTitle>
                    <CardDescription>Informacje widoczne dla biura</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Imię i Nazwisko (zablokowane)</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {user.name || user.email}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon kontaktowy</Label>
                        <div className="relative">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="phone" 
                                className="pl-9" 
                                placeholder="+48 000 000 000"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="carPlate">Nr rejestracyjny auta</Label>
                        <div className="relative">
                            <Car className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="carPlate" 
                                className="pl-9" 
                                placeholder="np. WZ 12345"
                                value={formData.carPlate}
                                onChange={(e) => setFormData({...formData, carPlate: e.target.value})}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. DANE ROZLICZENIOWE */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dane Rozliczeniowe (B2B)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nip">NIP</Label>
                        <Input 
                            id="nip" 
                            placeholder="000-000-00-00"
                            value={formData.nip}
                            onChange={(e) => setFormData({...formData, nip: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bankAccount">Numer konta</Label>
                        <div className="relative">
                            <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="bankAccount" 
                                className="pl-9" 
                                placeholder="PL 00 0000 ..."
                                value={formData.bankAccount}
                                onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4. KALENDARZ GOOGLE */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <CardTitle className="text-base">Kalendarz Google</CardTitle>
                    </div>
                    <CardDescription>
                        Połącz swoje konto Google, aby automatycznie dodawać zlecenia do swojego kalendarza.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user.googleRefreshToken ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5" />
                                <span className="text-sm font-medium">Połączono z Google</span>
                            </div>
                            <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800 hover:bg-green-100" onClick={handleGoogleConnect}>
                                Odśwież
                            </Button>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full gap-2" onClick={handleGoogleConnect}>
                            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            Zaloguj przez Google
                        </Button>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                        <p>Alternatywnie, możesz użyć <button className="underline" onClick={() => {
                             const url = `${window.location.origin}/api/calendar/${user.id}/feed.ics`;
                             navigator.clipboard.writeText(url);
                             toast.success('Skopiowano link iCal');
                        }}>linku iCal</button> (dla zaawansowanych).</p>
                    </div>
                </CardContent>
            </Card>

            <div className="pt-4">
                <Button variant="destructive" className="w-full" asChild>
                    <a href="/api/auth/signout">
                        <LogOut className="w-4 h-4 mr-2" />
                        Wyloguj się
                    </a>
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                    Panel Montażysty v1.2.0
                </p>
            </div>
        </div>
    );
}
