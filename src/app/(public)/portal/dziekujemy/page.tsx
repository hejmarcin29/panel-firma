import { CheckCircle2, CalendarCheck, ShieldCheck } from 'lucide-react';

export const metadata = {
    title: 'Płatność Przyjęta | Portal Klienta',
    description: 'Płatność została zaksięgowada pomyślnie.',
};

export default function PortalThankYouPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="bg-emerald-600 p-8 flex flex-col items-center justify-center text-white space-y-4">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-center">Płatność Przyjęta!</h1>
                    <p className="text-emerald-100 text-center text-sm">
                        Środki zostały zaksięgowane w naszym systemie.
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <CalendarCheck className="h-6 w-6 text-emerald-600 mt-1 shrink-0" />
                            <div className="space-y-1">
                                <h3 className="font-medium text-sm">Status zaktualizowany</h3>
                                <p className="text-xs text-muted-foreground">
                                    Status Twojego zlecenia zmienił się na &quot;Opłacone&quot;. Montażysta oraz biuro otrzymali powiadomienie.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <ShieldCheck className="h-6 w-6 text-blue-600 mt-1 shrink-0" />
                            <div className="space-y-1">
                                <h3 className="font-medium text-sm">Bezpieczna transakcja</h3>
                                <p className="text-xs text-muted-foreground">
                                    Potwierdzenie płatności (fakturę/paragon) otrzymasz drogą elektroniczną.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            Możesz bezpiecznie zamknąć to okno lub wrócić do swojego Portalu Klienta korzystając z linku w wiadomości SMS/E-mail.
                        </p>
                        
                        {/* Optional button if we had the token in query params, but safer to just tell them to check email */}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center space-y-2">
                <p className="text-xs text-muted-foreground">Prime Podłoga System</p>
            </div>
        </div>
    );
}
