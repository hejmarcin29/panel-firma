import { redirect } from 'next/navigation';

export default function ShopIndexPage() {
    redirect('/dashboard/shop/orders');
}
