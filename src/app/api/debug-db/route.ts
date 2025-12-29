
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

        // 3. Try to fetch one record using Drizzle ORM
        let montageCheck = null;
        let montageError = null;
        try {
            montageCheck = await db.query.montages.findFirst({
                columns: {
                    id: true,
                    clientName: true,
                    estimatedFloorArea: true // Explicitly ask for this column
                }
            });
        } catch (e) {
            montageError = e instanceof Error ? e.message : String(e);
        }

        return NextResponse.json({
            status: 'ok',
            connection: 'success',
            hasEstimatedFloorArea: hasColumn,
            columnDetails: columns[0] || null,
            drizzleQuery: {
                success: !montageError,
                data: montageCheck,
                error: montageError
            },
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
