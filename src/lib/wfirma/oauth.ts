import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

const OAUTH_BASE_URL = 'https://oauth.wfirma.pl/oauth';

function toBase64Url(buffer: Buffer) {
	return buffer
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

export function generateCodeVerifier(length = 64) {
	const size = Math.max(32, Math.min(96, length));
	return toBase64Url(randomBytes(size));
}

export function generateState() {
	return toBase64Url(randomBytes(32));
}

export function computeCodeChallenge(verifier: string) {
	const hash = createHash('sha256').update(verifier).digest();
	return toBase64Url(hash);
}

export type TokenResponse = {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	token_type?: string;
	scope?: string;
	[wildcard: string]: unknown;
};

type TokenRequestOptions = {
	code: string;
	codeVerifier: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
};

export async function requestToken({
	code,
	codeVerifier,
	clientId,
	clientSecret,
	redirectUri,
}: TokenRequestOptions) {
	const tokenUrl = `${OAUTH_BASE_URL}/token`;

	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
		client_id: clientId,
		client_secret: clientSecret,
		code_verifier: codeVerifier,
	});

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		},
		body: body.toString(),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Nie udalo sie pobrac tokena z wFirma. Status ${response.status}: ${errorBody}`);
	}

	const payload = (await response.json()) as TokenResponse;

	if (!payload.access_token) {
		throw new Error('Odpowiedz wFirma nie zawiera poprawnego access_token.');
	}

	return payload;
}

type RefreshRequestOptions = {
	refreshToken: string;
	clientId: string;
	clientSecret: string;
};

export async function refreshToken({ refreshToken, clientId, clientSecret }: RefreshRequestOptions) {
	const tokenUrl = `${OAUTH_BASE_URL}/token`;

	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: clientId,
		client_secret: clientSecret,
	});

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
		},
		body: body.toString(),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Nie udalo sie odswiezyc tokena wFirma. Status ${response.status}: ${errorBody}`);
	}

	const payload = (await response.json()) as TokenResponse;

	if (!payload.access_token) {
		throw new Error('Odpowiedz wFirma po refreshu nie zawiera access_token.');
	}

	return payload;
}
