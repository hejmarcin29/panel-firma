import { getInstallerProfile } from '../actions';
import { signOut } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Truck, Wallet, LogOut } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
// import Link from 'next/link';

export const metadata = {
    title: 'Profil | Panel Montażysty',
};

export default async function InstallerProfilePage() {
    const user = await getInstallerProfile();

    if (!user) return <div>Nie znaleziono profilu</div>;

    const initials = user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (user.installerProfile || {}) as any;

    return (
        <div className="p-4 pb-24 space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center pt-6 pb-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg mb-4">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-bold">{user.name}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-2 mt-3">
                    <Badge variant="secondary" className="px-3 py-1">Montażysta</Badge>
                    {user.isActive && <Badge className="bg-green-500 hover:bg-green-600 px-3 py-1">Aktywny</Badge>}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3">
                <form action={async () => {
                    'use server';
                    await signOut();
                    redirect('/login');
                }} className="w-full">
                    <Button variant="destructive" className="w-full gap-2 h-12 shadow-sm bg-red-50 text-red-600 hover:bg-red-100 border-red-100 border">
                        <LogOut className="h-4 w-4" />
                        Wyloguj
                    </Button>
                </form>
            </div>

            {/* Details */}
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider ml-1">Dane podstawowe</h3>
                
                <Card>
                    <CardContent className="p-0 divide-y">
                        <div className="flex items-center gap-3 p-4">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="text-xs text-muted-foreground">Telefon</div>
                                <div className="font-medium">{profile.phone || 'Brak danych'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4">
                            <Truck className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="text-xs text-muted-foreground">Nr rejestracyjny</div>
                                <div className="font-medium mt-0.5">{profile.carPlate || 'Brak danych'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="text-xs text-muted-foreground">Obszar działania</div>
                                <div className="font-medium mt-0.5">{profile.operationArea || 'Cała Polska'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider ml-1 mt-6">Rozliczenia</h3>
                <Card>
                    <CardContent className="p-0 divide-y">
                        <div className="flex items-center gap-3 p-4">
                            <Wallet className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="text-xs text-muted-foreground">Nr konta bankowego</div>
                                <div className="font-mono text-sm mt-0.5 break-all">
                                    {profile.bankAccount || 'Nie podano'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <div className="text-xs text-muted-foreground">NIP</div>
                                <div className="font-mono text-sm mt-0.5">
                                    {profile.nip || 'Brak'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {profile.rates && (
                    <>
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider ml-1 mt-6">Stawki bazowe</h3>
                        <Card>
                            <CardContent className="p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-muted-foreground">Montaż Click</div>
                                    <div className="font-medium text-lg">{formatCurrency(profile.rates.classicClick || 0)}/m²</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Montaż Klejony</div>
                                    <div className="font-medium text-lg">{formatCurrency(profile.rates.classicGlue || 0)}/m²</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Jodełka Click</div>
                                    <div className="font-medium text-lg">{formatCurrency(profile.rates.herringboneClick || 0)}/m²</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Jodełka Klejona</div>
                                    <div className="font-medium text-lg">{formatCurrency(profile.rates.herringboneGlue || 0)}/m²</div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <div className="text-center text-xs text-muted-foreground pt-8 pb-4">
                <p>Wersja aplikacji: 1.0.4 (Beta)</p>
                <p className="mt-1">Prime Podłogi &copy; {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}
