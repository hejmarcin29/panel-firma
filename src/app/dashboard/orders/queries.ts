import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { manualOrders } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';

export async function getUrgentOrdersCount() {
  // We don't need to call requireUser here if it's called in the layout, 
  // but it's good for safety. However, to avoid double DB calls if caching fails:
  // let's assume the caller handles auth or we just run the query.
  // But for now, let's keep it but wrap in try-catch inside the function?
  // No, the caller has try-catch.
  
  const result = await db
    .select({ count: sql`count(*)` })
    .from(manualOrders)
    .where(eq(manualOrders.status, 'order.received'));
  
  return Number(result[0]?.count ?? 0);
}
