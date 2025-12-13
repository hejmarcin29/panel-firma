import { NextResponse } from 'next/form';

// Ta zmienna zostanie zainicjowana TYLKO RAZ w momencie startu procesu Node.js (PM2)
// Po każdym restarcie serwera (deployu) będzie miała nową wartość.
const BUILD_TIMESTAMP = Date.now().toString();

export const dynamic = 'force-dynamic'; // Wyłączamy cache Next.js dla tej ścieżki

export async function GET() {
    return NextResponse.json({ 
        version: BUILD_TIMESTAMP,
        serverTime: new Date().toISOString()
    });
}