import { requireUser } from '@/lib/auth/session';
import { getArchitectCommissions } from '@/app/dashboard/settings/team/actions';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Portfel',
};

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';

export default async function WalletPage() {
    const user = await requireUser();

    if (!user.roles.includes('architect')) {
        redirect('/dashboard');
    }

    const commissions = await getArchitectCommissions(user.id);

    const totalEarned = commissions.reduce((acc, curr) => acc + curr.amount, 0) / 100;
    const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0) / 100;
    const paidAmount = commissions.filter(c => c.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0) / 100;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Twój Portfel</h1>
            
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Łącznie Zarobione</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalEarned)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oczekujące</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wypłacone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historia Prowizji</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Montaż</TableHead>
                                <TableHead>Powierzchnia</TableHead>
                                <TableHead>Stawka</TableHead>
                                <TableHead>Kwota</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.map((commission) => (
                                <TableRow key={commission.id}>
                                    <TableCell>{new Date(commission.createdAt).toLocaleDateString('pl-PL')}</TableCell>
                                    <TableCell>
                                        {commission.montage ? (
                                            <a href={`/dashboard/crm/montaze/${commission.montage.id}`} className="hover:underline">
                                                {commission.montage.clientName} ({commission.montage.installationCity || commission.montage.billingCity || '-'})
                                            </a>
                                        ) : 'Usunięty montaż'}
                                    </TableCell>
                                    <TableCell>{commission.area} m²</TableCell>
                                    <TableCell>{commission.rate} PLN/m²</TableCell>
                                    <TableCell className="font-medium">{formatCurrency(commission.amount / 100)}</TableCell>
                                    <TableCell>
                                        <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                                            {commission.status === 'paid' ? 'Wypłacone' : 'Oczekujące'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {commissions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Brak historii prowizji.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
