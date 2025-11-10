import { requireUser } from '@/lib/auth/session';

import { getManualOrders } from './actions';
import OrdersOverviewClient from './orders-overview-client';

export default async function OrdersPage() {
	await requireUser();
	const orders = await getManualOrders();
	return <OrdersOverviewClient initialOrders={orders} />;
}
