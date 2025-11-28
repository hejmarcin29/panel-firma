'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatusTimeline } from '../order-status-timeline';
import { OrderAttachments } from '../order-attachments';
import type { Order, OrderDocument, OrderTimelineEntry } from '../../data';
import { OrderHeader } from './order-header';
import { OrderInfoCard } from './order-info-card';
import { OrderItemsCard } from './order-items-card';
import { OrderSummaryCard } from './order-summary-card';
import { OrderDocumentsCard } from './order-documents-card';
import { OrderNotesCard } from './order-notes-card';

interface OrderDetailsViewProps {
  order: Order;
  documents: OrderDocument[];
  timelineEntries: OrderTimelineEntry[];
}

function DesktopView({ order, documents, timelineEntries }: OrderDetailsViewProps) {
  return (
    <div className="hidden md:grid grid-cols-3 gap-6 p-6 max-w-[1600px] mx-auto w-full">
      <div className="col-span-2 space-y-6">
        <OrderItemsCard order={order} />
        <OrderDocumentsCard documents={documents} />
        <OrderNotesCard orderId={order.id} initialNote={order.customerNote} />
        <Card>
            <CardHeader className="px-4 py-3">
                <CardTitle className="text-base">Załączniki</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
                <OrderAttachments orderId={order.id} customerName={order.billing.name} attachments={order.attachments} />
            </CardContent>
        </Card>
      </div>
      <div className="col-span-1 space-y-6">
        <OrderInfoCard order={order} />
        <OrderSummaryCard order={order} />
        <Card>
            <CardHeader className="px-4 py-3">
                <CardTitle className="text-base">Historia statusów</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
                <OrderStatusTimeline
                    orderId={order.id}
                    entries={timelineEntries}
                    currentStatus={order.status}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MobileView({ order, documents, timelineEntries }: OrderDetailsViewProps) {
  return (
    <div className="md:hidden">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-background p-0 sticky top-0 z-10">
          <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background py-3">Info</TabsTrigger>
          <TabsTrigger value="items" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background py-3">Koszyk</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background py-3">Faktury</TabsTrigger>
        </TabsList>
        
        <div className="p-4 space-y-4 bg-muted/10 min-h-[calc(100vh-180px)]">
            <TabsContent value="info" className="space-y-4 mt-0">
                <OrderInfoCard order={order} />
                <OrderSummaryCard order={order} />
                <OrderNotesCard orderId={order.id} initialNote={order.customerNote} />
                <Card>
                    <CardHeader className="px-4 py-3">
                        <CardTitle className="text-base">Załączniki</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                        <OrderAttachments orderId={order.id} customerName={order.billing.name} attachments={order.attachments} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="items" className="space-y-4 mt-0">
                <OrderItemsCard order={order} />
                <OrderSummaryCard order={order} />
            </TabsContent>
            
            <TabsContent value="invoices" className="space-y-4 mt-0">
                <OrderDocumentsCard documents={documents} />
                <Card>
                    <CardHeader className="px-4 py-3">
                        <CardTitle className="text-base">Historia statusów</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                        <OrderStatusTimeline
                            orderId={order.id}
                            entries={timelineEntries}
                            currentStatus={order.status}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export function OrderDetailsView({ order, documents, timelineEntries }: OrderDetailsViewProps) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/10">
      <OrderHeader order={order} />
      <DesktopView order={order} documents={documents} timelineEntries={timelineEntries} />
      <MobileView order={order} documents={documents} timelineEntries={timelineEntries} />
    </div>
  );
}
