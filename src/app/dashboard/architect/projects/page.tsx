import { requireUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { montages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, FolderOpen, Coins } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function getProgressStep(status: string) {
    const s = status || 'new_lead';
    
    // 1. Wstępny
    if (['new_lead', 'lead_contact', 'lead_samples_pending', 'lead_samples_sent', 'lead_pre_estimate'].includes(s)) return 1;
    // 2. Pomiar
    if (['measurement_to_schedule', 'measurement_scheduled', 'measurement_done'].includes(s)) return 2;
    // 3. Wycena
    if (['quote_in_progress', 'quote_sent', 'quote_accepted'].includes(s)) return 3;
    // 4. Realizacja (Formalności + Logistyka + Montaż)
    if (['contract_signed', 'waiting_for_deposit', 'deposit_paid', 'materials_ordered', 'materials_pickup_ready', 'installation_scheduled', 'materials_delivered', 'installation_in_progress'].includes(s)) return 4;
    // 5. Finał
    if (['protocol_signed', 'final_invoice_issued', 'final_settlement', 'completed'].includes(s)) return 5;
    
    return 0; // Rejected / On Hold / Other
}

export default async function ArchitectProjectsPage() {
    const user = await requireUser();

    // Fetch Architect's Projects
    const projects = await db.query.montages.findMany({
        where: eq(montages.architectId, user.id),
        orderBy: [desc(montages.createdAt)],
        with: {
            customer: true,
            commissions: true
        }
    });

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
            <div className="flex justify-between items-end">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Moje Projekty</h1>
                    <p className="text-zinc-500 mt-1">Galeria Twoich realizacji.</p>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
                    <FolderOpen className="h-12 w-12 text-zinc-300 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-900">Brak projektów</h3>
                    <p className="text-zinc-500 text-center max-w-sm mt-2">
                        Nie masz jeszcze przypisanych realizacji.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {projects.map(project => {
                         const currentStep = getProgressStep(project.status);
                         // Estimated commission: sum of all commissions for this montage
                         const totalCommission = project.commissions.reduce((acc, curr) => acc + curr.amount, 0);
                         
                         return (
                            <div key={project.id} className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:border-zinc-300 transition-all flex flex-col lg:flex-row gap-8 items-center lg:items-center">
                                {/* Left: Info */}
                                <div className="w-full lg:w-1/4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                                            {project.clientName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-zinc-900 leading-tight">{project.clientName}</h3>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-0.5">
                                                {project.installationCity || 'Brak lokalizacji'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <MapPin className="h-4 w-4 text-zinc-400" />
                                        {project.installationAddress || 'Adres nieznany'}
                                    </div>
                                </div>

                                {/* Center: Progress Bar */}
                                <div className="w-full lg:w-2/4">
                                    <div className="relative">
                                        {/* Line */}
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -translate-y-1/2 rounded-full" />
                                        <div 
                                            className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-500" 
                                            style={{ width: `${Math.max(5, (currentStep - 1) * 25)}%` }}
                                        />

                                        {/* Steps */}
                                        <div className="relative flex justify-between">
                                            {['Wstępny', 'Pomiar', 'Wycena', 'Realizacja', 'Finał'].map((stepName, idx) => {
                                                const stepNum = idx + 1;
                                                const isActive = currentStep >= stepNum;
                                                const isCurrent = currentStep === stepNum;

                                                return (
                                                    <div key={stepName} className="flex flex-col items-center gap-2">
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full border-2 transition-colors duration-300 z-10",
                                                            isActive ? "bg-indigo-600 border-indigo-600" : "bg-white border-zinc-200",
                                                            isCurrent && "ring-4 ring-indigo-50"
                                                        )} />
                                                        <span className={cn(
                                                            "text-xs font-medium transition-colors duration-300 absolute top-6 w-20 text-center",
                                                            isActive ? "text-indigo-700" : "text-zinc-400"
                                                        )}>
                                                            {stepName}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Stats & Action */}
                                <div className="w-full lg:w-1/4 flex flex-row lg:flex-col justify-between lg:justify-center items-center lg:items-end gap-2 lg:gap-1 pl-0 lg:pl-8 lg:border-l border-zinc-100 h-full">
                                    <div className="text-right">
                                        <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1 justify-end">
                                            <Coins className="h-3 w-3" /> Prowizja
                                        </div>
                                        <div className="text-xl font-bold text-zinc-900 tracking-tight">
                                            {formatCurrency(totalCommission / 100)}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                        {/* Link to old details for now, or just read-only */}
                                        <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-full h-8 text-xs px-3" asChild>
                                             <Link href={`/dashboard/crm/montaze/${project.id}`}>
                                                Podgląd <ArrowRight className="ml-1 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                         )
                    })}
                </div>
            )}
        </div>
    );
}
