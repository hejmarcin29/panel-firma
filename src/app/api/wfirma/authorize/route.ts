import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth/session';
import { getWfirmaConfig } from '@/lib/wfirma/config';
import { computeCodeChallenge, generateCodeVerifier, generateState } from '@/lib/wfirma/oauth';

export const runtime = 'nodejs';

export async function GET() {
	await requireUser();

	const config = getWfirmaConfig();
	const verifier = generateCodeVerifier();
	const challenge = computeCodeChallenge(verifier);
	const state = generateState();

	const secure = process.env.NODE_ENV === 'production';
	const maxAge = 10 * 60; // 10 minutes

	const authorizeUrl = new URL('https://oauth.wfirma.pl/oauth/authorize');
	authorizeUrl.searchParams.set('response_type', 'code');
	authorizeUrl.searchParams.set('client_id', config.clientId);
	authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
	authorizeUrl.searchParams.set('scope', config.scopes.join(' '));
	authorizeUrl.searchParams.set('state', state);
	authorizeUrl.searchParams.set('code_challenge', challenge);
	authorizeUrl.searchParams.set('code_challenge_method', 'S256');

	const response = NextResponse.redirect(authorizeUrl);

	response.cookies.set({
		name: 'wfirma_oauth_state',
		value: state,
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		maxAge,
	});

	response.cookies.set({
		name: 'wfirma_oauth_verifier',
		value: verifier,
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		maxAge,
	});

	return response;
}
