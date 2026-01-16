import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

// import { createOrder } from '@/app/dashboard/crm/ordersWP/actions';
import { db } from '@/lib/db';
import { integrationLogs } from '@/lib/db/schema';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
// import { mapWooOrderToManualOrderPayload } from '@/lib/woocommerce/map-order';
import type { WooOrder } from '@/lib/woocommerce/types';
import { isSystemAutomationEnabled } from '@/lib/montaze/automation';

export const runtime = 'nodejs';

function verifySignature(rawBody: string, providedSignature: string | null, secret: string) {
	if (!providedSignature) {
		return false;
	}

	const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
	return digest === providedSignature;
}

async function logIntegration(level: 'info' | 'warning' | 'error', message: string, meta: Record<string, unknown>) {
	await db.insert(integrationLogs).values({
		id: crypto.randomUUID(),
		integration: 'woocommerce',
		level,
		message,
		meta: JSON.stringify(meta),
	});
}

export async function POST(request: NextRequest) {
	const secret = await getAppSetting(appSettingKeys.wooWebhookSecret);
	if (!secret) {
		return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
	}

	const signature = request.headers.get('x-wc-webhook-signature');
	const rawBody = await request.text();

    const isEnabled = await isSystemAutomationEnabled('webhook_woo_order');
    if (!isEnabled) {
        await logIntegration('warning', 'Webhook ignored (automation disabled)', {});
        return NextResponse.json({ ok: true, ignored: true });
    }

	const isValid = verifySignature(rawBody, signature, secret);
	if (!isValid) {
		await logIntegration('warning', 'Invalid webhook signature', { signature });
		return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
	}

	let payload: WooOrder;
	try {
		payload = JSON.parse(rawBody) as WooOrder;
	} catch (error) {
		await logIntegration('error', 'Failed to parse webhook payload', {
			error: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
	}

	try {
        // TODO: Migrated to shop/orders module. Logic from 'manualOrders' removed.
		// const manualPayload = mapWooOrderToManualOrderPayload(payload);
		// await createOrder(manualPayload, 'woocommerce-webhook');
		await logIntegration('info', 'WooCommerce order received but skipped (migration pending)', {
			orderId: payload.id,
			orderNumber: payload.number,
		});
		return NextResponse.json({ ok: true });
	} catch (error) {
		await logIntegration('error', 'Failed to process WooCommerce webhook', {
			error: error instanceof Error ? error.message : String(error),
			orderId: payload.id,
		});
		const status = error instanceof Error && error.message.includes('reference') ? 409 : 500;
		return NextResponse.json({ error: 'Processing failed' }, { status });
	}
}
