export const runtime = 'nodejs';

export async function GET() {
	return new Response(
		JSON.stringify({
			error: 'Integracja OAuth wFirma została wyłączona. Skonfiguruj login i klucz API w ustawieniach.',
		}),
		{
			status: 410,
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
}
