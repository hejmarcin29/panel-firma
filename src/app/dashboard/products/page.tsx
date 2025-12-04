import { getProducts } from './actions';
import { ProductsListClient } from './products-list-client';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    await requireUser();
    
    const resolvedSearchParams = await searchParams;
    const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
    const perPage = 20;

    const { products, total, totalPages } = await getProducts(page, perPage);

    return (
        <ProductsListClient 
            initialProducts={products} 
            initialTotal={total} 
            initialTotalPages={totalPages}
            currentPage={page}
        />
    );
}
