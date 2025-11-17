import 'server-only';

type WfirmaConfig = {
	login: string;
	apiKey: string;
	tenant: string;
};

function requireEnv(name: string) {
	const value = process.env[name];
	if (!value || !value.trim()) {
		throw new Error(`Brakuje konfiguracji ${name}. Dodaj ja do .env.local.`);
	}

	return value.trim();
}

export function getWfirmaConfig(): WfirmaConfig {
	const login = requireEnv('WFIRMA_LOGIN');
	const apiKey = requireEnv('WFIRMA_API_KEY');
	const tenant = requireEnv('WFIRMA_TENANT');

	return { login, apiKey, tenant };
}

export function tryGetWfirmaConfig(): WfirmaConfig | null {
	try {
		return getWfirmaConfig();
	} catch {
		return null;
	}
}

export type { WfirmaConfig };
