import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/auth/session';
import { getWfirmaConfig } from '@/lib/wfirma/config';
import { appendWfirmaLog, upsertWfirmaToken } from '@/lib/wfirma/repository';
import { requestToken } from '@/lib/wfirma/oauth';

export const runtime = 'nodejs';

function buildRedirect(requestUrl: string, status: 'connected' | 'error') {
	const target = new URL('/dashboard/settings', requestUrl);
	target.searchParams.set('wfirma', status);
	return target;
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

		const cookieStore = await cookies();
		const expectedState = cookieStore.get('wfirma_oauth_state')?.value;
		const verifier = cookieStore.get('wfirma_oauth_verifier')?.value;

		const clearCookies = (res: NextResponse) => {
			res.cookies.set({ name: 'wfirma_oauth_state', value: '', path: '/', maxAge: 0 });
			res.cookies.set({ name: 'wfirma_oauth_verifier', value: '', path: '/', maxAge: 0 });
			return res;
		};

		if (error) {
			await appendWfirmaLog({
				level: 'error',
				message: 'Bledny powrot z wFirma',
				meta: {
					error,
					errorDescription,
				},
			});
			return clearCookies(NextResponse.redirect(buildRedirect(request.url, 'error')));
		}

		if (!code || !state || !expectedState || state !== expectedState || !verifier) {
			await appendWfirmaLog({
				level: 'error',
				message: 'Nieudana walidacja parametrow OAuth wFirma',
				meta: {
					code: Boolean(code),
					state,
					expectedState,
					hasVerifier: Boolean(verifier),
				},
			});
			return clearCookies(NextResponse.redirect(buildRedirect(request.url, 'error')));
		}

		const user = await requireUser();

		try {
			const config = getWfirmaConfig();

			const token = await requestToken({
				code,
				codeVerifier: verifier,
				clientId: config.clientId,
				clientSecret: config.clientSecret,
				redirectUri: config.redirectUri,
			});

			const expiresAt = token.expires_in ? Date.now() + token.expires_in * 1000 : null;

			await upsertWfirmaToken({
				tenant: config.tenant,
				accessToken: token.access_token,
				refreshToken: token.refresh_token ?? null,
				tokenType: token.token_type ?? 'Bearer',
				scope: token.scope ?? config.scopes.join(' '),
				expiresAt,
				createdBy: user.id,
			});

			revalidatePath('/dashboard/settings');
			await appendWfirmaLog({
				level: 'info',
				message: 'Polaczono integracje wFirma',
				meta: {
					tenant: config.tenant,
					userId: user.id,
				},
			});

			return clearCookies(NextResponse.redirect(buildRedirect(request.url, 'connected')));
		} catch (callbackError) {
			await appendWfirmaLog({
				level: 'error',
				message: 'Blad podczas finalizacji integracji wFirma',
				meta: {
					error: callbackError instanceof Error ? callbackError.message : String(callbackError),
				},
			});
			return clearCookies(NextResponse.redirect(buildRedirect(request.url, 'error')));
		}
}
