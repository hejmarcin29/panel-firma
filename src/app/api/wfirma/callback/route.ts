export const runtime = 'nodejs';

export async function GET() {
	return new Response(
		JSON.stringify({
			error: 'Integracja OAuth wFirma została wylaczona. Skonfiguruj tenant oraz klucze API w ustawieniach.',
		}),
		{
			status: 410,
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
}
