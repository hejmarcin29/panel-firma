'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Gift, Users, FileText, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { requestPayout } from '../actions';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

interface MontageAttachment {
    id: string;
    url: string;
    title: string | null;
}

interface Montage {
    id: string;
    displayId: string | null;
    clientName: string;
    status: string;
    createdAt: Date;
    forecastedInstallationDate: Date | null;
    scheduledInstallationAt: Date | null;
    attachments: MontageAttachment[];
}

interface PayoutRequest {
    id: string;
    rewardType: string;
    createdAt: Date;
    amount: number;
    status: string;
}

interface ReferralCommission {
    id: string;
    createdAt: Date;
    amount: number;
}

interface Customer {
    name: string | null;
    referralCode: string | null;
    referralBalance: number | null;
    referralCommissions: ReferralCommission[];
    payoutRequests: PayoutRequest[];
    montages: Montage[];
}

interface CustomerPortalProps {
    customer: Customer;
    token: string;
}

const STATUS_STEPS = [
    { id: 'lead', label: 'Zgłoszenie', description: 'Otrzymaliśmy Twoje zgłoszenie' },
    { id: 'measurement', label: 'Pomiar', description: 'Umawiamy termin pomiaru' },
    { id: 'valuation', label: 'Wycena', description: 'Przygotowujemy ofertę' },
    { id: 'acceptance', label: 'Akceptacja', description: 'Czekamy na Twoją decyzję' },
    { id: 'deposit', label: 'Zaliczka', description: 'Oczekujemy na wpłatę' },
    { id: 'in_progress', label: 'Realizacja', description: 'Montaż w toku' },
    { id: 'completed', label: 'Zakończone', description: 'Prace zakończone' },
];

function getStepStatus(currentStatus: string, stepId: string) {
    const currentIndex = STATUS_STEPS.findIndex(s => s.id === currentStatus);
    const stepIndex = STATUS_STEPS.findIndex(s => s.id === stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
}

export function CustomerPortal({ customer, token }: CustomerPortalProps) {
    const [isRequesting, setIsRequesting] = useState(false);

    const referralLink = `https://b2b.primepodloga.pl/r/${customer.referralCode}`;

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        toast.success('Link skopiowany do schowka!');
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const handlePayout = async (rewardType: string) => {
        try {
            setIsRequesting(true);
            await requestPayout(token, rewardType);
            toast.success('Zlecenie wypłaty zostało wysłane!');
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Wystąpił nieznany błąd');
            }
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

    const activeMontage = customer.montages[0]; // For now, just take the latest one

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            className="container mx-auto p-4 max-w-4xl space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.div className="text-center space-y-2" variants={itemVariants}>
                <h1 className="text-3xl font-bold">Witaj, {customer.name}!</h1>
                <p className="text-muted-foreground">Panel Klienta Prime Podłogi</p>
            </motion.div>

            <Tabs defaultValue="montage" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="montage">Moje Zlecenie</TabsTrigger>
                    <TabsTrigger value="referrals">Program Poleceń</TabsTrigger>
                </TabsList>

                <TabsContent value="montage" className="space-y-6">
                    {activeMontage ? (
                        <motion.div variants={containerVariants} className="space-y-6">
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Status Realizacji</CardTitle>
                                        <CardDescription>
                                            Śledź postęp swojego zamówienia: {activeMontage.displayId || activeMontage.clientName}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative flex flex-col gap-6 md:flex-row md:justify-between md:gap-2">
                                            {/* Progress Bar Background (Desktop) */}
                                            <div className="absolute top-4 left-0 hidden h-0.5 w-full bg-muted md:block" />
                                            
                                            {STATUS_STEPS.map((step, index) => {
                                                const status = getStepStatus(activeMontage.status, step.id);
                                                return (
                                                    <motion.div 
                                                        key={step.id} 
                                                        className="relative flex flex-row items-start gap-4 md:flex-col md:items-center md:gap-2 md:text-center z-10"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.1 }}
                                                    >
                                                        <div className={cn(
                                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                                                            status === 'completed' ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" :
                                                            status === 'current' ? "border-primary bg-background text-primary ring-4 ring-primary/10" :
                                                            "border-muted bg-background text-muted-foreground"
                                                        )}>
                                                            {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                                             status === 'current' ? <Circle className="h-4 w-4 fill-current animate-pulse" /> :
                                                             <Circle className="h-4 w-4" />}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 pt-1 md:pt-0">
                                                            <span className={cn("text-sm font-medium transition-colors duration-300", status === 'current' && "text-primary")}>
                                                                {step.label}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground md:max-w-[100px]">
                                                                {step.description}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <motion.div variants={itemVariants}>
                                    <Card className="h-full hover:shadow-md transition-shadow duration-300">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Calendar className="h-5 w-5 text-primary" /> Terminy
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-muted-foreground">Data zgłoszenia:</span>
                                                <span className="font-medium">
                                                    {new Date(activeMontage.createdAt).toLocaleDateString('pl-PL')}
                                                </span>
                                            </div>
                                            {activeMontage.forecastedInstallationDate && (
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-muted-foreground">Planowany montaż:</span>
                                                    <span className="font-medium">
                                                        {new Date(activeMontage.forecastedInstallationDate).toLocaleDateString('pl-PL')}
                                                    </span>
                                                </div>
                                            )}
                                            {activeMontage.scheduledInstallationAt && (
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-muted-foreground">Potwierdzony termin:</span>
                                                    <span className="font-medium text-green-600">
                                                        {new Date(activeMontage.scheduledInstallationAt).toLocaleDateString('pl-PL')}
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <Card className="h-full hover:shadow-md transition-shadow duration-300">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-primary" /> Dokumenty
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {activeMontage.attachments && activeMontage.attachments.length > 0 ? (
                                                <div className="space-y-2">
                                                    {activeMontage.attachments.map((att) => (
                                                        <a 
                                                            key={att.id} 
                                                            href={att.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors group"
                                                        >
                                                            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{att.title || 'Dokument'}</span>
                                                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Brak udostępnionych dokumentów.
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div variants={itemVariants}>
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="rounded-full bg-muted p-4 mb-4">
                                        <FileText className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Brak aktywnych zleceń</h3>
                                    <p className="text-muted-foreground max-w-sm mt-2">
                                        Nie znaleźliśmy żadnych aktywnych zleceń przypisanych do Twojego konta.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="referrals" className="space-y-6">
                    <motion.div 
                        className="grid gap-4 md:grid-cols-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div variants={itemVariants}>
                            <Card className="hover:shadow-md transition-shadow duration-300">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Dostępne środki</CardTitle>
                                    <Gift className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{formatCurrency(customer.referralBalance || 0)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Gotowe do wypłaty
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <Card className="hover:shadow-md transition-shadow duration-300">
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
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <Card className="hover:shadow-md transition-shadow duration-300">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Twój kod</CardTitle>
                                    <Badge variant="outline" className="font-mono text-lg bg-primary/5">{customer.referralCode}</Badge>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" size="sm" className="w-full mt-2 hover:bg-primary hover:text-primary-foreground transition-colors" onClick={copyLink}>
                                        <Copy className="mr-2 h-4 w-4" /> Kopiuj link
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>

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
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button 
                                            className="h-24 text-lg w-full" 
                                            variant="outline"
                                            disabled={(customer.referralBalance || 0) < 5000 || isRequesting}
                                            onClick={() => handlePayout('allegro')}
                                        >
                                            Karta Allegro
                                        </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button 
                                            className="h-24 text-lg w-full" 
                                            variant="outline"
                                            disabled={(customer.referralBalance || 0) < 5000 || isRequesting}
                                            onClick={() => handlePayout('ikea')}
                                        >
                                            Karta IKEA
                                        </Button>
                                    </motion.div>
                                </CardContent>
                                <CardFooter>
                                    {(customer.referralBalance || 0) < 5000 && (
                                        <p className="text-sm text-muted-foreground text-center w-full">
                                            Brakuje Ci {formatCurrency(5000 - (customer.referralBalance || 0))} do minimalnej kwoty wypłaty.
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
                                        {customer.payoutRequests.map((request, index: number) => (
                                            <motion.div 
                                                key={request.id} 
                                                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
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
                                            </motion.div>
                                        ))}
                                        {customer.referralCommissions.map((commission, index: number) => (
                                            <motion.div 
                                                key={commission.id} 
                                                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: (customer.payoutRequests.length + index) * 0.1 }}
                                            >
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
                                            </motion.div>
                                        ))}
                                        {customer.payoutRequests.length === 0 && customer.referralCommissions.length === 0 && (
                                            <p className="text-center text-muted-foreground py-8">Brak historii operacji.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
