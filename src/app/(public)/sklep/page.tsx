import { getShopProducts, getCustomerByToken } from './actions';
import ShopClient from './ShopClient';

export const dynamic = 'force-dynamic';

export default async function ShopPage(props: { searchParams: Promise<{ token?: string }> }) {
    const searchParams = await props.searchParams;
    const token = searchParams.token;

    const [products, customer] = await Promise.all([
        getShopProducts(),
        token ? getCustomerByToken(token) : Promise.resolve(undefined)
    ]);

    const customerData = customer ? {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        billingStreet: customer.billingStreet,
        billingCity: customer.billingCity,
        billingPostalCode: customer.billingPostalCode,
        taxId: customer.taxId,
    } : undefined;

    return <ShopClient products={products} customerData={customerData} token={token} />;
}
