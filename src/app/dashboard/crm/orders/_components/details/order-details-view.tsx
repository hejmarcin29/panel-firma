'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatusTimeline } from '../order-status-timeline';
import { OrderAttachments } from '../order-attachments';
import type { Order, OrderDocument, OrderTimelineEntry } from '../../data';
// import { OrderHeader } from './order-header'; // Integrating header directly
import { OrderInfoCard } from './order-info-card';
import { OrderItemsCard } from './order-items-card';
import { OrderDocumentsCard } from './order-documents-card';
import { OrderNotesCard } from './order-notes-card';
import { OrderStatusStepper } from './order-status-stepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, MoreHorizontal, PenSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface OrderDetailsViewProps {
  order: Order;
  documents: OrderDocument[];
  timelineEntries: OrderTimelineEntry[];
}

export function OrderDetailsView({ order, documents, timelineEntries }: OrderDetailsViewProps) {
  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full pb-12">
        
        {/* TOP NAV / BREADCRUMB AREA */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-[-1rem]">
            <Link href="/dashboard/crm/orders" className="hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Wróć do listy
            </Link>
            <span>/</span>
            <span>{order.reference}</span>
        </div>

        {/* HERO SECTION */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{order.reference}</h1>
                    <Badge variant="outline" className="text-sm font-normal py-1 px-3 bg-background">
                        {new Date(order.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Badge>
                    {order.source === 'woocommerce' && (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent">WooCommerce</Badge>
                    )}
                 </div>
                 <p className="text-muted-foreground">{order.billing.name} • {order.billing.email}</p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                 {/* QUICK ACTIONS */}
                 <Button variant="outline" className="flex-1 md:flex-none">
                    <Share2 className="mr-2 h-4 w-4" />
                    Udostępnij
                 </Button>
                 <Button className="flex-1 md:flex-none">
                    <PenSquare className="mr-2 h-4 w-4" />
                    Edytuj
                 </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="border">
                             <MoreHorizontal className="h-4 w-4" />
                         </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem>Zgłoś problem</DropdownMenuItem>
                         <DropdownMenuItem className="text-red-600">Anuluj zamówienie</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            </div>
        </div>

        {/* STEPPER - VISUAL PROGRESS */}
        <div className="w-full bg-card border border-border/50 rounded-xl p-6 shadow-sm">
             <OrderStatusStepper currentStatus={order.status} />
        </div>

        {/* MAIN BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN (2/3) - MAIN CONTENT */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* ITEMS LIST (ENHANCED) */}
                <OrderItemsCard order={order} />
                
                {/* TIMELINE / FEED */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="px-6 py-4 bg-muted/10 border-b border-border/50">
                        <CardTitle className="text-lg">Oś czasu</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <OrderStatusTimeline
                            orderId={order.id}
                            entries={timelineEntries}
                            currentStatus={order.status}
                        />
                    </CardContent>
                </Card>

                {/* ATTACHMENTS */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="px-6 py-4 bg-muted/10 border-b border-border/50">
                         <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Pliki i Załączniki</CardTitle>
                             <Button variant="ghost" size="sm" className="h-8">
                                <FileText className="mr-2 h-3 w-3" />
                                Zarządzaj
                            </Button>
                         </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <OrderAttachments orderId={order.id} customerName={order.billing.name} attachments={order.attachments} />
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN (1/3) - SIDEBAR & CONTEXT */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* CUSTOMER CARD (COMMAND CENTER) */}
                <OrderInfoCard order={order} />

                {/* DOCUMENTS */}
                <OrderDocumentsCard documents={documents} />

                {/* INTERNAL NOTES */}
                <OrderNotesCard orderId={order.id} initialNote={order.customerNote} />

            </div>
        </div>
    </div>
  );
}


// Removing DesktopView / MobileView split. 
// The responsive Grid handles layout changes naturally (1 col on mobile, 3 on desktop).
// Tabs are removed in favor of a long-scroll experience which is standard in 2024/2025 modern SaaS apps.
