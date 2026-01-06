'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { getStatusLabel } from "@/lib/montaze/statuses-shared";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Wallet, Hammer, FileText } from "lucide-react";

interface FinancialsSectionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    roles: string[];
}

export function FinancialsSection({ data, roles }: FinancialsSectionProps) {
    if (!data) return null;

    return (
        <div className="space-y-8">
            {/* ARCHITECT SECTION */}
            {roles.includes('architect') && data.architectCommissions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-purple-500" />
                            Prowizje Architekta
                        </CardTitle>
                        <CardDescription>Historia naliczonych prowizji od zleceń.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Klient / Montaż</TableHead>
                                    <TableHead>Kwota</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {data.architectCommissions.map((comm: any) => (
                                    <TableRow key={comm.id}>
                                        <TableCell>{format(new Date(comm.createdAt), 'd MMM yyyy', { locale: pl })}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{comm.montage?.clientName || 'Nieznany'}</div>
                                            <div className="text-xs text-muted-foreground">{comm.montage?.installationCity}</div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(comm.amount / 100)}</TableCell>
                                        <TableCell>
                                            <Badge variant={comm.status === 'paid' ? 'default' : 'outline'}>
                                                {comm.status === 'paid' ? 'Wypłacono' : 
                                                 comm.status === 'approved' ? 'Zatwierdzono' : 'Oczekuje'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data.architectCommissions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            Brak historii prowizji.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* PARTNER SECTION */}
            {roles.includes('partner') && (
                <div className="space-y-6">
                    {data.partnerCommissions && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-green-500" />
                                    Prowizje Partnera
                                </CardTitle>
                                <CardDescription>Naliczone prowizje za polecenia.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Montaż</TableHead>
                                            <TableHead>Kwota</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {data.partnerCommissions.map((comm: any) => (
                                            <TableRow key={comm.id}>
                                                <TableCell>{format(new Date(comm.createdAt), 'd MMM yyyy', { locale: pl })}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{comm.montage?.clientName}</div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(comm.amount / 100)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={comm.status === 'paid' ? 'default' : 'outline'}>
                                                        {comm.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data.partnerCommissions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    Brak prowizji.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {data.partnerPayouts && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    Historia Wypłat (Partner)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Kwota</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Faktura</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {data.partnerPayouts.map((payout: any) => (
                                            <TableRow key={payout.id}>
                                                <TableCell>{format(new Date(payout.createdAt), 'd MMM yyyy', { locale: pl })}</TableCell>
                                                <TableCell>{formatCurrency(payout.amount / 100)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={payout.status === 'paid' ? 'default' : 'outline'}>
                                                        {payout.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {payout.invoiceUrl ? (
                                                        <a href={payout.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                            Pobierz
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data.partnerPayouts.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    Brak wypłat.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* INSTALLER SECTION */}
            {roles.includes('installer') && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Hammer className="h-5 w-5 text-orange-500" />
                            Ostatnie Zlecenia
                        </CardTitle>
                        <CardDescription>Lista ostatnich montaży lub pomiarów przypisanych do pracownika.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Klient</TableHead>
                                    <TableHead>Adres</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(data.installerMontages || data.measurerMontages || []).map((montage: any) => (
                                    <TableRow key={montage.id}>
                                        <TableCell className="font-medium">{montage.clientName}</TableCell>
                                        <TableCell>
                                            {montage.installationCity}, {montage.address}
                                        </TableCell>
                                        <TableCell>
                                            {montage.scheduledInstallationAt ? format(new Date(montage.scheduledInstallationAt), 'd MMM', { locale: pl }) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getStatusLabel(montage.status)}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!data.installerMontages?.length && !data.measurerMontages?.length) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            Brak przypisanych zleceń.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
