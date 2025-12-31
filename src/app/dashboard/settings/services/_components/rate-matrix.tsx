'use client';

import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { updateInstallerRate } from '../actions';
import type { services, users, userServiceRates } from '@/lib/db/schema';

type Service = typeof services.$inferSelect;
type User = typeof users.$inferSelect & {
    serviceRates: (typeof userServiceRates.$inferSelect)[];
};

interface RateMatrixProps {
    services: Service[];
    installers: User[];
}

export function RateMatrix({ services, installers }: RateMatrixProps) {
    // const [updating, setUpdating] = useState<string | null>(null);

    const handleRateChange = async (userId: string, serviceId: string, value: string) => {
        const rate = parseFloat(value);
        if (isNaN(rate)) return;

        // const key = `${userId}-${serviceId}`;
        // setUpdating(key);

        try {
            await updateInstallerRate(userId, serviceId, rate);
            toast.success('Stawka zaktualizowana');
        } catch {
            toast.error('Błąd aktualizacji stawki');
        } finally {
            // setUpdating(null);
        }
    };

    return (
        <div className="space-y-4 overflow-x-auto">
            <div className="rounded-md border min-w-[800px]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px] sticky left-0 bg-background z-10">Usługa / Jednostka</TableHead>
                            <TableHead className="w-[100px] bg-muted/50">Bazowa (Netto)</TableHead>
                            {installers.map(installer => (
                                <TableHead key={installer.id} className="min-w-[120px] text-center">
                                    {installer.name || installer.email} <span className="text-xs font-normal text-muted-foreground">(Netto)</span>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                                    {service.name} <span className="text-muted-foreground text-xs">({service.unit})</span>
                                </TableCell>
                                <TableCell className="bg-muted/20 border-r">
                                    {service.baseInstallerRate?.toFixed(2)}
                                </TableCell>
                                {installers.map(installer => {
                                    const userRate = installer.serviceRates.find(r => r.serviceId === service.id);
                                    const currentRate = userRate ? userRate.customRate : service.baseInstallerRate;
                                    const isCustom = !!userRate;
                                    const isMissing = !currentRate || currentRate === 0;

                                    return (
                                        <TableCell key={installer.id} className="p-2">
                                            <Input 
                                                type="number" 
                                                step="0.01"
                                                className={`h-8 text-center ${
                                                    isMissing 
                                                        ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-300' 
                                                        : isCustom 
                                                            ? 'font-bold bg-primary/5' 
                                                            : 'text-muted-foreground'
                                                }`}
                                                defaultValue={currentRate || 0}
                                                placeholder={isMissing ? "Brak!" : ""}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    // Only update if value changed and is valid number
                                                    if (!isNaN(val) && val !== currentRate) {
                                                        handleRateChange(installer.id, service.id, e.target.value);
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <p className="text-xs text-muted-foreground">
                * Pogrubione wartości oznaczają stawki indywidualne. Szare to stawki bazowe z katalogu.
            </p>
        </div>
    );
}
