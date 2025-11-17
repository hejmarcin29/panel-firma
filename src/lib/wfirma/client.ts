import 'server-only';

export class WfirmaApiError extends Error {
	constructor(message: string, public status: number, public payload?: unknown) {
		super(message);
		this.name = 'WfirmaApiError';
	}
}

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
	method?: RequestMethod;
	path: string;
	body?: unknown;
	login: string;
	apiKey: string;
	tenant: string;
};

export async function callWfirmaApi<T>({
	method = 'GET',
	path,
	body,
	login,
	apiKey,
	tenant,
}: RequestOptions): Promise<T> {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const baseUrl = `https://${tenant}.wfirma.pl/api/v2`;
	const url = `${baseUrl}${normalizedPath}`;
	const authHeader = Buffer.from(`${login}:${apiKey}`, 'utf8').toString('base64');

	let response: Response;

	try {
		response = await fetch(url, {
			method,
			headers: {
				Authorization: `Basic ${authHeader}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'User-Agent': 'panel-firma-integrator/1.0',
			},
			body: body ? JSON.stringify(body) : undefined,
			cache: 'no-store',
		});
	} catch (networkError) {
		const message = networkError instanceof Error ? networkError.message : String(networkError);
		throw new WfirmaApiError(`Nie udało się połączyć z API wFirma: ${message}`, 0, networkError);
	}

	const raw = await response.text();
	let parsed: unknown = null;

	if (raw) {
		try {
			parsed = JSON.parse(raw);
		} catch (parseError) {
			throw new WfirmaApiError(
				'Niepoprawna odpowiedź JSON z wFirma.',
				response.status,
				{
					body: raw,
					error: parseError instanceof Error ? parseError.message : parseError,
				}
			);
		}
	}

	if (!response.ok) {
		const asRecord = parsed as Record<string, unknown> | null;
		let message = `HTTP ${response.status}`;

		if (asRecord?.status && typeof asRecord.status === 'object') {
			const statusRecord = asRecord.status as Record<string, unknown>;
			if (typeof statusRecord.description === 'string') {
				message = statusRecord.description;
			}
		}
		if (typeof asRecord?.error === 'string') {
			message = asRecord.error;
		}

		throw new WfirmaApiError(message, response.status, parsed ?? raw);
	}

	return parsed as T;
}
