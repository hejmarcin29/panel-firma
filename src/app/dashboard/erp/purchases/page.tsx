import { getPurchaseOrders } from '../actions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PurchasesList } from './purchases-list';

export default async function PurchasesPage() {
  const orders = await getPurchaseOrders();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Zamówienia Zakupu (PO)</h1>
        <Link href="/dashboard/erp/purchases/new">
            <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nowe zamówienie
            </Button>
        </Link>
      </div>

      <PurchasesList data={orders} />
    </div>
  );
}
