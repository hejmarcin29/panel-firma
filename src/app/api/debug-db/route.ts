
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Check Connection
        await db.execute(sql`SELECT 1`);
        
        // 2. Check Column
        const columns = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'montages' 
            AND column_name = 'estimated_floor_area'
        `);

        const hasColumn = columns.length > 0;

        // 3. Check Schema vs DB mismatch (simple check)
        // We can't easily check schema definition at runtime here without importing it, 
        // but we know we expect the column.

        return NextResponse.json({
            status: 'ok',
            connection: 'success',
            hasEstimatedFloorArea: hasColumn,
            columnDetails: columns[0] || null,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL
            }
        });

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
