import { requireUser } from '@/lib/auth/session';
import { getArchitectCommissions } from '@/app/dashboard/settings/team/actions';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Clock, CheckCircle2, TrendingUp, History, ArrowDownToLine, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Portfel',
};

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
    const user = await requireUser();

    if (!user.roles.includes('architect')) {
        redirect('/dashboard');
    }

    const commissions = await getArchitectCommissions(user.id);

    // Calculations
    const totalEarned = commissions.reduce((acc, curr) => acc + curr.amount, 0) / 100;
    const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0) / 100;
    const paidAmount = commissions.filter(c => c.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0) / 100;

    return (
        <div className='max-w-7xl mx-auto p-6 md:p-10 space-y-8'>
            {/* Header */}
            <div className='flex flex-col md:flex-row justify-between items-start md:items-end gap-4'>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight text-zinc-900'>Twój Portfel</h1>
                    <p className='text-zinc-500 mt-1'>Zarządzaj swoimi zarobkami i historią wypłat.</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                
                {/* 1. Total (Active) */}
                <div className='relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-between shadow-sm group hover:border-zinc-300 transition-all'>
                    <div className='absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-50 rounded-full blur-[60px] -translate-y-1/3 translate-x-1/3 pointer-events-none' />
                    
                    <div className='relative z-10 flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-emerald-50 rounded-lg'>
                            <Wallet className='h-5 w-5 text-emerald-600' />
                        </div>
                        <span className='text-sm font-medium text-zinc-600'>Łącznie Wypracowane</span>
                    </div>
                    
                    <div className='relative z-10'>
                        <div className='text-4xl font-bold text-zinc-900 tracking-tight'>
                            {formatCurrency(totalEarned)}
                        </div>
                        <div className='mt-2 text-xs text-zinc-500 flex items-center gap-1'>
                            <TrendingUp className='h-3 w-3 text-emerald-500' />
                            <span>Całkowita wartość prowizji</span>
                        </div>
                    </div>
                </div>

                {/* 2. Paid (Finished) */}
                <div className='relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-between shadow-sm group hover:border-zinc-300 transition-all'>
                    <div className='absolute top-0 right-0 w-[150px] h-[150px] bg-blue-50 rounded-full blur-[60px] -translate-y-1/3 translate-x-1/3 pointer-events-none' />
                    
                    <div className='relative z-10 flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-blue-50 rounded-lg'>
                            <CheckCircle2 className='h-5 w-5 text-blue-600' />
                        </div>
                        <span className='text-sm font-medium text-zinc-600'>Wypłacone Środki</span>
                    </div>
                    
                    <div className='relative z-10'>
                        <div className='text-4xl font-bold text-zinc-900 tracking-tight'>
                            {formatCurrency(paidAmount)}
                        </div>
                         <div className='mt-2 text-xs text-zinc-500 flex items-center gap-1'>
                            <ArrowDownToLine className='h-3 w-3 text-blue-500' />
                            <span>Zaksięgowane na koncie</span>
                        </div>
                    </div>
                </div>

                {/* 3. Pending (Waiting) */}
                <div className='relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-6 flex flex-col justify-between shadow-sm group hover:border-zinc-300 transition-all'>
                    <div className='absolute top-0 right-0 w-[150px] h-[150px] bg-amber-50 rounded-full blur-[60px] -translate-y-1/3 translate-x-1/3 pointer-events-none' />
                    
                    <div className='relative z-10 flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-amber-50 rounded-lg'>
                            <Clock className='h-5 w-5 text-amber-600' />
                        </div>
                        <span className='text-sm font-medium text-zinc-600'>Oczekujące</span>
                    </div>
                    
                    <div className='relative z-10'>
                        <div className='text-4xl font-bold text-zinc-900 tracking-tight'>
                            {formatCurrency(pendingAmount)}
                        </div>
                         <div className='mt-2 text-xs text-zinc-500 flex items-center gap-1'>
                            <span>W trakcie procesowania</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History List */}
            <div className='rounded-3xl bg-white border border-zinc-200 shadow-sm overflow-hidden'>
                <div className='p-6 border-b border-zinc-100 flex items-center justify-between'>
                    <h2 className='text-lg font-bold text-zinc-900 flex items-center gap-2'>
                        <History className='h-4 w-4 text-zinc-400' />
                        Historia Operacji
                    </h2>
                </div>

                <div className='divide-y divide-zinc-100'>
                    {commissions.length === 0 ? (
                        <div className='p-12 text-center text-zinc-500'>
                            Brak historii transakcji.
                        </div>
                    ) : (
                        commissions.map((commission) => (
                            <div key={commission.id} className='p-4 hover:bg-zinc-50/50 transition-colors flex items-center justify-between group'>
                                <div className='flex items-center gap-4'>
                                    {/* Icon based on status */}
                                    <div className={\h-10 w-10 rounded-full flex items-center justify-center border \\}>
                                        {commission.status === 'paid' ? (
                                            <ArrowDownToLine className='h-5 w-5' />
                                        ) : (
                                            <Clock className='h-5 w-5' />
                                        )}
                                    </div>

                                    <div>
                                        <div className='font-medium text-zinc-900 flex items-center gap-2'>
                                            {commission.montage ? (
                                                 <Link href={\/dashboard/crm/montaze/\\} className='hover:text-indigo-600 transition-colors flex items-center gap-1'>
                                                    {commission.montage.clientName}
                                                    <ArrowUpRight className='h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity' />
                                                </Link>
                                            ) : (
                                                <span className='text-zinc-500 italic'>Usunięty montaż</span>
                                            )}
                                        </div>
                                        <div className='text-xs text-zinc-500 flex items-center gap-2 mt-0.5'>
                                            <span>
                                                {new Date(commission.createdAt).toLocaleDateString('pl-PL', { 
                                                    day: 'numeric', 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                })}
                                            </span>
                                            {commission.montage && commission.montage.installationCity && (
                                                <>
                                                    <span className='w-1 h-1 rounded-full bg-zinc-300' />
                                                    <span>{commission.montage.installationCity}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className='text-right'>
                                    <div className={\ont-bold text-lg \\}>
                                        +{formatCurrency(commission.amount / 100)}
                                    </div>
                                    <div className={\	ext-xs font-medium uppercase tracking-wider \\}>
                                        {commission.status === 'paid' ? 'Wypłacone' : 'Oczekujące'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
