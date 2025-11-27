import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

import { getManualOrders } from './actions';
import { OrdersListClient } from './orders-list-client';

export default async function OrdersPage() {
	await requireUser();
	const orders = await getManualOrders();
	return <OrdersListClient initialOrders={orders} />;
}
