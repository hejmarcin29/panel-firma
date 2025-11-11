import 'server-only';

import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { integrationLogs, wfirmaTokens } from '@/lib/db/schema';

export type WfirmaTokenRecord = typeof wfirmaTokens.$inferSelect;

export async function getWfirmaToken() {
	const [row] = await db.select().from(wfirmaTokens).limit(1);
	return row ?? null;
}

type UpsertTokenInput = {
	tenant: string;
	accessToken: string;
	refreshToken?: string | null;
	tokenType?: string | null;
	scope?: string | null;
	expiresAt?: number | null;
	createdBy?: string | null;
};

export async function upsertWfirmaToken(input: UpsertTokenInput) {
	const expiresAtValue = typeof input.expiresAt === 'number' ? new Date(input.expiresAt) : null;
	await db
		.insert(wfirmaTokens)
		.values({
			id: crypto.randomUUID(),
			tenant: input.tenant,
			accessToken: input.accessToken,
			refreshToken: input.refreshToken ?? null,
			tokenType: input.tokenType ?? null,
			scope: input.scope ?? null,
			expiresAt: expiresAtValue,
			createdBy: input.createdBy ?? null,
		})
		.onConflictDoUpdate({
			target: wfirmaTokens.tenant,
			set: {
				accessToken: input.accessToken,
				refreshToken: input.refreshToken ?? null,
				updatedAt: sql`(strftime('%s','now') * 1000)`,
				tokenType: input.tokenType ?? null,
				scope: input.scope ?? null,
				expiresAt: expiresAtValue,
				createdBy: input.createdBy ?? null,
			},
		});
}

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

export async function deleteWfirmaTokens() {
	await db.delete(wfirmaTokens).run();
}

export async function deleteWfirmaTokenByTenant(tenant: string) {
	await db.delete(wfirmaTokens).where(eq(wfirmaTokens.tenant, tenant)).run();
}
