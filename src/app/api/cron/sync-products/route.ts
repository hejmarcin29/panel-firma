import { NextResponse } from 'next/server';
import { syncProducts } from '@/lib/sync/products';
import { isSystemAutomationEnabled } from '@/lib/montaze/automation';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
    try {
        const isEnabled = await isSystemAutomationEnabled();
        if (!isEnabled) {
            return NextResponse.json({ success: false, error: 'Automation disabled' }, { status: 200 });
        }

        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // You can set CRON_SECRET in .env.local
            // For now, if not set, maybe allow it or require it.
            // Vercel Cron uses this header.
            if (process.env.CRON_SECRET) {
                 return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        const result = await syncProducts();
        return NextResponse.json({ success: true, count: result.count });
    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
