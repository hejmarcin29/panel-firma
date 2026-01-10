"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Phone, Mail, MapPin, Copy, Truck } from "lucide-react";
import { Order } from "../../data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function OrderInfoCard({ order }: { order: Order }) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Skopiowano ${label}`);
  };

  const address = [
    order.billing.street,
    order.billing.city,
    order.billing.postalCode
  ].filter(Boolean).join(', ');

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {order.billing.name}
                </CardTitle>
                <CardDescription className="text-xs">
                     Klient
                </CardDescription>
            </div>
            {/* Avatar placeholder or initials */}
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm select-none">
                {order.billing.name ? order.billing.name.substring(0,2).toUpperCase() : "??"}
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
         <div className="divide-y divide-border/50">
            {/* Email Contact */}
            <div className="p-4 hover:bg-muted/20 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> Email
                    </span>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(order.billing.email, "email")}
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                     <span className="text-sm font-medium truncate pr-4" title={order.billing.email}>
                        {order.billing.email}
                     </span>
                     <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                        <a href={`mailto:${order.billing.email}`}>Napisz</a>
                     </Button>
                </div>
            </div>

            {/* Phone Contact */}
            <div className="p-4 hover:bg-muted/20 transition-colors group">
                 <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> Telefon
                    </span>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(order.billing.phone, "telefon")}
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
                 <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">
                        {order.billing.phone}
                     </span>
                     <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2" asChild>
                            <a href={`sms:${order.billing.phone}`}>SMS</a>
                        </Button>
                         <Button size="sm" variant="outline" className="h-7 text-xs px-2" asChild>
                            <a href={`tel:${order.billing.phone}`}>Połącz</a>
                        </Button>
                     </div>
                </div>
            </div>

            {/* Billing Address */}
            <div className="p-4 hover:bg-muted/20 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Adres rozliczeniowy
                    </span>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(address, "adres")}
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
                <div className="text-sm leading-relaxed mb-3">
                   {order.billing.street}<br/>
                   {order.billing.postalCode} {order.billing.city}
                </div>
                <Button size="sm" variant="secondary" className="w-full h-8 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100" asChild>
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="mr-1.5 h-3 w-3" /> 
                        Otwórz mapę
                    </a>
                </Button>
            </div>

             {/* Shipping Note/Address if different */}
             {!order.shipping.sameAsBilling && (
                  <div className="p-4 bg-amber-50/50 hover:bg-amber-50 transition-colors group">
                    <div className="flex items-center mb-1 gap-2">
                        <Truck className="h-3 w-3 text-amber-600" />
                        <span className="text-xs font-medium text-amber-800">
                             Inny adres dostawy
                        </span>
                    </div>
                    <div className="text-sm leading-relaxed text-amber-900/80">
                        {order.shipping.name}<br/>
                        {order.shipping.street}<br/>
                        {order.shipping.postalCode} {order.shipping.city}
                    </div>
                </div>
             )}
         </div>
      </CardContent>
    </Card>
  );
}
