import { getShopProducts } from '../actions';
import ShopClient from '../ShopClient';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ShopTokenPage({ params }: { params: { token: string } }) {
    const products = await getShopProducts();
    
    // Find customer by token
    // Note: Schema has referralToken, but let's assume we use customer ID or specific token logic
    // For now, I'll assume token might be customer ID or referral token.
    // The spec said "/sklep/[token]" uses a token to find customer.
    // Let's assume it searches by referralToken for safety, or ID if UUID.
    // Spec said: "Token będzie unikalnym kluczem przypisanym do klienta... referralToken".
    
    const token = params.token;
    const customer = await db.query.customers.findFirst({
        where: eq(customers.referralToken, token),
    });

    return <ShopClient products={products as any[]} customerData={customer} token={token} />;
}
