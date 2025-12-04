import { getProducts, getCategories, getAttributes, getAttributeTerms, WooCommerceAttributeTerm } from './actions';
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
    const categoryId = typeof resolvedSearchParams.category === 'string' ? parseInt(resolvedSearchParams.category) : undefined;
    const brandTermId = typeof resolvedSearchParams.brand === 'string' ? parseInt(resolvedSearchParams.brand) : undefined;
    const perPage = 20;

    const [productsData, categories, attributes] = await Promise.all([
        getProducts(page, perPage, categoryId, brandTermId),
        getCategories(),
        getAttributes()
    ]);

    // Find "Brand" or "Marka" attribute
    const brandAttribute = attributes.find(attr => 
        attr.name.toLowerCase() === 'marka' || 
        attr.name.toLowerCase() === 'brand' || 
        attr.slug.toLowerCase().includes('brand') ||
        attr.slug.toLowerCase().includes('marka')
    );

    let brandTerms: WooCommerceAttributeTerm[] = [];
    if (brandAttribute) {
        brandTerms = await getAttributeTerms(brandAttribute.id);
    }

    return (
        <ProductsListClient 
            initialProducts={productsData.products} 
            initialTotal={productsData.total} 
            initialTotalPages={productsData.totalPages}
            currentPage={page}
            categories={categories}
            brandTerms={brandTerms}
        />
    );
}
