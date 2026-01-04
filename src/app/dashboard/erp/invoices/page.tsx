import { getInvoices, getInvoiceAttachments } from '../actions';
import { InvoicesList } from './invoices-list';
import { PendingInvoicesList } from './pending-invoices-list';

export default async function InvoicesPage() {
  const [invoices, invoiceAttachments] = await Promise.all([
    getInvoices(),
    getInvoiceAttachments()
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Faktury</h1>
      </div>

      <PendingInvoicesList data={invoiceAttachments} />
      <InvoicesList data={invoices} />
    </div>
  );
}
