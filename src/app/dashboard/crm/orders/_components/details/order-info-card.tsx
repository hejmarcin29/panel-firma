import { Mail, Phone, MapPin, User, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Order } from '../../data';

interface OrderInfoCardProps {
  order: Order;
}

export function OrderInfoCard({ order }: OrderInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Dane klienta</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm">
        <div className="grid gap-1">
          <div className="flex items-center gap-2 font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{order.billing.name}</span>
          </div>
          <div className="ml-6 grid gap-1 text-muted-foreground">
            <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${order.billing.email}`} className="hover:text-foreground transition-colors">
                    {order.billing.email}
                </a>
            </div>
            <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${order.billing.phone}`} className="hover:text-foreground transition-colors">
                    {order.billing.phone}
                </a>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-1">
          <div className="flex items-center gap-2 font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>Adres rozliczeniowy</span>
          </div>
          <div className="ml-6 text-muted-foreground">
            <p>{order.billing.street}</p>
            <p>{order.billing.postalCode} {order.billing.city}</p>
          </div>
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-2 font-medium">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>Adres dostawy</span>
          </div>
          <div className="ml-6 text-muted-foreground">
            {order.shipping.sameAsBilling ? (
                <p className="text-xs italic">Taki sam jak rozliczeniowy</p>
            ) : (
                <>
                    <p>{order.shipping.name}</p>
                    <p>{order.shipping.street}</p>
                    <p>{order.shipping.postalCode} {order.shipping.city}</p>
                    <p>{order.shipping.phone}</p>
                </>
            )}
          </div>
        </div>
        
        {order.customerNote && (
            <>
                <Separator />
                <div className="rounded-md bg-muted/50 p-3 text-xs">
                    <span className="font-semibold">Notatka od klienta:</span>
                    <p className="mt-1 text-muted-foreground">{order.customerNote}</p>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}
