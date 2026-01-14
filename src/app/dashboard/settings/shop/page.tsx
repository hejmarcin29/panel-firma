import { getShopConfig, getTpayConfig } from './actions';
import { db } from '@/lib/db';
import { erpProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ShopSettingsForm from './shop-settings-form';

export const dynamic = 'force-dynamic';

export default async function ShopSettingsPage() {
    const config = await getShopConfig();
    const tpayConfig = await getTpayConfig();

    // Fetch products for dropdown
    const availableProducts = await db.query.erpProducts.findMany({
        where: eq(erpProducts.isShopVisible, true),
        columns: {
            id: true,
            name: true,
            price: true,
        }
    });

    return (
        <ShopSettingsForm 
            initialConfig={config} 
            initialTpayConfig={tpayConfig} 
            availableProducts={availableProducts}
        />
    );
}
