import { getInvoices } from '../actions';
import { InvoicesList } from './invoices-list';

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Faktury</h1>
      </div>

      <InvoicesList data={invoices} />
    </div>
  );
}
