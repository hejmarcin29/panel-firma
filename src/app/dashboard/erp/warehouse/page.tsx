import { getWarehouseStock } from '../actions';
import { WarehouseList } from './warehouse-list';

export default async function WarehousePage() {
  const products = await getWarehouseStock();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Magazyn</h1>
      </div>

      <WarehouseList data={products} />
    </div>
  );
}
