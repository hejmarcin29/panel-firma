import 'server-only';

const DEFAULT_SCOPES = ['offline_access', 'invoices', 'warehouse', 'contractors'];

type WfirmaConfig = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	tenant: string;
	scopes: string[];
};

function requireEnv(name: string) {
	const value = process.env[name];
	if (!value || !value.trim()) {
		throw new Error(`Brakuje konfiguracji ${name}. Dodaj ja do .env.local.`);
	}

	return value.trim();
}

export function getWfirmaConfig(): WfirmaConfig {
	const clientId = requireEnv('WFIRMA_CLIENT_ID');
	const clientSecret = requireEnv('WFIRMA_CLIENT_SECRET');
	const redirectUri = requireEnv('WFIRMA_REDIRECT_URI');
	const tenant = requireEnv('WFIRMA_TENANT');

	const scopeEnv = process.env.WFIRMA_SCOPE?.trim();
	const scopes = scopeEnv && scopeEnv.length > 0 ? scopeEnv.split(/[\s,]+/).filter(Boolean) : DEFAULT_SCOPES;

	return { clientId, clientSecret, redirectUri, tenant, scopes };
}

export type { WfirmaConfig };
