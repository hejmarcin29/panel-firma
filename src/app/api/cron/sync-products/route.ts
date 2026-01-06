import { NextResponse } from 'next/server';
import { syncProducts } from '@/lib/sync/products';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
    try {
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
