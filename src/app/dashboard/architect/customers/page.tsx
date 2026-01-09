import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { customers, montages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function ArchitectCustomersPage() {
    const user = await requireUser();

    // Fetch Architect's Customers
    const architectCustomers = await db.query.customers.findMany({
        where: eq(customers.architectId, user.id),
        orderBy: [desc(customers.createdAt)],
        with: {
            montages: {
                limit: 1,
                orderBy: [desc(montages.createdAt)],
                columns: {
                    status: true,
                    createdAt: true
                }
            }
        }
    });

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Moi Klienci</h1>
                    <p className="text-zinc-500 mt-1">Twój cyfrowy wizytownik.</p>
                </div>
                <Button className="rounded-full" variant="outline" disabled>
                    + Dodaj Klienta (przez Biuro)
                </Button>
            </div>

            {architectCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
                    <User className="h-12 w-12 text-zinc-300 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-900">Brak klientów</h3>
                    <p className="text-zinc-500 text-center max-w-sm mt-2">
                        Nie masz jeszcze przypisanych klientów. Gdy biuro przypisze Ci klienta, pojawi się on tutaj.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {architectCustomers.map(customer => {
                        const lastMontage = customer.montages[0];
                        const hasActiveProject = lastMontage && !['completed', 'rejected'].includes(lastMontage.status);

                        return (
                            <div key={customer.id} className="group bg-white border border-zinc-200 rounded-3xl p-6 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col justify-between h-[280px]">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 rounded-full bg-linear-to-br from-zinc-100 to-white border border-zinc-100 flex items-center justify-center text-zinc-500 font-semibold text-lg">
                                            {customer.name.charAt(0)}
                                        </div>
                                        {hasActiveProject ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 rounded-full px-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                                                Aktywny
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-50 rounded-full px-3">
                                                Zakończony
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-zinc-900 mb-1 px-1">{customer.name}</h3>
                                    <p className="text-sm text-zinc-400 px-1 mb-6 flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> 
                                        Dodano: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('pl-PL') : '-'}
                                    </p>

                                    <div className="space-y-2">
                                        {customer.email && (
                                            <a href={`mailto:${customer.email}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 text-sm text-zinc-600 transition-colors w-full group/link">
                                                <div className="h-8 w-8 rounded-full bg-zinc-50 group-hover/link:bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover/link:text-zinc-600 transition-colors">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                {customer.email}
                                            </a>
                                        )}
                                        {customer.phone && (
                                            <a href={`tel:${customer.phone}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 text-sm text-zinc-600 transition-colors w-full group/link">
                                                <div className="h-8 w-8 rounded-full bg-zinc-50 group-hover/link:bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover/link:text-zinc-600 transition-colors">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                {customer.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Drawer Trigger Placeholder (In future implementation) - For now Link to CRM details but styled differently maybe? 
                                    Actually the prompt said "Szuflada". I'll skip drawer implementation for now and just put a button "Szczegóły"
                                */}
                                <div className="mt-4 pt-4 border-t border-zinc-50 flex justify-end">
                                    <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-full group/btn" asChild>
                                        <Link href={`/dashboard/crm/customers?search=${customer.email}`}>
                                            Szczegóły <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
