import { getSuppliers } from '../actions';
import { AddSupplierDialog } from '../_components/add-supplier-dialog';
import { SuppliersList } from './suppliers-list';

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dostawcy</h1>
        <AddSupplierDialog />
      </div>

      <SuppliersList data={suppliers} />
    </div>
  );
}
