import 'server-only';

import { db } from '@/lib/db';
import { integrationLogs } from '@/lib/db/schema';

type LogOptions = {
	level: 'info' | 'warning' | 'error';
	message: string;
	meta?: Record<string, unknown> | null;
};

export async function appendWfirmaLog({ level, message, meta }: LogOptions) {
	await db.insert(integrationLogs).values({
		id: crypto.randomUUID(),
		integration: 'wfirma',
		level,
		message,
		meta: meta ? JSON.stringify(meta) : null,
	});
}
