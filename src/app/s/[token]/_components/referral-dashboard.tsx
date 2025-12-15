'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Gift, History, Users } from 'lucide-react';
import { toast } from 'sonner';
import { requestPayout } from '../actions';

interface ReferralDashboardProps {
    customer: any; // Type this properly
    token: string;
}

export function ReferralDashboard({ customer, token }: ReferralDashboardProps) {
    const [isRequesting, setIsRequesting] = useState(false);

    const referralLink = `https://primepodloga.pl?ref=${customer.referralCode}`;

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        toast.success('Link skopiowany do schowka!');
    };

    const handlePayout = async (rewardType: string) => {
        try {
            setIsRequesting(true);
            await requestPayout(token, rewardType);
            toast.success('Zlecenie wypłaty zostało wysłane!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRequesting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
        }).format(amount / 100);
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Witaj, {customer.name}!</h1>
                <p className="text-muted-foreground">To Twój panel programu poleceń.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dostępne środki</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(customer.referralBalance)}</div>
                        <p className="text-xs text-muted-foreground">
                            Gotowe do wypłaty
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Poleceni klienci</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customer.referralCommissions.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Zrealizowane montaże
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Twój kod</CardTitle>
                        <Badge variant="outline" className="font-mono text-lg">{customer.referralCode}</Badge>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={copyLink}>
                            <Copy className="mr-2 h-4 w-4" /> Kopiuj link
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="payout" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="payout">Wypłata nagród</TabsTrigger>
                    <TabsTrigger value="history">Historia</TabsTrigger>
                </TabsList>
                <TabsContent value="payout" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Wybierz nagrodę</CardTitle>
                            <CardDescription>
                                Wymień zgromadzone środki na karty podarunkowe. Minimalna kwota wypłaty to 50 PLN.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <Button 
                                className="h-24 text-lg" 
                                variant="outline"
                                disabled={customer.referralBalance < 5000 || isRequesting}
                                onClick={() => handlePayout('allegro')}
                            >
                                Karta Allegro
                            </Button>
                            <Button 
                                className="h-24 text-lg" 
                                variant="outline"
                                disabled={customer.referralBalance < 5000 || isRequesting}
                                onClick={() => handlePayout('ikea')}
                            >
                                Karta IKEA
                            </Button>
                        </CardContent>
                        <CardFooter>
                            {customer.referralBalance < 5000 && (
                                <p className="text-sm text-muted-foreground text-center w-full">
                                    Brakuje Ci {formatCurrency(5000 - customer.referralBalance)} do minimalnej kwoty wypłaty.
                                </p>
                            )}
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historia operacji</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {customer.payoutRequests.map((request: any) => (
                                    <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium">Wypłata - {request.rewardType}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(request.createdAt).toLocaleDateString('pl-PL')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600">-{formatCurrency(request.amount)}</p>
                                            <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                                                {request.status === 'completed' ? 'Zrealizowano' : 'Oczekuje'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {customer.referralCommissions.map((commission: any) => (
                                    <div key={commission.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium">Prowizja - Montaż</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(commission.createdAt).toLocaleDateString('pl-PL')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">+{formatCurrency(commission.amount)}</p>
                                            <Badge variant="outline">Zatwierdzono</Badge>
                                        </div>
                                    </div>
                                ))}
                                {customer.payoutRequests.length === 0 && customer.referralCommissions.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">Brak historii operacji.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
