'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, MapPin, Package, Hammer, ExternalLink, Building2, Trash2 } from 'lucide-react';
import { CustomerDetails, deleteCustomer } from '../actions';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

interface CustomerDetailsSheetProps {
	customer: CustomerDetails | null;
	isOpen: boolean;
	onClose: () => void;
}

function getInitials(name: string) {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat('pl-PL', {
		style: 'currency',
		currency: 'PLN',
	}).format(amount / 100); // Assuming amount is in grosze
}

const STATUS_LABELS: Record<string, string> = {
  'lead': 'Lead',
  'before_measurement': 'Przed pomiarem',
  'before_first_payment': 'Przed 1. wpłatą',
  'before_installation': 'Przed montażem',
  'before_final_invoice': 'Przed FV i protokołem',
  'completed': 'Zakończony',
  'cancelled': 'Anulowany',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  'order.received': 'Otrzymano',
  'order.pending_proforma': 'Oczekuje na proformę',
  'order.proforma_issued': 'Wystawiono proformę',
  'order.awaiting_payment': 'Oczekuje na płatność',
  'order.paid': 'Opłacono',
  'order.advance_invoice': 'Faktura zaliczkowa',
  'order.forwarded_to_supplier': 'Przekazano do dostawcy',
  'order.fulfillment_confirmed': 'Potwierdzono realizację',
  'order.final_invoice': 'Faktura końcowa',
  'order.closed': 'Zamknięte',
};

export function CustomerDetailsSheet({ customer, isOpen, onClose }: CustomerDetailsSheetProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle back button
    useEffect(() => {
        if (isOpen) {
            window.history.pushState({ modalOpen: true }, '', window.location.href);
            
            const handlePopState = () => {
                onClose();
            };

            window.addEventListener('popstate', handlePopState);
            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [isOpen, onClose]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
            if (window.history.state?.modalOpen) {
                window.history.back();
            }
        }
    };

	if (!customer) return null;

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl p-0 gap-0 bg-background/95 backdrop-blur-sm">
                <DialogHeader className="sr-only">
                    <DialogTitle>Szczegóły klienta {customer.name}</DialogTitle>
                </DialogHeader>
				<ScrollArea className="h-full w-full">
					<div className="p-6 space-y-8">
						{/* Header Section */}
						<div className="flex flex-col items-center text-center space-y-4 pt-4">
							<Avatar className="h-24 w-24 text-2xl border-4 border-background shadow-xl">
								<AvatarFallback className="bg-primary/10 text-primary font-bold">
									{getInitials(customer.name)}
								</AvatarFallback>
							</Avatar>
							<div>
								<h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
								{customer.taxId && (
									<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
										<Building2 className="h-3 w-3" /> NIP: {customer.taxId}
									</p>
								)}
							</div>
							
							<div className="flex gap-3 w-full max-w-xs">
								{customer.phone && (
									<Button className="flex-1 gap-2" asChild>
										<a href={`tel:${customer.phone}`}>
											<Phone className="h-4 w-4" /> Zadzwoń
										</a>
									</Button>
								)}
								{customer.email && (
									<Button variant="outline" className="flex-1 gap-2" asChild>
										<a href={`mailto:${customer.email}`}>
											<Mail className="h-4 w-4" /> Napisz
										</a>
									</Button>
								)}
							</div>
						</div>

						<Separator />

						{/* Contact & Address */}
						<div className="grid gap-6 md:grid-cols-2">
							<div className="space-y-3">
								<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dane kontaktowe</h3>
								<div className="space-y-2">
									{customer.email && (
										<div className="flex items-center gap-2 text-sm">
											<Mail className="h-4 w-4 text-muted-foreground" />
											<span className="select-all">{customer.email}</span>
										</div>
									)}
									{customer.phone && (
										<div className="flex items-center gap-2 text-sm">
											<Phone className="h-4 w-4 text-muted-foreground" />
											<span className="select-all">{customer.phone}</span>
										</div>
									)}
								</div>
							</div>

							<div className="space-y-3">
								<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Adres rozliczeniowy</h3>
								<div className="flex items-start gap-2 text-sm">
									<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
									<div className="space-y-0.5">
										<p>{customer.billingStreet || '-'}</p>
										<p>{customer.billingPostalCode} {customer.billingCity}</p>
										<p className="text-muted-foreground">{customer.billingCountry}</p>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Recent Orders */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
									<Package className="h-4 w-4" /> Ostatnie zamówienia
								</h3>
								<Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
									<Link href={`/dashboard/orders?customer=${customer.id}`}>Zobacz wszystkie</Link>
								</Button>
							</div>
							
							{customer.orders.length > 0 ? (
								<div className="grid gap-3">
									{customer.orders.map((order) => (
										<Link 
											key={order.id} 
											href={`/dashboard/orders/${order.id}`}
											className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
										>
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-sm">Zamówienie</span>
													<span className="text-xs text-muted-foreground">
														{format(order.createdAt, 'dd MMM yyyy', { locale: pl })}
													</span>
												</div>
												<div className="text-xs text-muted-foreground">
													{formatCurrency(order.totalGross)}
												</div>
											</div>
											<div className="flex items-center gap-3">
												<Badge variant="secondary" className="text-xs font-normal">
													{ORDER_STATUS_LABELS[order.status] || order.status}
												</Badge>
												<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
											</div>
										</Link>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground italic">Brak zamówień.</p>
							)}
						</div>

						{/* Recent Montages */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
									<Hammer className="h-4 w-4" /> Ostatnie montaże
								</h3>
							</div>
							
							{customer.montages.length > 0 ? (
								<div className="grid gap-3">
									{customer.montages.map((montage) => (
										<Link 
											key={montage.id} 
											href={`/dashboard/montaze/${montage.id}`}
											className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
										>
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-sm">Montaż</span>
													<span className="text-xs text-muted-foreground">
														{montage.scheduledInstallationAt 
															? format(montage.scheduledInstallationAt, 'dd MMM yyyy', { locale: pl })
															: 'Nie zaplanowano'}
													</span>
												</div>
												<div className="text-xs text-muted-foreground truncate max-w-[200px]">
													{montage.installationCity}, {montage.installationAddress}
												</div>
											</div>
											<div className="flex items-center gap-3">
												<Badge variant="outline" className="text-xs font-normal">
													{STATUS_LABELS[montage.status] || montage.status}
												</Badge>
												<ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
											</div>
										</Link>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground italic">Brak powiązanych montaży (po emailu).</p>
							)}
						</div>

                        <div className="pt-6 border-t mt-6">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Usuń klienta
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Czy na pewno chcesz usunąć tego klienta?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Klient zostanie przeniesiony do kosza. Będziesz mógł go przywrócić w ustawieniach przez 365 dni.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={async () => {
                                                setIsDeleting(true);
                                                try {
                                                    await deleteCustomer(customer.id);
                                                    toast.success('Klient został usunięty');
                                                    onClose();
                                                } catch {
                                                    toast.error('Błąd podczas usuwania klienta');
                                                } finally {
                                                    setIsDeleting(false);
                                                }
                                            }}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            {isDeleting ? 'Usuwanie...' : 'Usuń'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
