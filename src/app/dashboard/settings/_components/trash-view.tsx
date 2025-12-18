'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

import { 
    restoreQuote, 
    permanentDeleteQuote, 
    restoreCustomer, 
    permanentDeleteCustomer, 
    restoreMontage, 
    permanentDeleteMontage,
    bulkRestoreCustomers,
    bulkDeleteCustomers
} from '../actions';
import { restoreProduct, permanentDeleteProduct } from '../../products/actions';

interface DeletedQuote {
    id: string;
    number: string | null;
    totalNet: number;
    totalGross: number;
    deletedAt: Date | null;
    montage: {
        clientName: string;
        installationAddress: string | null;
    };
}

interface DeletedCustomer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    deletedAt: Date | null;
}

interface DeletedMontage {
    id: string;
    clientName: string;
    installationAddress: string | null;
    status: string;
    deletedAt: Date | null;
}

interface DeletedProduct {
    id: number;
    name: string;
    sku: string | null;
    price: string | null;
    deletedAt: Date | null;
}

interface TrashViewProps {
    deletedQuotes: DeletedQuote[];
    deletedCustomers: DeletedCustomer[];
    deletedMontages: DeletedMontage[];
    deletedProducts: DeletedProduct[];
}

export function TrashView({ deletedQuotes, deletedCustomers, deletedMontages, deletedProducts }: TrashViewProps) {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

    const handleRestoreQuote = async (id: string) => {
        setIsProcessing(id);
        try {
            await restoreQuote(id);
            toast.success('Wycena została przywrócona');
        } catch {
            toast.error('Błąd podczas przywracania wyceny');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeleteQuote = async (id: string) => {
        setIsProcessing(id);
        try {
            await permanentDeleteQuote(id);
            toast.success('Wycena została trwale usunięta');
        } catch {
            toast.error('Błąd podczas usuwania wyceny');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleRestoreCustomer = async (id: string) => {
        setIsProcessing(id);
        try {
            await restoreCustomer(id);
            toast.success('Klient został przywrócony');
        } catch {
            toast.error('Błąd podczas przywracania klienta');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeleteCustomer = async (id: string) => {
        setIsProcessing(id);
        try {
            await permanentDeleteCustomer(id);
            toast.success('Klient został trwale usunięty');
        } catch {
            toast.error('Błąd podczas usuwania klienta');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleRestoreMontage = async (id: string) => {
        setIsProcessing(id);
        try {
            await restoreMontage(id);
            toast.success('Montaż został przywrócony');
        } catch {
            toast.error('Błąd podczas przywracania montażu');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeleteMontage = async (id: string) => {
        setIsProcessing(id);
        try {
            await permanentDeleteMontage(id);
            toast.success('Montaż został trwale usunięty');
        } catch {
            toast.error('Błąd podczas usuwania montażu');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleRestoreProduct = async (id: number) => {
        setIsProcessing(id.toString());
        try {
            await restoreProduct(id);
            toast.success('Produkt został przywrócony');
        } catch {
            toast.error('Błąd podczas przywracania produktu');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeleteProduct = async (id: number) => {
        setIsProcessing(id.toString());
        try {
            await permanentDeleteProduct(id);
            toast.success('Produkt został trwale usunięty');
        } catch {
            toast.error('Błąd podczas usuwania produktu');
        } finally {
            setIsProcessing(null);
        }
    };

    const toggleSelectAllCustomers = () => {
        if (selectedCustomers.length === deletedCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(deletedCustomers.map(c => c.id));
        }
    };

    const toggleSelectCustomer = (id: string) => {
        if (selectedCustomers.includes(id)) {
            setSelectedCustomers(selectedCustomers.filter(cId => cId !== id));
        } else {
            setSelectedCustomers([...selectedCustomers, id]);
        }
    };

    const handleBulkRestoreCustomers = async () => {
        if (selectedCustomers.length === 0) return;
        setIsProcessing('bulk-restore');
        try {
            await bulkRestoreCustomers(selectedCustomers);
            toast.success(`Przywrócono ${selectedCustomers.length} klientów`);
            setSelectedCustomers([]);
        } catch {
            toast.error('Błąd podczas przywracania klientów');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleBulkDeleteCustomers = async () => {
        if (selectedCustomers.length === 0) return;
        setIsProcessing('bulk-delete');
        try {
            await bulkDeleteCustomers(selectedCustomers);
            toast.success(`Trwale usunięto ${selectedCustomers.length} klientów`);
            setSelectedCustomers([]);
        } catch {
            toast.error('Błąd podczas usuwania klientów');
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kosz</CardTitle>
                <CardDescription>
                    Elementy usunięte z systemu. Możesz je przywrócić lub usunąć trwale.
                    Automatyczne czyszczenie następuje po 365 dniach.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="quotes">
                    <TabsList className="mb-4">
                        <TabsTrigger value="quotes">Wyceny ({deletedQuotes.length})</TabsTrigger>
                        <TabsTrigger value="customers">Klienci ({deletedCustomers.length})</TabsTrigger>
                        <TabsTrigger value="montages">Montaże ({deletedMontages.length})</TabsTrigger>
                        <TabsTrigger value="products">Produkty ({deletedProducts.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="quotes">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Numer</TableHead>
                                        <TableHead>Klient</TableHead>
                                        <TableHead>Wartość</TableHead>
                                        <TableHead>Data usunięcia</TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedQuotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Kosz jest pusty
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        deletedQuotes.map((quote) => (
                                            <TableRow key={quote.id}>
                                                <TableCell className="font-mono">
                                                    {quote.number || quote.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{quote.montage.clientName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {quote.montage.installationAddress}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(quote.totalGross)}
                                                </TableCell>
                                                <TableCell>
                                                    {quote.deletedAt && format(new Date(quote.deletedAt), 'dd MMM yyyy HH:mm', { locale: pl })}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRestoreQuote(quote.id)}
                                                        disabled={isProcessing === quote.id}
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Przywróć
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={isProcessing === quote.id}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Usuń trwale
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tej operacji nie można cofnąć. Wycena zostanie trwale usunięta z bazy danych.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteQuote(quote.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Usuń trwale
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="customers">
                        <div className="space-y-4">
                            {selectedCustomers.length > 0 && (
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{selectedCustomers.length} zaznaczonych</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleBulkRestoreCustomers}
                                            disabled={isProcessing === 'bulk-restore'}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Przywróć zaznaczone
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={isProcessing === 'bulk-delete'}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Usuń zaznaczone
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tej operacji nie można cofnąć. {selectedCustomers.length} klientów zostanie trwale usuniętych z bazy danych.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleBulkDeleteCustomers}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Usuń trwale
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox 
                                                    checked={deletedCustomers.length > 0 && selectedCustomers.length === deletedCustomers.length}
                                                    onCheckedChange={toggleSelectAllCustomers}
                                                    aria-label="Zaznacz wszystkich"
                                                />
                                            </TableHead>
                                            <TableHead>Nazwa</TableHead>
                                            <TableHead>Kontakt</TableHead>
                                            <TableHead>Data usunięcia</TableHead>
                                            <TableHead className="text-right">Akcje</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deletedCustomers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                    Kosz jest pusty
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            deletedCustomers.map((customer) => (
                                                <TableRow key={customer.id}>
                                                    <TableCell>
                                                        <Checkbox 
                                                            checked={selectedCustomers.includes(customer.id)}
                                                            onCheckedChange={() => toggleSelectCustomer(customer.id)}
                                                            aria-label={`Zaznacz klienta ${customer.name}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {customer.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">{customer.email}</div>
                                                        <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.deletedAt && format(new Date(customer.deletedAt), 'dd MMM yyyy HH:mm', { locale: pl })}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRestoreCustomer(customer.id)}
                                                            disabled={isProcessing === customer.id}
                                                        >
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Przywróć
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    disabled={isProcessing === customer.id}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Usuń trwale
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Tej operacji nie można cofnąć. Klient zostanie trwale usunięty z bazy danych.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteCustomer(customer.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Usuń trwale
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="montages">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Klient</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data usunięcia</TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedMontages.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Kosz jest pusty
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        deletedMontages.map((montage) => (
                                            <TableRow key={montage.id}>
                                                <TableCell className="font-mono">
                                                    {montage.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{montage.clientName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {montage.installationAddress}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{montage.status}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {montage.deletedAt && format(new Date(montage.deletedAt), 'dd MMM yyyy HH:mm', { locale: pl })}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRestoreMontage(montage.id)}
                                                        disabled={isProcessing === montage.id}
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Przywróć
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={isProcessing === montage.id}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Usuń trwale
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tej operacji nie można cofnąć. Montaż zostanie trwale usunięty z bazy danych.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteMontage(montage.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Usuń trwale
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="products">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nazwa</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Cena</TableHead>
                                        <TableHead>Data usunięcia</TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Kosz jest pusty
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        deletedProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell>
                                                    {product.sku || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {product.price ? formatCurrency(parseFloat(product.price) * 100) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {product.deletedAt && format(new Date(product.deletedAt), 'dd MMM yyyy HH:mm', { locale: pl })}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRestoreProduct(product.id)}
                                                        disabled={isProcessing === product.id.toString()}
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Przywróć
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={isProcessing === product.id.toString()}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Usuń trwale
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tej operacji nie można cofnąć. Produkt zostanie trwale usunięty z bazy danych.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteProduct(product.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Usuń trwale
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
