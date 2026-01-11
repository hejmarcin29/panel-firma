import { getShopProducts } from './actions';
import ShopClient from './ShopClient';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
    const products = await getShopProducts();

    return <ShopClient products={products} />;
}
