'use client';

import { useTransition, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Truck, StickyNote, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { confirmManualOrder } from '../actions';
import type { Order } from '../data';

type ConfirmOrderButtonProps = {
  order: Order;
  disabled?: boolean;
  className?: string;
};

export function ConfirmOrderButton({ order, disabled = false, className }: ConfirmOrderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'production' | 'sample'>('production');

  useEffect(() => {
    if (isOpen && order.paymentMethod) {
        const isTpay = order.paymentMethod.toLowerCase().includes('tpay');
        setSelectedType(isTpay ? 'sample' : 'production');
    }
  }, [isOpen, order.paymentMethod]);

  const handleConfirm = () => {
    if (disabled || isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await confirmManualOrder(order.id, selectedType);
        setIsOpen(false);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nie udalo sie potwierdzic zamowienia.';
        setError(message);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className={className}>
          Potwierdź zamówienie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Weryfikacja zamówienia {order.reference}</DialogTitle>
          <DialogDescription>
            Sprawdź szczegóły zamówienia i wybierz odpowiedni proces realizacji.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            {/* Order Context */}
            <div className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                        <Package className="h-4 w-4 text-primary" />
                        <span>Zawartość zamówienia</span>
                    </div>
                    <ScrollArea className="h-[100px] pr-4">
                        <div className="space-y-2 text-sm">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">{item.product}</span>
                                    <span className="font-medium whitespace-nowrap">{item.quantity} szt.</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                            <Truck className="h-4 w-4 text-primary" />
                            <span>Adres dostawy</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                            {order.shipping.sameAsBilling ? (
                                <>
                                    <p>{order.billing.name}</p>
                                    <p>{order.billing.street}</p>
                                    <p>{order.billing.postalCode} {order.billing.city}</p>
                                </>
                            ) : (
                                <>
                                    <p>{order.shipping.name}</p>
                                    <p>{order.shipping.street}</p>
                                    <p>{order.shipping.postalCode} {order.shipping.city}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span>Płatność i Dostawa</span>
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Metoda płatności:</span>
                                <span className="font-medium text-right">{order.paymentMethod || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dostawa:</span>
                                <span className="font-medium text-right">{order.shippingMethod || '-'}</span>
                            </div>
                            <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
                                <span className="text-muted-foreground">Łącznie:</span>
                                <span className="font-bold">
                                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: order.currency }).format(order.totals.totalGross)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {order.customerNote && (
                        <div className="rounded-md border bg-muted/30 p-3">
                            <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                                <StickyNote className="h-4 w-4 text-primary" />
                                <span>Notatka klienta</span>
                            </div>
                            <p className="text-sm text-muted-foreground italic">
                                &quot;{order.customerNote}&quot;
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* Decision */}
            <div className="space-y-3">
                <Label className="text-base">Wybierz typ realizacji</Label>
                <RadioGroup
                    value={selectedType}
                    onValueChange={(val) => setSelectedType(val as 'production' | 'sample')}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <div className="flex items-start space-x-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 cursor-pointer relative">
                        <RadioGroupItem value="production" id="production" className="mt-1" />
                        <Label htmlFor="production" className="flex flex-col gap-1 cursor-pointer w-full">
                            <span className="font-semibold">Paleta / Standard</span>
                            <span className="text-xs text-muted-foreground">Dla zamówień paletowych i standardowych paczek.</span>
                        </Label>
                    </div>
                    <div className="flex items-start space-x-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 cursor-pointer relative">
                        <RadioGroupItem value="sample" id="sample" className="mt-1" />
                        <Label htmlFor="sample" className="flex flex-col gap-1 cursor-pointer w-full">
                            <span className="font-semibold">Próbki / Mała paczka</span>
                            <span className="text-xs text-muted-foreground">Szybka ścieżka dla próbek i akcesoriów.</span>
                        </Label>
                    </div>
                </RadioGroup>
            </div>
        </div>

        {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
            Anuluj
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Zapisywanie...' : 'Zatwierdź i przenieś'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
