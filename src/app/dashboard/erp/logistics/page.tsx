import { getERPOrdersData } from './actions';
import { ERPOrdersBoard } from './_components/erp-orders-board';

export default async function OrdersPage() {
    const data = await getERPOrdersData();

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h2 className="text-lg font-medium">Centrum Logistyczne</h2>
                <p className="text-sm text-muted-foreground">
                    Zarządzanie przepływem towaru: Zapotrzebowanie → Dostawa → Wydanie.
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <ERPOrdersBoard data={data} />
            </div>
        </div>
    );
}
