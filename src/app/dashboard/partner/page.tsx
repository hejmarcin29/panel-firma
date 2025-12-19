import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { montages, partnerPayouts, partnerCommissions, users } from '@/lib/db/schema';
import { eq, desc, or } from 'drizzle-orm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { PayoutRequestForm } from './_components/payout-request-form';
import { TermsAcceptance } from './_components/terms-acceptance';
import { PartnerLeadsList } from './_components/partner-leads-list';

export default async function PartnerDashboard() {
    const sessionUser = await requireUser();
    
    if (!sessionUser.roles.includes('partner')) {
        return <div>Brak dostępu.</div>;
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, sessionUser.id),
    });

    if (!user) {
        return <div>Błąd: Nie znaleziono użytkownika.</div>;
    }

    const leads = await db.query.montages.findMany({
        where: or(
            eq(montages.architectId, user.id),
            eq(montages.partnerId, user.id)
        ),
        orderBy: [desc(montages.createdAt)],
    });

    const payouts = await db.query.partnerPayouts.findMany({
        where: eq(partnerPayouts.partnerId, user.id),
        orderBy: [desc(partnerPayouts.createdAt)],
    });

    const commissions = await db.query.partnerCommissions.findMany({
        where: eq(partnerCommissions.partnerId, user.id),
    });

    const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPendingPayout = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const availableFunds = totalEarned - totalPaid - totalPendingPayout;

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://b2b.primepodloga.pl'}/polecam/${user.referralToken || 'brak-tokenu'}`;
    const termsAccepted = !!user.partnerProfile?.termsAcceptedAt;

    if (!termsAccepted) {
        return <TermsAcceptance />;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Moje Polecenia</h1>
                    <p className="text-muted-foreground">
                        Śledź statusy klientów, których nam poleciłeś.
                    </p>
                </div>
                <Card className="w-full md:w-auto bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Twój link polecający</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <code className="bg-background px-2 py-1 rounded border text-sm select-all">
                            {referralLink}
                        </code>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Zarobiono łącznie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalEarned / 100)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Wypłacono</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaid / 100)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Dostępne środki</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(availableFunds / 100)}</div>
                        {availableFunds > 0 && (
                            <div className="mt-4">
                                <PayoutRequestForm maxAmount={availableFunds / 100} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <PartnerLeadsList leads={leads} />
                </div>

                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historia Wypłat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Kwota</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                Brak wypłat.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payouts.map((payout) => (
                                            <TableRow key={payout.id}>
                                                <TableCell>
                                                    {format(payout.createdAt, 'dd.MM.yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(payout.amount / 100)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={payout.status === 'paid' ? 'default' : payout.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                        {payout.status === 'paid' ? 'Wypłacono' : payout.status === 'rejected' ? 'Odrzucono' : 'Oczekuje'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
