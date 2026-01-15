import { getShopConfig, getTpayConfig } from './actions';
import { db } from '@/lib/db';
import { erpProducts, erpFloorPatterns } from '@/lib/db/schema';
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

    // Fetch floor patterns for waste configuration
    const floorPatterns = await db.query.erpFloorPatterns.findMany({
        columns: {
            id: true,
            name: true,
            slug: true,
        }
    });

    return (
        <ShopSettingsForm 
            initialConfig={config} 
            initialTpayConfig={tpayConfig} 
            availableProducts={availableProducts}
            floorPatterns={floorPatterns}
        />
    );
}
