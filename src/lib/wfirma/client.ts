import 'server-only';

import { createHash, createHmac, randomBytes } from 'node:crypto';

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
	tenant: string;
	appKey: string;
	appSecret: string;
	accessKey: string;
	accessSecret: string;
};

function percentEncode(value: string): string {
	return encodeURIComponent(value)
		.replace(/!/g, '%21')
		.replace(/\*/g, '%2A')
		.replace(/'/g, '%27')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29');
}

export async function callWfirmaApi<T>({
	method = 'GET',
	path,
	body,
	tenant,
	appKey,
	appSecret,
	accessKey,
	accessSecret,
}: RequestOptions): Promise<T> {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const baseUrl = `https://${tenant}.wfirma.pl/api/v2`;
	const [resourcePath, rawQuery] = normalizedPath.split('?', 2);
	const endpointPath = resourcePath || '/';
	const urlWithoutQuery = `${baseUrl}${endpointPath}`;
	const searchParams = new URLSearchParams(rawQuery ?? '');
	const hasBody = typeof body !== 'undefined' && body !== null;
	const serializedBody = hasBody ? JSON.stringify(body) : undefined;
	const oauthParams: Record<string, string> = {
		oauth_consumer_key: appKey,
		oauth_token: accessKey,
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
		oauth_nonce: randomBytes(16).toString('hex'),
		oauth_version: '1.0',
	};

	if (hasBody && serializedBody) {
		oauthParams.oauth_body_hash = createHash('sha1').update(serializedBody, 'utf8').digest('base64');
	}

	const signatureParams: Array<[string, string]> = [];
	searchParams.forEach((value, key) => {
		signatureParams.push([key, value]);
	});
	for (const [key, value] of Object.entries(oauthParams)) {
		signatureParams.push([key, value]);
	}

	signatureParams.sort((a, b) => {
		const [keyA, valueA] = a;
		const [keyB, valueB] = b;
		const keyCompare = percentEncode(keyA).localeCompare(percentEncode(keyB));
		if (keyCompare !== 0) {
			return keyCompare;
		}
		return percentEncode(valueA).localeCompare(percentEncode(valueB));
	});

	const parameterString = signatureParams
		.map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
		.join('&');

	const methodToken = method.toUpperCase();
	const baseString = [methodToken, percentEncode(urlWithoutQuery), percentEncode(parameterString)].join('&');
	const signingKey = `${percentEncode(appSecret)}&${percentEncode(accessSecret)}`;
	const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');
	const authorizationParams = {
		...oauthParams,
		oauth_signature: signature,
	};

	const authorizationHeader = `OAuth ${Object.entries(authorizationParams)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
		.join(', ')}`;

	const url = rawQuery ? `${urlWithoutQuery}?${rawQuery}` : urlWithoutQuery;
	const headers: Record<string, string> = {
		Authorization: authorizationHeader,
		Accept: 'application/json',
		'User-Agent': 'panel-firma-integrator/1.0',
	};

	if (hasBody) {
		headers['Content-Type'] = 'application/json';
	}

	let response: Response;

	try {
		response = await fetch(url, {
			method,
			headers,
			body: serializedBody,
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
