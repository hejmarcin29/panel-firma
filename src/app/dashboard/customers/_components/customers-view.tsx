'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Loader2, User, Phone, Mail, MapPin } from 'lucide-react';
import { CustomerWithStats, CustomerDetails, getCustomers, getCustomerDetails } from '../actions';
import { CustomerDetailsSheet } from './customer-details-sheet';
import { useDebouncedCallback } from 'use-debounce';

interface CustomersViewProps {
	initialCustomers: CustomerWithStats[];
}

function getInitials(name: string) {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

// Generate a consistent pastel color based on the name string
function getAvatarColor(name: string) {
    const colors = [
        'bg-red-100 text-red-700',
        'bg-orange-100 text-orange-700',
        'bg-amber-100 text-amber-700',
        'bg-yellow-100 text-yellow-700',
        'bg-lime-100 text-lime-700',
        'bg-green-100 text-green-700',
        'bg-emerald-100 text-emerald-700',
        'bg-teal-100 text-teal-700',
        'bg-cyan-100 text-cyan-700',
        'bg-sky-100 text-sky-700',
        'bg-blue-100 text-blue-700',
        'bg-indigo-100 text-indigo-700',
        'bg-violet-100 text-violet-700',
        'bg-purple-100 text-purple-700',
        'bg-fuchsia-100 text-fuchsia-700',
        'bg-pink-100 text-pink-700',
        'bg-rose-100 text-rose-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function CustomersView({ initialCustomers }: CustomersViewProps) {
	const [customers, setCustomers] = useState<CustomerWithStats[]>(initialCustomers);
	const [isPending, startTransition] = useTransition();
	const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

	const handleSearch = useDebouncedCallback((term: string) => {
		startTransition(async () => {
			const results = await getCustomers(term);
			setCustomers(results);
		});
	}, 300);

	const handleCustomerClick = async (customerId: string) => {
        setIsFetchingDetails(true);
        try {
            const details = await getCustomerDetails(customerId);
            setSelectedCustomer(details);
            setIsSheetOpen(true);
        } catch (error) {
            console.error("Failed to fetch customer details", error);
        } finally {
            setIsFetchingDetails(false);
        }
	};

	return (
		<div className="space-y-4">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Szukaj klienta (nazwa, email, telefon, miasto)..."
					className="pl-9 h-12 text-base"
					onChange={(e) => handleSearch(e.target.value)}
				/>
				{isPending && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>

			<div className="rounded-md border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]"></TableHead>
							<TableHead>Klient</TableHead>
							<TableHead className="hidden md:table-cell">Kontakt</TableHead>
							<TableHead className="hidden md:table-cell">Lokalizacja</TableHead>
							<TableHead className="text-center">Historia</TableHead>
							<TableHead className="w-[50px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{customers.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
									Brak wyników wyszukiwania.
								</TableCell>
							</TableRow>
						) : (
							customers.map((customer) => (
								<TableRow 
                                    key={customer.id} 
                                    className="cursor-pointer hover:bg-muted/50 h-16"
                                    onClick={() => handleCustomerClick(customer.id)}
                                >
									<TableCell>
										<Avatar className="h-10 w-10">
											<AvatarFallback className={getAvatarColor(customer.name)}>
												{getInitials(customer.name)}
											</AvatarFallback>
										</Avatar>
									</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium text-base">{customer.name}</span>
											{customer.taxId && (
												<span className="text-xs text-muted-foreground">NIP: {customer.taxId}</span>
											)}
										</div>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<div className="flex flex-col gap-1 text-sm">
											{customer.phone && (
												<div className="flex items-center gap-1.5 text-muted-foreground">
													<Phone className="h-3 w-3" /> {customer.phone}
												</div>
											)}
											{customer.email && (
												<div className="flex items-center gap-1.5 text-muted-foreground">
													<Mail className="h-3 w-3" /> {customer.email}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{(customer.billingCity || customer.billingStreet) ? (
											<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
												<MapPin className="h-3 w-3" />
												<span>{customer.billingCity} {customer.billingStreet ? `, ${customer.billingStreet}` : ''}</span>
											</div>
										) : (
											<span className="text-xs text-muted-foreground italic">-</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										<div className="flex items-center justify-center gap-2">
                                            {customer.ordersCount > 0 && (
                                                <Badge variant="secondary" className="text-xs font-normal bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                    {customer.ordersCount} zam.
                                                </Badge>
                                            )}
                                            {customer.montagesCount > 0 && (
                                                <Badge variant="secondary" className="text-xs font-normal bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                                                    {customer.montagesCount} mont.
                                                </Badge>
                                            )}
                                            {customer.ordersCount === 0 && customer.montagesCount === 0 && (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
										</div>
									</TableCell>
									<TableCell>
                                        {isFetchingDetails && selectedCustomer?.id === customer.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : (
										    <Button variant="ghost" size="icon" className="h-8 w-8">
											    <User className="h-4 w-4 text-muted-foreground" />
										    </Button>
                                        )}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<CustomerDetailsSheet 
				customer={selectedCustomer} 
				isOpen={isSheetOpen} 
				onClose={() => setIsSheetOpen(false)} 
			/>
		</div>
	);
}
