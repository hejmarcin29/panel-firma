import { requireUser } from '@/lib/auth/session';

import { ManualOrderFormClient } from '../manual-order-form-client';

export default async function NewManualOrderPage() {
	await requireUser();
	return <ManualOrderFormClient />;
}
